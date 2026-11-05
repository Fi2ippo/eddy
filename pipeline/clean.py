"""Pulizia di titoli ed estratti.

Regola di Eddy: dagli articoli si prende solo il titolo e un estratto breve (massimo 3 frasi e 420 caratteri),
mai il testo completo. Qui si tolgono HTML, "Continua a leggere", firme, crediti delle foto e simili.
"""
from __future__ import annotations

import html
import re

MAX_SENTENCES = 3
MAX_CHARS = 420

_TAG = re.compile(r"<[^>]+>")
_SPACES = re.compile(r"\s+")
# code da togliere (da qui in poi si scarta tutto). Niente re.X qui: in quella modalità gli spazi verrebbero ignorati.
_READ_MORE = ["Continua a leggere", "Leggi tutto", "Leggi l'articolo", "Leggi di più", "Leggi anche", "Read more",
              "Continue reading", "Read the full story", "Lire la suite", "Weiterlesen", "Leer más"]
_TAIL = re.compile(
    r"\s*(?:(?:" + "|".join(re.escape(x) for x in _READ_MORE) + r")\b.*"
    r"|The post .{1,250}? appeared first on .*"
    r"|L'articolo .{1,250}? (?:proviene da|sembra essere il primo su) .*"
    r"|This article (?:was originally published|first appeared) .*"
    r"|\[\s*(?:…|\.\.\.)\s*\]\s*"
    r"|\(\s*continua\s*\)\s*)$", re.I | re.S)
# riga d'agenzia in testa: "(ANSA) - ROMA, 5 NOV - "
_DATELINE = re.compile(
    r"""^\s*\(?\s*(?:ANSA|ANSAmed|AGI|Adnkronos|LaPresse|Askanews|Dire|Italpress|AFP|Reuters|AP|dpa|EFE)(?:/[A-Za-z]+)?\s*\)?\s*
    (?:[-–—]\s*)?(?:[A-ZÀ-Ü][A-ZÀ-Ü'’. ]{1,30},?\s*)?(?:\d{1,2}\s+[A-Za-z]{3,9}\.?\s*(?:\d{4})?\s*)?[-–—]\s+""", re.X)
# crediti delle foto e firme
_CREDITS = re.compile(
    r"\(?\s*(?:Foto|Photo|Photograph|Fotografia|Immagine|Image|Credit|Credits|Crediti)\s*(?:di|by)?\s*:\s*[^.()\n]{1,80}\)?\.?"
    r"|\s*\((?:Getty Images|AP Photo|Reuters|AFP|ANSA|LaPresse|Shutterstock|iStock)[^)]{0,60}\)"
    r"|©\s*[^.\n]{1,60}\.?", re.I)
_BYLINE_START = re.compile(r"^\s*(?:By|Di|di)\s+[A-ZÀ-Ü][\w'’-]+(?:\s+[A-ZÀ-Ü][\w'’-]+){0,3}\s*(?:[-–—|,:]\s*)", re.U)
_BYLINE_END = re.compile(r"\s*[-–—|]\s*(?:di|by)\s+[A-ZÀ-Ü][\w'’-]+(?:\s+[A-ZÀ-Ü][\w'’-]+){0,3}\s*$", re.U)
# fine frase: punto/punto esclamativo/interrogativo seguito da spazio e maiuscola (o virgolette)
_SENTENCE_END = re.compile(r"(?<=[.!?…])[\"»”’)]?\s+(?=[«\"“(A-ZÀ-Ü0-9])")
_ABBR = re.compile(r"\b(?:dott|dr|sig|prof|avv|ing|on|sen|gen|st|mr|mrs|ms|vs|ecc|etc|art|nr|fig)\.$", re.I)
# prefissi/suffissi di servizio nei titoli: "ULTIM'ORA |", "| Il Post"
_TITLE_PREFIX = re.compile(r"^\s*(?:ultim'?ora|ultima ora|breaking|esclusivo|esclusiva|exclusive|update|aggiornamento)\s*[:|\-–—]\s*", re.I)
_PLUS = re.compile(r"(?<![\w])\+{2,}")


_LISTS = re.compile(r"<(ul|ol|figure|figcaption|aside)\b[^>]*>.*?</\1>", re.I | re.S)  # link correlati, didascalie


def strip_html(text: str | None) -> str:
    t = _LISTS.sub(" ", text or "")
    t = _TAG.sub(" ", t)
    t = html.unescape(html.unescape(t))
    return _SPACES.sub(" ", t.replace("\xa0", " ")).strip()


def clean_title(title: str | None, source_name: str = "") -> str:
    t = strip_html(title)
    t = _PLUS.sub(" ", t)  # "++ Titolo ++" delle agenzie
    t = _TITLE_PREFIX.sub("", t)
    if source_name and len(source_name) > 2:
        t = re.sub(r"\s+[|\-–—:]\s+" + re.escape(source_name) + r"\s*$", "", t, flags=re.I)
    letters = [c for c in t if c.isalpha()]
    if len(letters) > 20 and sum(c.isupper() for c in letters) / len(letters) > 0.7:
        t = t[:1] + t[1:].lower()  # titoli TUTTI MAIUSCOLI
    return _SPACES.sub(" ", t).strip(" -–—|:")


def sentences(text: str) -> list[str]:
    parts, buf = [], ""
    for piece in _SENTENCE_END.split(text):
        buf = (buf + " " + piece).strip() if buf else piece
        if _ABBR.search(buf):
            continue  # "dott. Rossi": non è una fine frase
        parts.append(buf)
        buf = ""
    if buf:
        parts.append(buf)
    return [p.strip() for p in parts if p.strip()]


def clean_extract(raw: str | None, title: str = "") -> str:
    """Estratto breve: al massimo 3 frasi e 420 caratteri, senza firme, crediti o code di servizio."""
    s = strip_html(raw)
    if not s:
        return ""
    s = _DATELINE.sub("", s, count=1)
    s = _TAIL.sub("", s)
    s = _CREDITS.sub(" ", s)
    s = _BYLINE_START.sub("", s)
    s = _BYLINE_END.sub("", s)
    s = _SPACES.sub(" ", s).strip(" -–—|")
    if title and s.lower().startswith(title.lower()):
        s = s[len(title):].lstrip(" .:-–—")  # estratto che ripete il titolo
    out = ""
    for sent in sentences(s)[:MAX_SENTENCES]:
        if len(out) + len(sent) + 1 > MAX_CHARS:
            break
        out = (out + " " + sent).strip()
    if not out and s:
        out = s[:MAX_CHARS].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    if len(out) < 25 or (title and _same_text(out, title)):
        return ""
    return out


def _same_text(a: str, b: str) -> bool:
    wa, wb = set(re.findall(r"\w{3,}", a.lower())), set(re.findall(r"\w{3,}", b.lower()))
    return bool(wa) and len(wa & wb) / len(wa | wb) > 0.8
