"""Blocchi di approfondimento di una storia, costruiti SOLO con frasi brevi delle testate (mai articoli interi),
ognuna con il nome della testata e il link:

- in_breve:   fino a 6 estratti di testate diverse, senza doppioni, dal più informativo
- key_points: da 3 a 5 frasi con nomi, numeri e luoghi ripresi da più testate
- compare:    cosa ripetono quasi tutti i titoli e quali dettagli compaiono solo in alcune testate
- timeline:   i titoli in ordine di pubblicazione, con "Nuovi elementi" quando arrivano nomi o numeri nuovi
- main_names: i nomi propri più citati (servono per "Per capire" con Wikipedia, vedi wiki.py)
"""
from __future__ import annotations

import math
import re
from collections import Counter, defaultdict

from clean import sentences
from common import iso
from textproc import STOPWORDS, fold, stem

WORD = re.compile(r"[0-9A-Za-zÀ-ÖØ-öø-ÿ'’\-]+")
# parole con la maiuscola che non sono nomi (articoli, preposizioni, giorni, mesi, parole d'inizio frase comuni)
CAPSTOP = set("""il lo la i gli le un uno una l dell della dei degli delle nel nella sul sulla al alla dal dalla e ed o ma se
che chi cui non come dove quando perché perche anche ecco così cosi oggi ieri domani ora dopo prima tra fra per con da di a in
su questo questa questi queste quello quella ecco secondo mentre the a an and or but if of in on at to for from with by as is
are was were it its this that these those he she they we you i his her their our new how why what when where who after before
lunedì martedì mercoledì giovedì venerdì sabato domenica lunedi martedi mercoledi giovedi venerdi gennaio febbraio marzo
aprile maggio giugno luglio agosto settembre ottobre novembre dicembre monday tuesday wednesday thursday friday saturday
sunday january february march april may june july august september october november december video foto live news ultime
breaking esclusivo esclusiva intervista analisi editoriale commento""".split())
ELISION = re.compile(r"^(l|d|dell|nell|all|sull|dall|un|quest|quell)['’](.+)$", re.I)
CONNECT = {"di", "del", "della", "dei", "de", "da", "of", "von", "van", "der", "la", "le", "el", "al", "bin"}
NUMBER = re.compile(r"\b\d[\d.,]*(?:\s?(?:%|mila|milioni|miliardi|euro|dollari|anni|morti|feriti|arresti|arrestati|persone|"
                    r"vittime|km|chilometri|metri|gradi|voli|testate|ore))?", re.I)
QUOTE = re.compile(r"«[^»]{6,140}»|“[^”]{6,140}”|\"[^\"]{6,140}\"")
RETT = re.compile(r"\b(rettific|smentit|smentisc|precisazion|correzion|retract|correction|denies|denied)", re.I)


# ------------------------------------------------------------ dettagli: nomi, numeri, citazioni
def names_in(text: str) -> list[str]:
    """Nomi propri (anche di più parole: "Joshua Wong", "Hong Kong", "Banca d'Inghilterra").
    L'inizio frase vale solo se il nome è composto; dopo "l'", "all'", "sull'"… comincia sempre un nome nuovo."""
    out = []
    for sent in sentences(text or ""):
        toks = []  # (parola come va scritta, parola senza articolo, comincia un nome nuovo?, continua il nome?)
        for w in WORD.findall(sent):
            m = ELISION.match(w)
            if m and fold(m.group(1)) in ("d", "dell") and m.group(2)[:1].isupper():
                toks.append((w, m.group(2), False, True))  # "d'Inghilterra": parte del nome
            elif m:
                toks.append((m.group(2), m.group(2), True, False))  # "l'Alta" -> "Alta", nome nuovo
            else:
                toks.append((w, w, False, False))
        i = 0
        while i < len(toks):
            show, bare, _, _ = toks[i]
            if bare[:1].isupper() and len(bare) >= 2 and fold(bare).strip("'’") not in CAPSTOP and not bare.isdigit():
                name, start = [bare if toks[i][3] else show], i  # "dell'Anac" da solo -> "Anac"
                while i + 1 < len(toks):
                    nshow, nbare, new, joins = toks[i + 1]
                    if joins:
                        i += 1
                        name.append(nshow)
                    elif not new and nbare[:1].isupper() and fold(nbare) not in CAPSTOP:
                        i += 1
                        name.append(nshow)
                    elif fold(nbare) in CONNECT and i + 2 < len(toks) and toks[i + 2][1][:1].isupper() and not toks[i + 2][2]:
                        name += [nshow, toks[i + 2][0]]  # "Bank of England"
                        i += 2
                    else:
                        break
                if start > 0 or len(name) > 1:  # a inizio frase solo i nomi composti
                    out.append(" ".join(name).strip("'’-"))
            i += 1
    return [n for n in out if len(n) >= 3]


