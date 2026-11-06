"""Dai gruppi di articoli alle storie di stories.json: titolo, foto, estratti, fonti, importanza e id stabili.

Id stabili: gli utenti salvano le storie nel browser, quindi l'id non deve cambiare quando una storia si arricchisce.
Lo stato ricorda a quale storia apparteneva ogni articolo: un gruppo eredita l'id della storia a cui appartenevano
la maggior parte dei suoi articoli; solo i gruppi davvero nuovi ricevono un id nuovo.
"""
from __future__ import annotations

import math
from collections import Counter

from common import NOW, iso, parse_iso, short_hash
import enrich
from topics import story_area, story_topics

MAX_STORIES = 300
EVENT_SIM = 0.17   # somiglianza con almeno una storia dell'evento
EVENT_AVG = 0.10   # e somiglianza media con tutte le sue storie (evita le catene che uniscono temi diversi)
EVENT_MAX = 8      # storie al massimo in un evento
GN_WEIGHT = 0.5  # una testata vista solo tramite Google News conta mezza


def _lead(members: list[dict]) -> dict:
    """Articolo principale: preferisce una testata italiana con estratto e foto."""
    feed = [a for a in members if a["via"] == "feed"] or members

    def key(a):
        return (a["lang"] == "it", bool(a.get("extract")), bool(a.get("image")), a.get("published") or NOW)
    return max(feed, key=key)


def lead_articles(groups: list[list[dict]]) -> list[dict]:
    return [_lead(g) for g in groups]


def assign_ids(groups: list[list[dict]], state_articles: dict) -> list[str]:
    claims = []
    for gi, g in enumerate(groups):
        prev = Counter(state_articles[a["id"]]["story"] for a in g
                       if a["via"] == "feed" and state_articles.get(a["id"], {}).get("story"))
        for sid, n in prev.items():
            claims.append((-n, sid, gi))
    ids: list[str | None] = [None] * len(groups)
    used = set()
    for _, sid, gi in sorted(claims):
        if ids[gi] is None and sid not in used:
            ids[gi] = sid
            used.add(sid)
    for gi, g in enumerate(groups):
        if ids[gi] is None:
            first = min((a for a in g if a["via"] == "feed"), key=lambda a: (a["first_seen"], a["id"]))
            sid = short_hash("storia|" + first["id"])
            while sid in used:
                sid = short_hash(sid + "+")
            ids[gi] = sid
            used.add(sid)
    return ids  # type: ignore[return-value]


def _score(members: list[dict], updated, has_image: bool) -> float:
    weight = {}
    for a in members:
        w = GN_WEIGHT if a["via"] == "google_news" else 1.0
        weight[a["source_id"]] = max(weight.get(a["source_id"], 0), w)
    w = sum(weight.values())
    age_h = max(0.0, (NOW - updated).total_seconds() / 3600)
    recency = math.exp(-age_h / 18)
    return (1 + 1.5 * math.log2(1 + w)) * (0.35 + 0.65 * recency) + (0.25 if has_image else 0)


def build(groups: list[list[dict]], ids: list[str], state_stories: dict) -> list[dict]:
    out = []
    for g, sid in zip(groups, ids):
        feed = [a for a in g if a["via"] == "feed"]
        lead = _lead(g)
        it_first = sorted(feed, key=lambda a: (a is not lead, a["lang"] != "it", -(a.get("published") or NOW).timestamp()))
        gn = [a for a in g if a["via"] == "google_news"]
        img_art = lead if lead.get("image") else next((a for a in it_first if a.get("image")), None)
        updated = max(a.get("published") or a["first_seen"] for a in g)
        first_seen = min(a["first_seen"] for a in feed)
        prev = state_stories.get(sid)
        if prev and parse_iso(prev.get("first_seen")):
            first_seen = min(first_seen, parse_iso(prev["first_seen"]))
        state_stories[sid] = {"first_seen": iso(first_seen)}
        translated = bool(lead.get("title_it"))
        title = lead.get("title_it") or lead["title"]
        topics = story_topics(g)  # votano anche i titoli arrivati da Google News
        story = {
            "id": sid,
            "title": title,
            "title_original": lead["title"] if translated else None,
            "translated": translated,
            "original_lang": lead["lang"] if translated else None,
            "category": topics[0],
            "topics": topics,
            "area": story_area(g),
            "image": img_art["image"] if img_art else None,
            "image_credit": f"Foto: {img_art['source']}" if img_art else None,
            "first_seen": iso(first_seen),
            "updated": iso(updated),
            "n_sources": len({a["source_id"] for a in g}),
            # blocchi di approfondimento: solo frasi brevi delle testate, ognuna con testata e link (enrich.py)
            "summary": enrich.in_breve(it_first),
            "key_points": enrich.key_points(it_first, g, title),
            "compare": enrich.compare(g),
            "timeline": enrich.timeline(g),
            "context": None,  # "Per capire" (Wikipedia), aggiunto dopo in collect.py
            "_names": enrich.main_names(g),
            # titolo in italiano (tradotto se serve) e, se tradotto, anche quello originale
            "sources": [{"name": a["source"], "title": a.get("title_it") or a["title"], "url": a["url"], "via": a["via"],
                         "published": iso(a.get("published") or a["first_seen"]),
                         **({"title_original": a["title"], "translated": True} if a.get("title_it") else {})}
                        for a in it_first + gn],
        }
        out.append((_score(g, updated, bool(img_art)), story))
    out.sort(key=lambda x: (-x[0], x[1]["id"]))
    result = [s for _, s in out[:MAX_STORIES]]
    assign_events(result)
    return result


def assign_events(result: list[dict]) -> None:
    """Campo "event": storie diverse sullo stesso evento (es. più sviluppi degli allarmi bomba sui voli) hanno lo
    stesso valore, cioè l'id della più importante. L'app lo usa per non ripetere lo stesso evento in prima pagina.
    Somiglianza TF-IDF fra titoli, titoli delle fonti ed estratti; storie collegate anche a catena."""
    if not result:
        return
    import numpy as np
    from sklearn.feature_extraction.text import TfidfVectorizer
    from textproc import proper_nouns, stems

    docs = []
    for st in result:
        text = " ".join([st["title"]] + [x["title"] for x in st["sources"] if x["via"] == "feed"] + [x["text"] for x in st["summary"]])
        docs.append(stems(text) + proper_nouns(st["title"]))
    X = TfidfVectorizer(analyzer=lambda d: d, sublinear_tf=True).fit_transform(docs)
    S = (X @ X.T).toarray()
    # si uniscono prima le coppie più simili (l'ordine delle storie non conta); due gruppi si uniscono solo se,
    # in media, tutte le loro storie si somigliano abbastanza e se insieme non superano EVENT_MAX storie
    n = len(result)
    members = {i: [i] for i in range(n)}
    root = list(range(n))
    pairs = sorted(((S[i, j], i, j) for i in range(n) for j in range(i + 1, n) if S[i, j] >= EVENT_SIM), reverse=True)
    for _, i, j in pairs:
        a, b = root[i], root[j]
        if a == b or len(members[a]) + len(members[b]) > EVENT_MAX:
            continue
        if S[np.ix_(members[a], members[b])].mean() < EVENT_AVG:
            continue
        keep, gone = min(a, b), max(a, b)  # resta la radice più importante (le storie sono già in ordine)
        members[keep] += members.pop(gone)
        for k in members[keep]:
            root[k] = keep
    for i, st in enumerate(result):
        st["event"] = result[root[i]]["id"]
