"""Contenuti che non sono notizie: si scartano prima del raggruppamento.

Per ampliare l'elenco basta aggiungere parole alle liste qui sotto (minuscole, senza accenti non servono).
- TITLE_WORDS: se compaiono come parola intera nel titolo, l'articolo si scarta.
- TITLE_PREFIXES: se il titolo comincia così (es. "VIDEO |", "Diretta:"), si scarta.
- URL_PARTS: se compaiono nell'indirizzo dell'articolo, si scarta.
"""
from __future__ import annotations

import re

TITLE_WORDS = [
    # oroscopo, giochi, meteo
    "oroscopo", "oroscopi", "horoscope", "horoscopes", "zodiaco", "meteo", "previsioni del tempo", "weather forecast",
    "estrazione del lotto", "estrazioni del lotto", "superenalotto", "10elotto", "million day", "cruciverba",
    "crossword", "sudoku", "wordle", "quiz",
    # gallerie ("video", "live", "podcast" da soli no: "il video mostra…" è una notizia; vedi TITLE_SUFFIXES)
    "fotogallery", "photo gallery", "in pictures", "in foto",
    # dirette ("diretta" da sola no: "elezione diretta" è una notizia)
    "in diretta", "notizie in diretta", "diretta tv", "diretta live", "liveblog", "live blog", "live updates",
    "watch live", "minuto per minuto", "as it happened",
    # pubblicità e offerte ("offerta" e "deal" da soli no: "offerta pubblica", "trade deal" sono notizie)
    "sponsorizzato", "contenuto sponsorizzato", "sponsored", "in collaborazione con", "partner content", "advertorial",
    "in offerta", "offerte amazon", "offerta del giorno", "offerte del giorno", "migliori offerte", "codice sconto",
    "sconti amazon", "coupon", "black friday", "cyber monday", "prime day", "deals of the day", "best deals",
    # necrologi
    "necrologio", "necrologi", "necrologie", "annunci funebri", "obituary", "obituaries",
    # rubriche di servizio
    "rassegna stampa", "newsletter", "la giornata in", "le notizie del giorno", "morning briefing", "evening briefing",
]

# se il titolo FINISCE così (es. "… – video", "… - live", "… | podcast"), si scarta
TITLE_SUFFIXES = ["video", "videos", "live", "podcast", "gallery", "foto", "photos", "in pictures"]

TITLE_PREFIXES = ["video", "foto", "fotogallery", "gallery", "live", "diretta", "podcast", "audio", "watch", "listen",
                  "sponsored", "advertorial", "oroscopo", "meteo"]

URL_PARTS = ["/video/", "/videos/", "/podcast/", "/podcasts/", "/gallery/", "/galleries/", "/fotogallery/",
             "/foto/", "/photos/", "/live/", "/liveblog/", "/diretta/", "/oroscopo/", "/horoscope/", "/meteo/",
             "/weather/", "/necrologie/", "/necrologi/", "/obituaries/", "/sponsored/", "/sponsor/", "/offerte/",
             "/deals/", "/coupon/", "/annunci/", "video.corriere.it", "video.repubblica.it", "tv.ilfattoquotidiano"]

_WORDS_RX = re.compile(r"(?<![\w])(?:" + "|".join(re.escape(w) for w in sorted(TITLE_WORDS, key=len, reverse=True)) + r")(?![\w])", re.I)
_SUFFIX_RX = re.compile(r"[-–—|:]\s*(?:" + "|".join(TITLE_SUFFIXES) + r")\s*$", re.I)
_PREFIX_RX = re.compile(r"^\s*[\[(]?\s*(?:" + "|".join(TITLE_PREFIXES) + r")\s*[\])]?\s*[:|\-–—]", re.I)


def is_junk(title: str, url: str) -> str | None:
    """Restituisce il motivo dello scarto, oppure None se l'articolo è una notizia."""
    t = title or ""
    if _PREFIX_RX.search(t):
        return "prefisso"
    if _SUFFIX_RX.search(t):
        return "suffisso"
    m = _WORDS_RX.search(t)
    if m:
        return "parola: " + m.group(0).lower()
    u = (url or "").lower()
    for part in URL_PARTS:
        if part in u:
            return "indirizzo: " + part
    return None
