"""Foto delle storie: sempre in hotlink (Eddy non scarica né ospita le foto), credito "Foto: <testata>".

1. Si usa l'immagine indicata nel feed.
2. Se manca, solo per l'articolo principale di una storia si legge la pagina e si prende og:image
   (al massimo OG_BUDGET pagine per giro; l'esito resta in cache nello stato e non si ripete).
"""
from __future__ import annotations

import html
import re
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

from common import NOW, fetch, iso, log, parse_iso

OG_BUDGET = 60
OG_RETRY_DAYS = 3  # una pagina senza foto si riprova dopo 3 giorni

_IMG_IN_HTML = re.compile(r"<img[^>]+src=[\"']([^\"']+)[\"']", re.I)
_OG = re.compile(r"<meta[^>]+(?:property|name)=[\"'](?:og:image|twitter:image)(?::src|:url)?[\"'][^>]*content=[\"']([^\"']+)[\"']", re.I)
_OG2 = re.compile(r"<meta[^>]+content=[\"']([^\"']+)[\"'][^>]*(?:property|name)=[\"'](?:og:image|twitter:image)(?::src|:url)?[\"']", re.I)
_BAD = re.compile(r"(logo|placeholder|default[-_]?(image|img|thumb)|blank|spacer|avatar|sprite|pixel|1x1|favicon|gravatar|feedburner|\.svg(\?|$)|\.gif(\?|$))", re.I)


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


def _og_image(url: str) -> str | None:
    final, data = fetch(url, timeout=12, max_bytes=400_000, accept="text/html,application/xhtml+xml")
    page = data.decode("utf-8", "ignore")
    m = _OG.search(page) or _OG2.search(page)
    return _good(urllib.parse.urljoin(final, html.unescape(m.group(1)).strip())) if m else None


def fill_og_images(articles: list[dict], cache: dict) -> int:
    """Cerca og:image per gli articoli indicati (già scelti come principali e senza foto). Restituisce quante trovate."""
    todo, found = [], 0
    for a in articles:
        c = cache.get(a["url"])
        if c:
            if c.get("img"):
                a["image"] = c["img"]
                found += 1
                continue
            last = parse_iso(c.get("at"))
            if last and NOW - last < timedelta(days=OG_RETRY_DAYS):
                continue
        todo.append(a)
    todo = todo[:OG_BUDGET]

    def work(a):
        try:
            return a, _og_image(a["url"]), True
        except Exception:  # noqa: BLE001 (rete: si riprova al prossimo giro senza segnarlo)
            return a, None, False

    with ThreadPoolExecutor(8) as ex:
        for a, img, ok in ex.map(work, todo):
            if ok:
                cache[a["url"]] = {"img": img, "at": iso(NOW)}
            if img:
                a["image"] = img
                found += 1
    log(f"og:image: {len(todo)} pagine lette, {found} foto trovate")
    return found


def prune_cache(cache: dict, keep_urls: set) -> None:
    limit = NOW - timedelta(days=7)
    for u in [u for u, c in cache.items() if u not in keep_urls and (parse_iso(c.get("at")) or limit) <= limit]:
        cache.pop(u, None)
