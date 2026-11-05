"""Parti comuni della raccolta: percorsi, lettura/scrittura JSON, rete, date e messaggi.

Gira con Python 3.9 (Mac) e 3.12 (GitHub Actions): niente sintassi più recente.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = "EddyBot/0.2 (+https://github.com/Fi2ippo/eddy; lettore di notizie non commerciale)"
NOW = datetime.now(timezone.utc)


def log(*parts):
    print("[eddy]", *parts, file=sys.stderr, flush=True)


def iso(dt: datetime | None) -> str | None:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if dt else None


def parse_iso(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None


def short_hash(text: str, n: int = 12) -> str:
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:n]


def load_json(path: Path, default):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except FileNotFoundError:
        return default
    except (json.JSONDecodeError, OSError) as ex:
        log("file non leggibile, riparto da zero:", path, ex)
        return default


def dump_json(path: Path, data, indent: int | None = 1) -> None:
    """Scrive in modo sicuro: prima un file temporaneo, poi lo sostituisce (mai un JSON a metà)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=indent)
        fh.write("\n")
    os.replace(tmp, path)


def host(url: str) -> str:
    h = urllib.parse.urlparse(url if "://" in url else "https://" + url).netloc.lower()
    return h[4:] if h.startswith("www.") else h


def normalize_url(url: str) -> str:
    """Toglie i parametri di tracciamento e l'ancora, così lo stesso articolo ha sempre lo stesso indirizzo."""
    p = urllib.parse.urlparse(url.strip())
    q = [(k, v) for k, v in urllib.parse.parse_qsl(p.query, keep_blank_values=True)
         if not k.lower().startswith(("utm_", "fbclid", "gclid", "ref", "rss", "cmpid", "mc_"))]
    return urllib.parse.urlunparse((p.scheme.lower(), p.netloc.lower(), p.path, "", urllib.parse.urlencode(q), ""))


class _Redirect308(urllib.request.HTTPRedirectHandler):
    """Python 3.9 non segue i redirect 308 (lo fa solo dalla 3.11): li trattiamo come 307."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return super().redirect_request(req, fp, 307 if code == 308 else code, msg, headers, newurl)

    http_error_308 = urllib.request.HTTPRedirectHandler.http_error_302


_OPENER = urllib.request.build_opener(_Redirect308)


def fetch(url: str, timeout: float = 20, max_bytes: int = 4_000_000, accept: str = "*/*") -> tuple[str, bytes]:
    """Scarica un indirizzo e restituisce (indirizzo finale, contenuto). Solleva un'eccezione se non riesce."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept,
                                               "Accept-Language": "it-IT,it;q=0.9,en;q=0.8"})
    with _OPENER.open(req, timeout=timeout) as r:
        return r.geturl(), r.read(max_bytes)