def numbers_in(text: str) -> list[str]:
    out = []
    for m in NUMBER.finditer(text or ""):
        v = m.group(0).strip()
        if re.fullmatch(r"(19|20)\d\d", v) or len(v) < 2:
            continue
        out.append(v)
    return out


def details_in(text: str) -> list[tuple[str, str]]:
    """(tipo, testo): "q" citazione, "n" numero, "p" nome."""
    return [("q", q) for q in QUOTE.findall(text or "")] + [("n", n) for n in numbers_in(text)] + [("p", p) for p in names_in(text)]


def _key(s: str) -> str:
    return " ".join(fold(s).replace("’", "'").split())


def _stems(text: str) -> set:
    return {stem(w) for w in re.findall(r"[a-z0-9]+", fold(text)) if w not in STOPWORDS and len(w) > 3}


def _jaccard(a: set, b: set) -> float:
    return len(a & b) / len(a | b) if a and b else 0.0


def _it_title(a):
    return a.get("title_it") or a["title"]


def _it_extract(a):
    return a.get("extract_it") or a.get("extract") or ""


# ------------------------------------------------------------ In breve
def in_breve(feed: list[dict], limit: int = 6) -> list[dict]:
    """Un estratto per testata (il più lungo), senza quasi-doppioni, dal più informativo."""
    best: dict = {}
    for a in feed:
        text = _it_extract(a)
        if text and len(text) > len(_it_extract(best.get(a["source_id"], {})) or ""):
            best[a["source_id"]] = a
    items = []
    for a in best.values():
        text = _it_extract(a)
        info = (len(text) + 15 * len(set(numbers_in(text) + names_in(text)))) * (0.8 if a.get("extract_it") else 1)  # prima gli originali
        items.append((info, a, text, _stems(text)))
    items.sort(key=lambda x: -x[0])
    out, kept = [], []
    for info, a, text, st in items:
        if any(_jaccard(st, k) >= 0.6 for k in kept):
            continue  # quasi uguale a un estratto già scelto (es. lo stesso lancio d'agenzia)
        kept.append(st)
        out.append({"source": a["source"], "text": text, "url": a["url"], "translated": bool(a.get("extract_it"))})
        if len(out) == limit:
            break
    return out


# ------------------------------------------------------------ Punti chiave
def key_points(feed: list[dict], members: list[dict], title: str) -> list[dict]:
    """3-5 frasi delle testate con nomi, numeri e luoghi ripresi da più fonti. Servono almeno 2 testate con estratto."""
    with_text = [a for a in feed if _it_extract(a)]
    if len({a["source_id"] for a in with_text}) < 2:
        return []
    # in quante testate compare ogni dettaglio (titoli ed estratti)
    corpus = defaultdict(str)
    for a in members:
        corpus[a["source_id"]] += " " + _key(_it_title(a) + " " + _it_extract(a))
    title_st = _stems(title)
    cands = []
    seen_text = set()
    for a in with_text:
        for sent in sentences(_it_extract(a)):
            if not 40 <= len(sent) <= 260 or sent in seen_text or sent.rstrip().endswith(("…", "...")):
                continue
            seen_text.add(sent)
            st = _stems(sent)
            if _jaccard(st, title_st) > 0.7:
                continue  # ripete il titolo
            ents = {_key(x) for x in numbers_in(sent) + names_in(sent)}
            support = [sum(1 for txt in corpus.values() if e and e in txt) for e in ents]
            score = sum(min(s, 4) for s in support if s >= 2) + 0.5 * len(ents) + (0.3 if 80 <= len(sent) <= 220 else 0)
            if score <= 0.5:
                continue
            cands.append((score, a, sent, st))
    cands.sort(key=lambda x: -x[0])
    out, kept, per = [], [], Counter()
    for score, a, sent, st in cands:
        if per[a["source_id"]] >= 2 or any(_jaccard(st, k) >= 0.5 for k in kept):
            continue
        kept.append(st)
        per[a["source_id"]] += 1
        out.append({"source": a["source"], "text": sent, "url": a["url"], "translated": bool(a.get("extract_it"))})
        if len(out) == 5:
            break
    return out if len(out) >= 3 else []


