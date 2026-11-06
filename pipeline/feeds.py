"""Lettura dei feed delle fonti abilitate in data/sources.json.

Ogni fonte può avere più feed (sezioni): "feeds": [{"url", "topic", "area", "section"}]. Se manca "feeds",
si usa "feed_url". L'argomento della sezione (es. economia) e l'area (esteri -> mondo) passano agli articoli.

Le fonti con "via": "google_news" (testate che bloccano i programmi o non hanno feed) si leggono dalla ricerca
di Google News. Questi articoli hanno solo titolo, testata e link: non creano storie, servono solo ad aggiungere
"Leggi su <testata>" a una storia già esistente. Ogni testata si interroga al massimo ogni GN_REFRESH_HOURS ore
(per non pesare su Google) e i risultati restano nello stato fra un giro e l'altro.
"""
from __future__ import annotations

import re
import socket
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import feedparser

from clean import clean_extract, clean_title
from common import NOW, fetch, host, iso, log, normalize_url, parse_iso, short_hash
from images import image_from_entry

MAX_PER_FEED = 25
WINDOW_HOURS = 72
GN_REFRESH_HOURS = 3
GN_PER_RUN = 35       # testate Google News aggiornate al massimo per giro
GN_PER_SOURCE = 40
FEED_ACCEPT = "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.5"

socket.setdefaulttimeout(25)


def feeds_of(src: dict) -> list[dict]:
    if src.get("feeds"):
        return src["feeds"]
    return [{"url": src["feed_url"]}] if src.get("feed_url") else []


def _entry_date(e) -> datetime | None:
    t = e.get("published_parsed") or e.get("updated_parsed")
    if not t:
        return None
    try:
        return datetime(*t[:6], tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None


def _read(src: dict, feed: dict) -> tuple[list[dict], str | None]:
    """Legge un feed e restituisce (articoli, errore)."""
    try:
        _, data = fetch(feed["url"], timeout=25, accept=FEED_ACCEPT)
    except Exception as ex:  # noqa: BLE001
        return [], f"{type(ex).__name__}: {str(ex)[:80]}"
    parsed = feedparser.parse(data)
    if not parsed.entries:
        # un feed valido ma vuoto (es. nessun articolo negli ultimi 2 giorni su Google News) non è un errore
        return [], None if (parsed.get("version") or parsed.get("feed")) else "feed non valido"
    entries = sorted(parsed.entries, key=lambda e: _entry_date(e) or NOW, reverse=True)[:MAX_PER_FEED]
    out = []
    gn = src.get("via") == "google_news"
    for e in entries:
        link = e.get("link")
        title = clean_title(e.get("title"), src["name"])
        if not link or not title:
            continue
        if gn:
            # Google News aggiunge " - Testata" in fondo e mescola a volte altri siti: teniamo solo quelli giusti
            # anche più volte ("… - EFE - EFE") e comunque il nome della testata in fondo
            for _ in range(3):
                title = re.sub(r"\s+[-–—|]\s+[^-–—|]{2,60}$", "", title).strip() or title
            for _ in range(3):  # il nome della testata in fondo, anche ripetuto
                title = re.sub(r"\s+[-–—|]\s+" + re.escape(src["name"]) + r"\s*$", "", title, flags=re.I).strip() or title
            src_url = (e.get("source") or {}).get("href") or ""
            dom = src.get("gn_domain", "").split("/")[0]
            if src_url and dom and not host(src_url).endswith(dom):
                continue
        url = link if gn else normalize_url(link)
        raw = "" if gn else (e.get("summary") or (e.get("content") or [{}])[0].get("value", ""))
        out.append({
            "id": short_hash(url),
            "source_id": src["id"],
            "source": src["name"],
            "lang": src.get("language") or "it",
            "src_area": src.get("area") or "italia",
            "section": feed.get("section"),
            "topic_hint": feed.get("topic"),
            "area_hint": feed.get("area"),
            "default_topics": list(src.get("topics") or []),
            "title": title,
            "extract": "" if gn else clean_extract(raw, title),
            "url": url,
            "published": _entry_date(e),
            "image": None if gn else image_from_entry(e),
            "via": "google_news" if gn else "feed",
        })
    return out, None


def read_all(sources: list[dict], gn_cache: dict) -> tuple[list[dict], dict]:
    """Legge tutti i feed (in parallelo). Restituisce gli articoli e un piccolo resoconto."""
    jobs = []
    gn_refresh = []
    for s in sources:
        if s.get("via") == "google_news":
            c = gn_cache.get(s["id"]) or {}
            last = parse_iso(c.get("fetched"))
            if not last or NOW - last >= timedelta(hours=GN_REFRESH_HOURS):
                gn_refresh.append((last or datetime(2000, 1, 1, tzinfo=timezone.utc), s))
        else:
            for f in feeds_of(s):
                jobs.append((s, f))
    gn_refresh.sort(key=lambda x: x[0])
    gn_jobs = [(s, feeds_of(s)[0]) for _, s in gn_refresh[:GN_PER_RUN] if feeds_of(s)]

    report = {"feeds_ok": 0, "feeds_err": [], "gn_refreshed": 0}
    articles = []
    # per educazione: i feed dello stesso sito uno dopo l'altro, siti diversi in parallelo
    by_host: dict = {}
    for j in jobs:
        by_host.setdefault(host(j[1]["url"]), []).append(j)

    def read_host(host_jobs):
        return [(j, _read(*j)) for j in host_jobs]

    with ThreadPoolExecutor(16) as ex:
        for results in ex.map(read_host, by_host.values()):
            for (s, f), (items, err) in results:
                if err:
                    report["feeds_err"].append(f"{s['id']} [{f.get('section') or 'feed'}]: {err}")
                else:
                    report["feeds_ok"] += 1
                articles.extend(items)
    # Google News: poche richieste alla volta
    with ThreadPoolExecutor(4) as ex:
        for (s, f), (items, err) in zip(gn_jobs, ex.map(lambda j: _read(*j), gn_jobs)):
            if err:
                report["feeds_err"].append(f"{s['id']} [google news]: {err}")
                continue
            gn_cache[s["id"]] = {"fetched": iso(NOW), "items": [
                {"title": a["title"], "url": a["url"], "published": iso(a["published"])} for a in items[:GN_PER_SOURCE]]}
            report["gn_refreshed"] += 1
    # articoli Google News dalla cache (anche delle testate non aggiornate in questo giro)
    by_id = {s["id"]: s for s in sources}
    cutoff = NOW - timedelta(hours=WINDOW_HOURS)
    for sid in list(gn_cache):
        s = by_id.get(sid)
        if not s or s.get("via") != "google_news":
            gn_cache.pop(sid)
            continue
        for it in gn_cache[sid].get("items", []):
            d = parse_iso(it.get("published"))
            if d and d < cutoff:
                continue
            articles.append({"id": short_hash(it["url"]), "source_id": sid, "source": s["name"],
                             "lang": s.get("language") or "en", "src_area": s.get("area") or "mondo", "section": None,
                             "topic_hint": None, "area_hint": None, "default_topics": [], "title": it["title"],
                             "extract": "", "url": it["url"], "published": d, "image": None, "via": "google_news"})
    return articles, report
