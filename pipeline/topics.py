"""Argomenti (gli 8 interessi di Eddy) e area (italia | mondo) di articoli e storie.

Regole (CLAUDE.md, "Decisioni prese"):
- se l'articolo viene da una sezione del feed (es. economia), l'argomento è quello della sezione;
- altrimenti si usa il lessico di topics.json: basta 1 parola nel titolo, ne servono 2 se compare solo nell'estratto;
- le testate generaliste non danno argomenti di default, quelle di settore sì (campo "topics" in sources.json);
- area: dalla sezione (esteri -> mondo), dalla testata (estera -> mondo) o, per le testate italiane senza sezione,
  dalle parole di luogo nel testo.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from textproc import fold, light_stems

INTERESTS = ["tecnologia", "economia", "politica", "scienza", "cultura", "societa", "ambiente", "design"]
FALLBACK = "societa"  # se nessuna parola del lessico compare


def _load():
    data = json.loads((Path(__file__).with_name("topics.json")).read_text(encoding="utf-8"))

    def compile_list(words):
        singles, phrases = set(), []
        for w in words:
            f = fold(w)
            if " " in f:
                phrases.append(" " + f + " ")
            else:
                singles.update(light_stems(f) or [f])
        return singles, phrases

    topics = {t: compile_list(data["topics"].get(t, [])) for t in INTERESTS}
    area = {k: compile_list(v) for k, v in data["area"].items() if not k.startswith("_")}
    politics_first = compile_list(data.get("precedenza_politica", {}).get("parole", []))
    return topics, area, politics_first


TOPICS, AREA, POLITICS_FIRST = _load()


def _hits(text: str, lex) -> int:
    singles, phrases = lex
    st = set(light_stems(text))
    padded = " " + " ".join(fold(text).replace("'", " ").split()) + " "
    return len(st & singles) + sum(1 for p in phrases if p in padded)


def lexicon_topics(title: str, extract: str) -> list[str]:
    """Argomenti trovati con il lessico: 1 parola nel titolo basta, 2 se solo nell'estratto. In ordine di forza."""
    scores = Counter()
    for t, lex in TOPICS.items():
        ht = _hits(title, lex)
        he = _hits(extract, lex) if extract else 0
        if ht >= 1 or he >= 2:
            scores[t] = ht * 2 + he
    return [t for t, _ in scores.most_common()]


def article_topics(a: dict) -> list[str]:
    """Argomenti di un articolo: sezione > testata di settore > lessico (sul testo italiano e su quello originale)."""
    out = []
    if a.get("topic_hint") in INTERESTS:
        out.append(a["topic_hint"])
    out.extend(t for t in a.get("default_topics") or [] if t in INTERESTS)
    title = a.get("title_it") or a["title"]
    extract = a.get("extract_it") or a.get("extract") or ""
    found = lexicon_topics(title, extract)
    if a.get("title_it"):  # testo originale (inglese) come aiuto in più
        found += lexicon_topics(a["title"], a.get("extract") or "")
    out.extend(found)
    return list(dict.fromkeys(out))


def article_area(a: dict) -> str:
    if a.get("area_hint") in ("italia", "mondo"):
        return a["area_hint"]
    if a.get("src_area") == "mondo":
        return "mondo"
    text = (a.get("title_it") or a["title"]) + " " + (a.get("extract_it") or a.get("extract") or "")
    it, wo = _hits(text, AREA["italia"]), _hits(text, AREA["mondo"])
    return "mondo" if wo > it else "italia"


def story_topics(members: list[dict]) -> list[str]:
    """Argomenti di una storia; il primo è la categoria.

    Votano tutti gli articoli, anche i titoli arrivati da Google News: una sola sezione di un feed
    (es. "business" del Guardian per una notizia sui voli) non deve decidere da sola la categoria.
    - sezione del feed o testata di settore: 2 punti
    - lessico: 1,5 punti al primo argomento trovato, 0,75 agli altri (la metà per i titoli di Google News)
    """
    score = Counter()
    for a in members:
        gn = a.get("via") == "google_news"
        hints = {a.get("topic_hint"), *(a.get("default_topics") or [])} - {None}
        lexical = 0
        for t in a.get("topics") or []:
            if t in hints and not gn:
                score[t] += 2
                continue
            score[t] += (1.5 if lexical == 0 else 0.75) * (0.5 if gn else 1)
            lexical += 1
    if not score:
        text = " ".join((a.get("title_it") or a["title"]) + " " + (a.get("extract_it") or a.get("extract") or "") for a in members)
        for t, lex in TOPICS.items():
            h = _hits(text, lex)
            if h:
                score[t] += h
    ordered = [t for t, _ in sorted(score.items(), key=lambda kv: (-kv[1], INTERESTS.index(kv[0])))]
    # precedenza a Politica: parole come governo, elezioni, ministro, sanzioni nel titolo principale o in metà dei titoli
    titles = [(a.get("title_it") or a["title"]) for a in members if a.get("via") != "google_news"] or \
             [(a.get("title_it") or a["title"]) for a in members]
    hits = [_hits(t, POLITICS_FIRST) > 0 for t in titles]
    if hits and (hits[0] or sum(hits) * 2 >= len(hits)):
        ordered = ["politica"] + [t for t in ordered if t != "politica"]
    return ordered[:3] or [FALLBACK]


def story_area(members: list[dict]) -> str:
    """Area di una storia: la maggioranza dei suoi articoli; in parità decidono le parole di luogo."""
    votes = Counter(a["area"] for a in members if a.get("via") != "google_news")
    if votes["italia"] != votes["mondo"]:
        return "italia" if votes["italia"] > votes["mondo"] else "mondo"
    text = " ".join((a.get("title_it") or a["title"]) for a in members)
    return "italia" if _hits(text, AREA["italia"]) >= _hits(text, AREA["mondo"]) else "mondo"
