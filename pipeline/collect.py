#!/usr/bin/env python3
"""Raccoglie i feed abilitati, raggruppa le notizie sullo stesso fatto, scrive data/stories.json.

Dipendenze: pip install feedparser  (tutto il resto è libreria standard)
Regole di rispetto delle fonti: solo titolo, estratto breve (max 3 frasi / 420 caratteri), link all'originale,
foto in hotlink con credito. Nessun testo completo copiato. Un'eventuale richiesta di rimozione va in data/blocklist.json.
"""
import hashlib, html, json, re, sys, time
from datetime import datetime, timezone, timedelta
from pathlib import Path
import feedparser

ROOT = Path(__file__).resolve().parent.parent
D = ROOT / "data"
MAX_AGE_H = 72          # quanto indietro guardare
MAX_PER_SOURCE = 12
SIM_THRESHOLD = 0.34    # somiglianza minima dei titoli per stare nella stessa storia
UA = "EddyBot/0.1 (+https://github.com/Fi2ippo/eddy)"

STOP = set("""il lo la i gli le un uno una di a da in con su per tra fra e ma o che non del dello della dei degli delle al allo alla
ai agli alle dal dallo dalla nel nello nella sul sullo sulla è sono ha ho come più anche si se the of and to in for on at by with from is
are was be as an a it its that this el los las de del en y por para un una le les des du et que qui der die das und""".split())
TOPIC_WORDS = {  # lessico minimo: da ampliare in data/topics.json
 "tecnologia": "intelligenza artificiale ai software app smartphone chip algoritmo cyber robot digitale internet tech",
 "scienza": "ricerca studio scienziati scoperta astronomia fisica biologia medicina cervello spazio nasa",
 "ambiente": "clima climatico emissioni energia rinnovabile ambiente biodiversità inquinamento co2 siccità",
 "economia": "economia mercati inflazione borsa pil lavoro imprese banca tassi bilancio",
 "cultura": "libro libri film mostra arte musica filosofia teatro letteratura festival",
 "design": "design ux architettura interfaccia grafica tipografia progetto urbanistica",
 "mondo": "guerra governo presidente elezioni onu ue nato ucraina gaza cina usa",
}

def clean(t):
    t = re.sub(r"<[^>]+>", " ", t or ""); t = html.unescape(t)
    return re.sub(r"\s+", " ", t).strip()

def extract(summary, limit=420, sentences=3):
    s = clean(summary)
    parts = re.split(r"(?<=[.!?])\s+(?=[A-ZÀ-Ý“\"])", s)
    out = ""
    for p in parts[:sentences]:
        if len(out) + len(p) > limit: break
        out += (" " if out else "") + p
    return out or s[:limit].rsplit(" ", 1)[0]

def tokens(t):
    return {w for w in re.findall(r"[a-zà-ÿ0-9]{3,}", t.lower()) if w not in STOP}

def jaccard(a, b):
    return len(a & b) / len(a | b) if a and b else 0

def image_of(e):
    for k in ("media_content", "media_thumbnail"):
        for m in e.get(k, []) or []:
            if m.get("url"): return m["url"]
    for l in e.get("links", []):
        if l.get("rel") == "enclosure" and str(l.get("type", "")).startswith("image"): return l.get("href")
    m = re.search(r'<img[^>]+src="([^"]+)"', e.get("summary", "") + "".join(c.get("value", "") for c in e.get("content", [])))
    return m.group(1) if m else None

def when(e):
    t = e.get("published_parsed") or e.get("updated_parsed")
    return datetime(*t[:6], tzinfo=timezone.utc) if t else None

def topics_for(src, title, text):
    found = list(src.get("topics", []))
    words = tokens(title + " " + text)
    for k, lex in TOPIC_WORDS.items():
        if len(words & set(lex.split())) >= 2 and k not in found: found.append(k)
    return found or ["attualita"]

def main():
    sources = [s for s in json.loads((D / "sources.json").read_text()) if s.get("enabled") and s.get("feed_url")]
    block = set(json.loads((D / "blocklist.json").read_text())) if (D / "blocklist.json").exists() else set()
    now = datetime.now(timezone.utc); cutoff = now - timedelta(hours=MAX_AGE_H)
    items = []
    for s in sources:
        try:
            feed = feedparser.parse(s["feed_url"], agent=UA)
        except Exception as ex:
            print("ERRORE", s["id"], ex, file=sys.stderr); continue
        n = 0
        for e in feed.entries:
            link, title = e.get("link"), clean(e.get("title"))
            if not link or not title or link in block: continue
            dt = when(e) or now
            if dt < cutoff: continue
            raw = e.get("summary") or (e.get("content") or [{}])[0].get("value", "")
            ext = extract(raw)
            items.append(dict(id=hashlib.sha1(link.encode()).hexdigest()[:12], source_id=s["id"], source=s["name"],
                title=title, extract=ext, url=link, image=image_of(e), image_credit=s["name"],
                published=dt.isoformat(), topics=topics_for(s, title, ext), lang=s.get("language"), _tok=tokens(title)))
            n += 1
            if n >= MAX_PER_SOURCE: break
    # raggruppamento greedy: ogni articolo va nel primo gruppo abbastanza simile
    groups = []
    for it in sorted(items, key=lambda x: x["published"], reverse=True):
        for g in groups:
            if jaccard(it["_tok"], g["_tok"]) >= SIM_THRESHOLD and it["source_id"] not in {a["source_id"] for a in g["articles"]}:
                g["articles"].append(it); g["_tok"] |= it["_tok"]; break
        else:
            groups.append(dict(_tok=set(it["_tok"]), articles=[it]))
    stories = []
    for g in groups:
        a = g["articles"]; lead = next((x for x in a if x["image"]), a[0])
        tp = sorted({t for x in a for t in x["topics"]})
        stories.append(dict(
            id=hashlib.sha1("|".join(sorted(x["id"] for x in a)).encode()).hexdigest()[:12],
            title=lead["title"], topics=tp, image=lead["image"], image_credit=lead["image_credit"] if lead["image"] else None,
            updated=max(x["published"] for x in a), n_sources=len(a),
            summary=[x["extract"] for x in a[:3] if x["extract"]],
            sources=[dict(name=x["source"], title=x["title"], url=x["url"]) for x in a]))
    # priorità: più fonti prima, poi più recente
    stories.sort(key=lambda s: (-min(s["n_sources"], 4), s["updated"]), reverse=False)
    stories.sort(key=lambda s: (min(s["n_sources"], 4), s["updated"]), reverse=True)
    out = dict(generated=now.isoformat(), count=len(stories), stories=stories[:300])
    (D / "stories.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
    print(f"{len(items)} articoli → {len(stories)} storie da {len(sources)} fonti")

if __name__ == "__main__":
    main()
