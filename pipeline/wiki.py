"""'Per capire': il riassunto della voce di Wikipedia in italiano sulla persona, il luogo o l'organizzazione
principale della storia (prime 2 frasi dell'API REST page/summary di it.wikipedia.org).

Prudenza prima di tutto: meglio nessun riquadro che uno sbagliato.
- niente pagine di disambiguazione;
- il titolo della voce deve essere uguale al nome o molto simile (es. "Joshua Wong" → "Joshua Wong");
- al massimo MAX_REQUESTS richieste per giro, con cache (anche delle risposte negative) e un User-Agent che
  identifica Eddy, come chiede Wikimedia.
I testi di Wikipedia sono sotto licenza CC BY-SA: l'app lo scrive sotto il riquadro, con il link alla voce.
"""
from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from datetime import timedelta
from difflib import SequenceMatcher

from clean import sentences
from common import NOW, iso, log, parse_iso
from textproc import fold

API = "https://it.wikipedia.org/api/rest_v1/page/summary/"
UA = "EddyBot/0.2 (https://github.com/Fi2ippo/eddy; lettore di notizie non commerciale)"
MAX_REQUESTS = 80
RULES_VERSION = 2  # se cambiano le regole di accettazione, le risposte in cache si ricontrollano
GENERIC_START = re.compile(r"^(In [a-zà-ù]+[ ,]|Il termine|Con il termine|Un |Una |Uno |Per [a-zà-ù]+ si intende)")
CACHE_DAYS = 14


def _norm(s: str) -> str:
    s = re.sub(r"\s*\(.*?\)\s*", " ", s or "")  # "Lega (partito)" -> "Lega"
    return " ".join(re.findall(r"[a-z0-9]+", fold(s)))


def _similar(name: str, title: str) -> bool:
    a, b = _norm(name), _norm(title)
    if not a or not b:
        return False
    if a == b:
        return True
    # stesso nome con una piccola differenza (es. "Zelensky" / "Zelens'kyj" no; "Russell Brand" / "Russell Brand" sì)
    return len(a.split()) >= 2 and SequenceMatcher(None, a, b).ratio() >= 0.9


def _summary(name: str) -> dict:
    url = API + urllib.parse.quote(name.replace(" ", "_"), safe="")
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as ex:
        if ex.code == 404:
            return {"ok": False}
        raise
    if data.get("type") != "standard" or not _similar(name, data.get("title", "")):
        return {"ok": False}
    text = " ".join(sentences(data.get("extract") or "")[:2]).strip()
    if len(text) < 40:
        return {"ok": False}
    # voci su un concetto generico ("Una banca è…", "In geometria, un pentagono…", "Il termine congresso…"): no
    if GENERIC_START.match(text):
        return {"ok": False}
    # la voce deve parlare proprio di quel nome: il titolo compare all'inizio del riassunto
    if _norm(data.get("title", "")).split()[0] not in _norm(text[:90]):
        return {"ok": False}
    page = ((data.get("content_urls") or {}).get("desktop") or {}).get("page")
    return {"ok": True, "title": data.get("title"), "summary": text[:600], "url": page}


class Wiki:
    def __init__(self, cache: dict, enabled: bool = True):
        self.cache = cache
        self.enabled = enabled
        self.requests = 0

    def lookup(self, name: str) -> dict | None:
        key = _norm(name)
        hit = self.cache.get(key)
        if hit and hit.get("v") == RULES_VERSION and (parse_iso(hit.get("at")) or NOW) > NOW - timedelta(days=CACHE_DAYS):
            return hit if hit.get("ok") else None
        if not self.enabled or self.requests >= MAX_REQUESTS:
            return None
        self.requests += 1
        try:
            res = _summary(name)
        except Exception as ex:  # noqa: BLE001 (rete: si riprova al prossimo giro)
            log("wikipedia non raggiungibile:", name, str(ex)[:60])
            return None
        res["at"] = iso(NOW)
        res["v"] = RULES_VERSION
        self.cache[key] = res
        return res if res.get("ok") else None

    def context_for(self, names: list[str]) -> dict | None:
        for nm in names[:2]:
            res = self.lookup(nm)
            if res:
                return {"name": nm, "title": res["title"], "summary": res["summary"], "url": res["url"],
                        "source": "Wikipedia", "license": "CC BY-SA"}
        return None


def prune_cache(cache: dict) -> None:
    limit = NOW - timedelta(days=CACHE_DAYS)
    for k in [k for k, v in cache.items() if (parse_iso(v.get("at")) or limit) <= limit]:
        cache.pop(k, None)
