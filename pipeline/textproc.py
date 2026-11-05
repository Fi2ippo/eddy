"""Parole importanti di un testo: minuscole senza accenti, parole generiche escluse, radici delle parole.

La radice è volutamente semplice (niente librerie esterne): le prime 6 lettere, senza la vocale finale.
Così "condanna" e "condannato" diventano entrambe "condan", "allarme" e "allarmi" diventano "allarm".
"""
from __future__ import annotations

import re
import unicodedata

STOP_IT = """
a ad al allo alla ai agli alle anche ancora avere aver avuto anni anno altro altri altra altre bene c ce che chi ci
cio come con contro cosa cose cui da dal dallo dalla dai dagli dalle del dello della dei degli delle dentro di dopo
dove e ed era erano essere esso essa fa fare fatto fino fra gia gli ha hanno ho i il in invece io la le lei li lo
loro lui ma mai me meno mentre mi molto molti molte ne nei negli nel nello nella nelle no noi non nostro nuovo nuova
nuovi nuove o oggi ogni oltre ora ovvero per pero perche piu poco poi possono prima proprio puo qua quale quali
quando quanto quasi quella quelle quelli quello questa queste questi questo qui se sei senza si sia siamo sono sta
stata stati stato su sua sue sui sul sullo sulla sulle suo suoi tanto te tra tre tu tutta tutte tutti tutto un una
uno vi via voi dice detto ieri domani ecco dove fare fatti cosa cambia cambiano parte caso modo volta tempo giorno
giorni ore settimana mese mesi primo prima secondo ultimo ultima ultimi grande grandi solo sempre tutto stesso
stessa altro dopo verso sotto sopra durante circa ecco lunedi martedi mercoledi giovedi venerdi sabato domenica
gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre
"""
STOP_EN = """
a about above after again against all am an and any are as at be because been before being below between both but
by can could did do does doing down during each few for from further had has have having he her here hers him his
how i if in into is it its itself just me more most my no nor not now of off on once only or other our out over own
same she should so some such than that the their them then there these they this those through to too under until
up very was we were what when where which while who whom why will with would you your new says said say year years
week weeks day days time first last next also may might could still back like just get gets got make makes made
how what after amid over into more than us monday tuesday wednesday thursday friday saturday sunday january february
march april june july august september october november december
"""
STOPWORDS = set(STOP_IT.split()) | set(STOP_EN.split())

_WORD = re.compile(r"[a-z0-9]+")
# nome proprio: parola con iniziale maiuscola (anche più parole di fila: "Joshua Wong", "Stretto di Hormuz")
_PROPER = re.compile(r"(?<![\w'’])([A-ZÀ-Ý][\wÀ-ÿ'’\-]*(?:\s+(?:di|del|della|de|da|van|von|der|al|el|bin|la|le)?\s*[A-ZÀ-Ý][\wÀ-ÿ'’\-]+)*)")
_YEARS = {str(y) for y in range(2000, 2041)}


def fold(text: str) -> str:
    """Minuscole e senza accenti: "Città" -> "citta"."""
    t = unicodedata.normalize("NFKD", (text or "").lower())
    return "".join(c for c in t if not unicodedata.combining(c)).replace("’", "'")


def stem(word: str) -> str:
    w = word
    if w.isdigit() or len(w) <= 3:
        return w
    if len(w) > 6:
        w = w[:6]
    if len(w) >= 4 and w[-1] in "aeiou":
        w = w[:-1]
    return w


def light_stem(word: str) -> str:
    """Radice leggera per il lessico degli argomenti: toglie solo la desinenza, senza tagliare la parola.

    "politica"/"politics" -> "politic", "climatico"/"climatica" -> "climatic"; ma "international" resta diverso da
    "internet" e "referee" da "referendum" (con la radice di 6 lettere sarebbero uguali).
    """
    w = word
    if len(w) > 3 and w.endswith("s") and not w.endswith("ss"):
        w = w[:-1]
    if len(w) > 3 and w[-1] in "aeiou":
        w = w[:-1]
    return w


def light_stems(text: str) -> list[str]:
    return [light_stem(w) for w in words(text)]


def words(text: str) -> list[str]:
    """Parole (non radici) senza quelle generiche."""
    return [w for w in _WORD.findall(fold(text)) if w not in STOPWORDS and w not in _YEARS and (len(w) >= 3 or w.isdigit() and len(w) >= 2)]


def stems(text: str) -> list[str]:
    return [stem(w) for w in words(text)]


def proper_nouns(text: str) -> list[str]:
    """Nomi propri, escluso l'inizio della frase (che è maiuscolo per regola e non per nome)."""
    out = []
    for m in _PROPER.finditer(text or ""):
        phrase = m.group(1).strip("'’-")
        start = m.start()
        before = text[max(0, start - 2):start].strip()
        if (start == 0 or before in (".", ":", "!", "?", "«", '"', "“")) and len(phrase.split()) == 1 and not phrase.isupper():
            continue
        parts = [w for w in _WORD.findall(fold(phrase)) if w not in STOPWORDS and len(w) >= 2]
        if parts:
            out.append("#" + "_".join(stem(p) for p in parts))
    return out