# ------------------------------------------------------------ Confronto tra le testate
def compare(members: list[dict]) -> dict | None:
    by = defaultdict(list)
    for a in members:
        by[a["source_id"]].append(a)
    n = len(by)
    if n < 3:
        return None
    cnt, surf = Counter(), {}
    for arts in by.values():
        seen = set()
        for a in arts:
            for w in WORD.findall(_it_title(a)):
                k = fold(w).strip("'’-")
                if len(k) < 4 or k in STOPWORDS or k in CAPSTOP or k.isdigit():
                    continue
                st = stem(k)
                if st in seen:
                    continue
                seen.add(st)
                cnt[st] += 1
                surf.setdefault(st, w.lower().strip("'’-"))
    need = max(2, math.ceil(n * 0.5))
    common = [{"word": surf[st], "count": c} for st, c in cnt.most_common() if c >= need][:7]
    common_st = {stem(fold(c["word"])) for c in common}
    titles_by = {sid: _key(" . ".join(_it_title(a) for a in arts)) for sid, arts in by.items()}
    limit = 2 if n >= 8 else 1
    outlets = {_key(a["source"]) for a in members}  # il nome di una testata nel titolo ("… - EFE") non è un dettaglio
    found: dict = {}
    for sid, arts in by.items():
        for a in arts:
            for kind, text in details_in(_it_title(a)):
                key = _key(text).strip("«»“”\" ")
                if len(key) < 2 or key in outlets or (kind == "p" and stem(fold(text.split()[0])) in common_st):
                    continue
                e = found.setdefault(key, {"kind": kind, "text": text, "sources": {}})
                e["sources"].setdefault(a["source"], a["url"])
    unique = []
    for key, e in found.items():
        holders = sum(1 for t in titles_by.values() if key in t)
        if 1 <= holders <= limit:
            unique.append((key, e))
    order = {"q": 0, "n": 1, "p": 2}
    unique.sort(key=lambda ke: (order[ke[1]["kind"]], len(ke[0])))
    shown, used = [], []
    for key, e in unique:
        if len(shown) == 6:
            break
        if any(u in key or key in u for u in used):
            continue
        used.append(key)
        shown.append({"text": e["text"], "sources": [{"name": nm, "url": u} for nm, u in e["sources"].items()]})
    if not common and not shown:
        return None
    return {"outlets": n, "common": common, "unique": shown}


# ------------------------------------------------------------ Cronologia
def timeline(members: list[dict]) -> dict | None:
    arts = sorted((a for a in members if a.get("published")), key=lambda a: a["published"])
    if len(arts) < 3 or (arts[-1]["published"] - arts[0]["published"]).total_seconds() < 90 * 60:
        return None
    seen_w, seen_i, events = set(), set(), []
    for i, a in enumerate(arts):
        t = _it_title(a)
        ws = _stems(t)
        info = {_key(x) for kind, x in details_in(t) if kind != "q"}
        kind = "repeat"
        if i == 0:
            kind = "first"
        elif RETT.search(fold(t)):
            kind = "correction"
        elif (info - seen_i) and len(ws - seen_w) >= 3:
            kind = "new"
        seen_w |= ws
        seen_i |= info
        events.append((a, t, kind))
    shown = [e for e in events if e[2] != "repeat"]
    if len(shown) > 8:
        shown = [shown[0]] + shown[-7:]
    if shown[-1][0] is not events[-1][0]:
        shown.append((events[-1][0], events[-1][1], "last"))
    if len(shown) < 2:
        return None
    return {
        "items": [{"time": iso(a["published"]), "source": a["source"], "title": t, "url": a["url"], "kind": k} for a, t, k in shown],
        "repeats": len(events) - len(shown),
    }


# ------------------------------------------------------------ nomi principali (per "Per capire")
GENERIC_NAMES = {_key(x) for x in [
    "Italia", "Italy", "Europa", "Europe", "Ue", "Usa", "Stati Uniti", "America", "Governo", "Parlamento", "Camera",
    "Senato", "Nazionale", "Comune", "Regione", "Stato", "Paese", "Paesi", "Occidente", "Medio Oriente", "Mondo",
]}


def main_names(members: list[dict]) -> list[str]:
    """Nomi propri citati da almeno 2 testate, dal più ripreso (a parità, i nomi composti prima)."""
    outlets_per = defaultdict(set)
    display = {}
    for a in members:
        for nm in names_in(_it_title(a) + ". " + _it_extract(a)):
            k = _key(nm)
            if k in GENERIC_NAMES or len(k) < 4:
                continue
            outlets_per[k].add(a["source_id"])
            display.setdefault(k, nm)
    ranked = sorted(outlets_per, key=lambda k: (-len(outlets_per[k]), -len(k.split()), -len(k)))
    return [display[k] for k in ranked if len(outlets_per[k]) >= 2][:3]
