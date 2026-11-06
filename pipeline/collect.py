#!/usr/bin/env python3
"""Raccolta di Eddy: legge i feed delle fonti abilitate, pulisce, traduce, raggruppa e scrive stories.json.

Uso:
  python pipeline/collect.py                    # scrive data/stories.json e data/state.json
  python pipeline/collect.py --out dati         # su GitHub Actions: cartella del ramo "dati"
  opzioni per le prove: --no-translate --no-og --no-gn

Passi: feed -> pulizia e filtri -> doppioni -> traduzione -> argomenti e area -> raggruppamento ->
Google News -> foto -> storie (id stabili) -> stories.json (solo se cambia) + state.json + report.json.

Dipendenze: feedparser, numpy, scikit-learn, ctranslate2, sentencepiece (pipeline/requirements.txt).
"""
from __future__ import annotations

import argparse
import re
import json
import sys
import time
from collections import Counter
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import cluster  # noqa: E402
import feeds  # noqa: E402
import images  # noqa: E402
import stories  # noqa: E402
import topics  # noqa: E402
import translate  # noqa: E402
import wiki  # noqa: E402
from common import NOW, ROOT, dump_json, host, iso, load_json, log, parse_iso  # noqa: E402
from filters import is_junk  # noqa: E402
from textproc import fold  # noqa: E402

STATE_VERSION = 1
JUNK_SAMPLES: list = []  # titoli scartati come non notizie (solo per --debug)
ARTICLE_MEMORY_DAYS = 7


def load_sources(path: Path) -> list[dict]:
    return [s for s in load_json(path, []) if s.get("enabled") and (s.get("feeds") or s.get("feed_url"))]


def blocked(url: str, block: set) -> bool:
    h = host(url)
    return url in block or any(h == b or h.endswith("." + b) for b in block if "/" not in b)


def prepare(raw: list[dict], block: set, state_articles: dict) -> tuple[list[dict], Counter]:
    """Filtri, finestra di 72 ore, doppioni e data di prima vista."""
    why = Counter()
    cutoff = NOW - timedelta(hours=feeds.WINDOW_HOURS)
    by_url: dict = {}
    for a in raw:
        if blocked(a["url"], block):
            why["blocklist"] += 1
            continue
        reason = is_junk(a["title"], a["url"])
        if reason:
            why["non notizia"] += 1
            JUNK_SAMPLES.append(f"{a['source']}: {a['title']}  [{reason}]")
            continue
        if len(a["title"]) < 12 or len(a["title"].split()) < 3:
            why["titolo troppo corto"] += 1
            continue
        mem = state_articles.get(a["id"]) if a["via"] == "feed" else None
        a["first_seen"] = parse_iso(mem["first_seen"]) if mem else NOW
        if a["published"] is None or a["published"] > NOW + timedelta(minutes=30):
            a["published"] = a["first_seen"] if a["published"] is None else NOW  # feed senza date (es. Le Scienze)
        if a["published"] < cutoff:
            why["più vecchio di 72 ore"] += 1
            continue
        old = by_url.get(a["url"])
        if old:  # stesso articolo in più sezioni: si tengono gli indizi migliori
            why["doppione (stesso link)"] += 1
            old["topic_hint"] = old.get("topic_hint") or a.get("topic_hint")
            old["area_hint"] = old.get("area_hint") or a.get("area_hint")
            old["section"] = old.get("section") or a.get("section")
            old["image"] = old.get("image") or a.get("image")
            if len(a.get("extract") or "") > len(old.get("extract") or ""):
                old["extract"] = a["extract"]
            continue
        by_url[a["url"]] = a
    out, seen_titles = [], set()
    for a in by_url.values():
        k = (a["source_id"], fold(a["title"]))
        if k in seen_titles:
            why["doppione (stesso titolo)"] += 1
            continue
        seen_titles.add(k)
        out.append(a)
    return out, why


EN_HINTS = set("the of and to in for on with after over from says is are was will has have its their".split())


def looks_english(text: str) -> bool:
    words = re.findall(r"[a-z]+", (text or "").lower())
    return sum(w in EN_HINTS for w in words) >= 2


OTHER_HINTS = set("el los las del que por para una y en al se su es son tras der die das und mit für von "
                  "le les des du et pour avec il gli della che".split())


def other_hits(text: str) -> int:
    return len(set(re.findall(r"[a-zà-ÿ]+", (text or "").lower())) & OTHER_HINTS)


