#!/usr/bin/env python3
"""Trova e verifica i feed RSS/Atom delle fonti in data/sources.json.

Uso:  python scripts/discover_feeds.py [--only id1,id2] [--limit N] [--workers 12]
Solo libreria standard. Va eseguito dove c'è internet libero (il tuo Mac o GitHub Actions).
Scrive: data/sources.json (feed_url, feed_status) e data/feeds_report.json.
feed_status: ok | nessun_feed | sito_non_raggiungibile
NON verifica le licenze: quelle restano 'da_verificare' finché non le controlli a mano.
"""
import argparse, json, re, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path

UA = "EddyBot/0.1 (+https://github.com/Fi2ippo/eddy; lettore di notizie non commerciale)"
COMMON = ["/feed", "/feed/", "/rss", "/rss.xml", "/feed.xml", "/atom.xml", "/index.xml",
          "/rss/all.xml", "/feeds/all.rss.xml", "/news/rss.xml", "/?feed=rss2"]
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "sources.json"

class Redirect308(urllib.request.HTTPRedirectHandler):
    """Python 3.9 non segue i redirect 308 (lo fa solo dalla 3.11): li trattiamo come 307."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return super().redirect_request(req, fp, 307 if code == 308 else code, msg, headers, newurl)
    http_error_308 = urllib.request.HTTPRedirectHandler.http_error_302

OPENER = urllib.request.build_opener(Redirect308)

def get(url, timeout=12, maxbytes=600_000):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with OPENER.open(req, timeout=timeout) as r:
        return r.geturl(), r.headers.get("content-type", ""), r.read(maxbytes)

class LinkFinder(HTMLParser):
    def __init__(self):
        super().__init__(); self.feeds = []
    def handle_starttag(self, tag, a):
        if tag != "link": return
        a = dict(a)
        if "alternate" in (a.get("rel") or "").lower() and (a.get("type") or "").lower() in (
                "application/rss+xml", "application/atom+xml", "application/xml", "text/xml"):
            if a.get("href"): self.feeds.append(a["href"])

def looks_like_feed(body: bytes) -> bool:
    head = body[:3000].decode("utf-8", "ignore").lower()
    return "<rss" in head or "<feed" in head or "<rdf:rdf" in head

def check(url):
    try:
        final, _, body = get(url)
        return final if looks_like_feed(body) else None
    except Exception:
        return None

def discover(src):
    site = src["site"]; res = {"id": src["id"], "feed_url": None, "status": "nessun_feed", "tried": []}
    try:
        final, _, html = get(site)
    except Exception as e:
        res["status"] = "sito_non_raggiungibile"; res["error"] = str(e)[:120]; return res
    if looks_like_feed(html):
        res.update(feed_url=final, status="ok"); return res
    lf = LinkFinder()
    try: lf.feed(html.decode("utf-8", "ignore"))
    except Exception: pass
    cands = [urllib.parse.urljoin(final, h) for h in lf.feeds]
    base = "{0.scheme}://{0.netloc}".format(urllib.parse.urlparse(final))
    cands += [base + p for p in COMMON]
    for c in dict.fromkeys(cands):
        res["tried"].append(c)
        ok = check(c)
        if ok:
            res.update(feed_url=ok, status="ok"); break
    return res

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only"); ap.add_argument("--limit", type=int); ap.add_argument("--workers", type=int, default=12)
    ap.add_argument("--all", action="store_true", help="anche fonti fase2 e non in selezione iniziale")
    a = ap.parse_args()
    sources = json.loads(SRC.read_text())
    todo = [s for s in sources if (a.all or (s["mode"] == "news" and s["in_initial_selection"]))]
    if a.only: ids = set(a.only.split(",")); todo = [s for s in todo if s["id"] in ids]
    if a.limit: todo = todo[:a.limit]
    print(f"Controllo {len(todo)} fonti…", file=sys.stderr)
    with ThreadPoolExecutor(a.workers) as ex:
        results = list(ex.map(discover, todo))
    byid = {r["id"]: r for r in results}
    for s in sources:
        r = byid.get(s["id"])
        if r: s["feed_url"], s["feed_status"] = r["feed_url"], r["status"]
    SRC.write_text(json.dumps(sources, ensure_ascii=False, indent=1))
    (ROOT / "data" / "feeds_report.json").write_text(json.dumps(results, ensure_ascii=False, indent=1))
    c = {}
    for r in results: c[r["status"]] = c.get(r["status"], 0) + 1
    print("Risultato:", c, file=sys.stderr)

if __name__ == "__main__":
    main()
