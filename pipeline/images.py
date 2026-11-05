"""Pagine degli articoli: foto (og:image) e descrizione ufficiale (og:description o meta description).

- Foto: sempre in hotlink (Eddy non scarica né ospita le foto), credito "Foto: <testata>". Si usa quella del feed;
  se manca, solo per l'articolo principale di una storia si legge la pagina (al massimo OG_BUDGET pagine per giro).
- Descrizione: se l'estratto del feed è più corto di SHORT_EXTRACT caratteri, si prende la descrizione ufficiale
  della pagina, cioè il breve riassunto che la testata stessa scrive per i motori di ricerca e i social
  (al massimo DESC_BUDGET pagine per giro). Mai il testo dell'articolo.
Ogni pagina si legge una volta sola: l'esito resta in cache nello stato.
"""
from __future__ import annotations

import html
import re
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

from clean import clean_extract
from common import NOW, fetch, iso, log, parse_iso

OG_BUDGET = 60
DESC_BUDGET = 150
SHORT_EXTRACT = 120
RETRY_DAYS = 3  # una pagina che non ha risposto si riprova dopo 3 giorni

_IMG_IN_HTML = re.compile(r"<img[^>]+src=[\"']([^\"']+)[\"']", re.I)
_BAD = re.compile(r"(logo|placeholder|default[-_]?(image|img|thumb)|blank|spacer|avatar|sprite|pixel|1x1|favicon|gravatar|feedburner|\.svg(\?|$)|\.gif(\?|$))", re.I)
_META = re.compile(r"<meta\b[^>]*>", re.I)
_ATTR = re.compile(r"([a-zA-Z:-]+)\s*=\s*(\"([^\"]*)\"|'([^']*)')")


def _good(url: str | None) -> str | None:
    if not url or not url.startswith(("http://", "https://")) or _BAD.search(url):
        return None
    return url


def image_from_entry(entry) -> str | None:
    """Immagine dichiarata nel feed (media:content, media:thumbnail, enclosure, <img> nel testo)."""
    best, best_w = None, -1
    for key in ("media_content", "media_thumbnail"):
        for m in entry.get(key) or []:
            u = _good(m.get("url"))
            if not u or (m.get("medium") and m.get("medium") != "image"):
                continue
            try:
                w = int(m.get("width") or 0)
            except ValueError:
                w = 0
            if w > best_w:
                best, best_w = u, w
    if best:
        return best
    for link in entry.get("links") or []:
        if link.get("rel") == "enclosure" and str(link.get("type", "")).startswith("image"):
            u = _good(link.get("href"))
            if u:
                return u
    body = (entry.get("summary") or "") + "".join(c.get("value", "") for c in entry.get("content") or [])
    for m in _IMG_IN_HTML.finditer(body):
        u = _good(html.unescape(m.group(1)))
        if u:
            return u
    return None


def _page_meta(url: str) -> dict:
    """Legge l'inizio della pagina e restituisce {"img", "desc"} (anche vuoti)."""
    final, data = fetch(url, timeout=12, max_bytes=400_000, accept="text/html,application/xhtml+xml")
    page = data.decode("utf-8", "ignore")
    found: dict = {}
    for tag in _META.findall(page):
        attrs = {m.group(1).lower(): html.unescape(m.group(3) if m.group(3) is not None else m.group(4)) for m in _ATTR.finditer(tag)}
        name = (attrs.get("property") or attrs.get("name") or "").lower()
        content = (attrs.get("content") or "").strip()
        if name and content and name not in found:
            found[name] = content
    img = found.get("og:image") or found.get("og:image:url") or found.get("twitter:image") or found.get("twitter:image:src")
    desc = found.get("og:description") or found.get("description") or found.get("twitter:description")
    return {"img": _good(urllib.parse.urljoin(final, img)) if img else None, "desc": desc or None}


def _fresh(entry: dict | None) -> bool:
    if not entry:
        return False
    last = parse_iso(entry.get("at"))
    return bool(last) and NOW - last < timedelta(days=RETRY_DAYS) or entry.get("ok") is True


def _read_pages(urls: list[str], cache: dict) -> int:
    def work(u):
        try:
            return u, _page_meta(u), True
        except Exception:  # noqa: BLE001 (rete: si riprova più avanti)
            return u, {}, False

    done = 0
    with ThreadPoolExecutor(8) as ex:
        for u, meta, ok in ex.map(work, urls):
            cache[u] = {"img": meta.get("img"), "desc": meta.get("desc"), "ok": ok, "at": iso(NOW)}
            done += ok
    return done


def fill_descriptions(articles: list[dict], cache: dict) -> int:
    """Per gli articoli con un estratto corto, usa la descrizione ufficiale della pagina se è più ricca."""
    short = [a for a in articles if a["via"] == "feed" and len(a.get("extract") or "") < SHORT_EXTRACT]
    todo = [a["url"] for a in sorted(short, key=lambda a: a.get("published") or NOW, reverse=True) if not _fresh(cache.get(a["url"]))]
    read = _read_pages(todo[:DESC_BUDGET], cache)
    improved = 0
    for a in short:
        desc = (cache.get(a["url"]) or {}).get("desc")
        if not desc:
            continue
        text = clean_extract(desc, a["title"])
        if len(text) > len(a.get("extract") or ""):
            a["extract"] = text
            improved += 1
    log(f"descrizioni: {len(todo[:DESC_BUDGET])} pagine lette ({read} riuscite), {improved} estratti arricchiti")
    return improved


def fill_og_images(articles: list[dict], cache: dict) -> int:
    """Cerca og:image per gli articoli indicati (principali delle storie senza foto)."""
    todo = [a["url"] for a in articles if not _fresh(cache.get(a["url"]))][:OG_BUDGET]
    _read_pages(todo, cache)
    found = 0
    for a in articles:
        img = (cache.get(a["url"]) or {}).get("img")
        if img:
            a["image"] = img
            found += 1
    log(f"og:image: {len(todo)} pagine lette, {found} foto trovate")
    return found


def prune_cache(cache: dict, keep_urls: set) -> None:
    limit = NOW - timedelta(days=7)
    for u in [u for u, c in cache.items() if u not in keep_urls and (parse_iso(c.get("at")) or limit) <= limit]:
        cache.pop(u, None)