def english_sources(arts: list[dict]) -> set:
    """Fonti segnate con un'altra lingua (es. EFE, dpa) che in questo giro scrivono soprattutto in inglese."""
    seen: dict = {}
    for a in arts:
        if a["lang"] not in ("it", "en"):
            n = seen.setdefault(a["source_id"], [0, 0])
            n[0] += looks_english(a["title"])
            n[1] += other_hits(a["title"]) >= 2
    return {sid for sid, (en, other) in seen.items() if en >= 1 and en > other}


def translate_all(arts: list[dict], tr: translate.Translator) -> int:
    by_lang: dict = {}
    en_src = english_sources(arts)
    for a in arts:
        lang = a["lang"]
        if lang not in ("it", "en") and (looks_english(a["title"]) or (a["source_id"] in en_src and other_hits(a["title"]) == 0)):
            lang = "en"  # fonte segnata con un'altra lingua ma titolo in inglese (es. EFE, dpa in inglese)
        if lang != "it" and tr.can(lang):
            by_lang.setdefault(lang, []).append(a)
    for lang, lst in by_lang.items():
        titles = tr.to_italian([a["title"] for a in lst], lang)
        extracts = tr.to_italian([a.get("extract") or "" for a in lst], lang)
        for a, t, e in zip(lst, titles, extracts):
            if t:
                a["title_it"] = t
            if e:
                a["extract_it"] = e
    return sum(1 for a in arts if a.get("title_it"))


def same_stories(path: Path, new: list[dict]) -> bool:
    old = load_json(path, None)
    return bool(old) and old.get("stories") == new


def main():
    ap = argparse.ArgumentParser(description="Raccolta delle notizie di Eddy")
    ap.add_argument("--sources", default=str(ROOT / "data" / "sources.json"))
    ap.add_argument("--blocklist", default=str(ROOT / "data" / "blocklist.json"))
    ap.add_argument("--out", default=str(ROOT / "data"), help="cartella di stories.json, state.json e report.json")
    ap.add_argument("--models", default=str(ROOT / ".cache" / "eddy-models"), help="cartella dei modelli di traduzione")
    ap.add_argument("--no-translate", action="store_true")
    ap.add_argument("--no-og", action="store_true", help="non leggere le pagine per cercare og:image")
    ap.add_argument("--no-gn", action="store_true", help="non usare Google News")
    ap.add_argument("--no-wiki", action="store_true", help="non interrogare Wikipedia")
    ap.add_argument("--debug", action="store_true", help="salva anche debug_articles.json (articoli preparati) per le prove")
    args = ap.parse_args()
    t0 = time.time()
    out = Path(args.out)

    sources = load_sources(Path(args.sources))
    if args.no_gn:
        sources = [s for s in sources if s.get("via") != "google_news"]
    block = set(load_json(Path(args.blocklist), []))
    state = load_json(out / "state.json", {})
    if state.get("version") != STATE_VERSION:
        state = {"version": STATE_VERSION}
    st_articles = state.setdefault("articles", {})
    st_stories = state.setdefault("stories", {})
    st_tr = state.setdefault("translations", {})
    state.pop("og_images", None)  # vecchio nome della cache delle pagine
    st_pages = state.setdefault("pages", {})
    st_wiki = state.setdefault("wikipedia", {})
    st_gn = state.setdefault("google_news", {})

    # 1. feed
    raw, feed_report = feeds.read_all(sources, st_gn)
    log(f"letti {feed_report['feeds_ok']} feed ({len(feed_report['feeds_err'])} con errori), {len(raw)} voci")
    # 2. pulizia, filtri, doppioni
    arts, dropped = prepare(raw, block, st_articles)
    feed_arts = [a for a in arts if a["via"] == "feed"]
    gn_arts = [a for a in arts if a["via"] == "google_news"]
    log(f"tenuti {len(feed_arts)} articoli + {len(gn_arts)} titoli Google News; scartati: {dict(dropped)}")
    # 2b. estratti troppo corti: descrizione ufficiale della pagina (og:description), mai il testo dell'articolo
    if not args.no_og:
        images.fill_descriptions(feed_arts, st_pages)
    # 3. traduzione (prima del raggruppamento, così italiano e inglese si confrontano)
    tr = translate.Translator(Path(args.models), st_tr, enabled=not args.no_translate)
    n_tr = translate_all(arts, tr)
    log(f"traduzioni: {tr.new} nuove ({tr.engine_used}), {n_tr} titoli in italiano, {tr.failed} non riuscite")
    # 4. argomenti e area per articolo
    for a in arts:
        a["topics"] = topics.article_topics(a)
        a["area"] = topics.article_area(a)
    if args.debug:
        dump_json(out / "debug_articles.json", [{**a, "published": iso(a["published"]), "first_seen": iso(a["first_seen"])}
                                                for a in arts])
        dump_json(out / "debug_junk.json", JUNK_SAMPLES)
    # 5. raggruppamento + Google News
    idx_groups, vec = cluster.cluster(feed_arts)
    attached = cluster.attach_google_news(idx_groups, feed_arts, gn_arts, vec)
    groups = [[feed_arts[i] for i in g] + attached.get(gi, []) for gi, g in enumerate(idx_groups)]
    log(f"{len(groups)} gruppi; {sum(1 for g in groups if len({a['source_id'] for a in g}) > 1)} con 2+ testate; "
        f"{sum(len(v) for v in attached.values())} titoli Google News agganciati")
    # 6. foto mancanti: og:image solo per l'articolo principale delle storie più importanti
    leads = stories.lead_articles(groups)
    if not args.no_og:
        order = sorted(range(len(groups)), key=lambda i: -len({a["source_id"] for a in groups[i]}))
        missing = [leads[i] for i in order if not any(a.get("image") for a in groups[i])]
        images.fill_og_images(missing, st_pages)
    # 7. storie con id stabili
    ids = stories.assign_ids(groups, st_articles)
    for g, sid in zip(groups, ids):
        for a in g:
            if a["via"] == "feed":
                st_articles[a["id"]] = {"first_seen": iso(a["first_seen"]), "story": sid}
    result = stories.build(groups, ids, st_stories)
    # 7b. "Per capire": Wikipedia per il nome principale (citato da almeno 2 testate), dalle storie più importanti
    wk = wiki.Wiki(st_wiki, enabled=not args.no_wiki)
    for st in result:
        names = st.pop("_names", [])
        if names:
            st["context"] = wk.context_for(names)
    log(f"wikipedia: {wk.requests} richieste, {sum(1 for s in result if s['context'])} storie con 'Per capire'")
    # 8. scrittura (stories.json solo se le storie cambiano davvero)
    out.mkdir(parents=True, exist_ok=True)
    changed = not same_stories(out / "stories.json", result)
    if changed:
        dump_json(out / "stories.json", {"generated": iso(NOW), "count": len(result), "stories": result})
    # 9. stato: dimentica ciò che è vecchio
    limit = NOW - timedelta(days=ARTICLE_MEMORY_DAYS)
    for k in [k for k, v in st_articles.items() if (parse_iso(v.get("first_seen")) or limit) < limit]:
        st_articles.pop(k)
    live_ids = {s["id"] for s in result} | {v["story"] for v in st_articles.values()}
    for k in [k for k in st_stories if k not in live_ids]:
        st_stories.pop(k)
    translate.prune_cache(st_tr)
    images.prune_cache(st_pages, {a["url"] for a in arts})
    wiki.prune_cache(st_wiki)
    state["updated"] = iso(NOW)
    dump_json(out / "state.json", state, indent=None)
    report = {
        "generated": iso(NOW), "seconds": round(time.time() - t0, 1), "stories_changed": changed,
        "sources": {"feed": sum(1 for s in sources if s.get("via") != "google_news"),
                    "google_news": sum(1 for s in sources if s.get("via") == "google_news")},
        "feeds_ok": feed_report["feeds_ok"], "feeds_errors": feed_report["feeds_err"],
        "google_news_refreshed": feed_report["gn_refreshed"], "articles": len(feed_arts), "google_news_titles": len(gn_arts),
        "dropped": dict(dropped), "translated_new": tr.new,
        "stories": len(result), "stories_2plus": sum(1 for s in result if s["n_sources"] > 1),
        "stories_with_image": sum(1 for s in result if s["image"]),
        "stories_translated": sum(1 for s in result if s["translated"]),
        "stories_key_points": sum(1 for s in result if s["key_points"]),
        "stories_context": sum(1 for s in result if s["context"]),
        "stories_compare": sum(1 for s in result if s["compare"]),
        "stories_timeline": sum(1 for s in result if s["timeline"]),
        "categories": dict(Counter(s["category"] for s in result).most_common()),
        "areas": dict(Counter(s["area"] for s in result)),
    }
    dump_json(out / "report.json", report)
    log(json.dumps({k: v for k, v in report.items() if k != "feeds_errors"}, ensure_ascii=False))
    log(f"fatto in {report['seconds']} s; stories.json {'aggiornato' if changed else 'invariato'}")


if __name__ == "__main__":
    main()
