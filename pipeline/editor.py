#!/usr/bin/env python3
"""Redazione automatica di Eddy, senza modelli linguistici a pagamento.

Uso: python editor.py STATE OUT [MODELS]

STATE  copia del ramo "dati": items.json, outlets.json, logos.json, status.json (dal raccoglitore)
       più editor.json e trcache.json (memoria della redazione), aggiornati sul posto.
OUT    cartella del sito: scrive OUT/data/feed.json (ultime 48 ore) e OUT/data/archive.json (fino a 7 giorni).
MODELS cartella dei modelli di traduzione (facoltativa).

Passi: pulizia delle voci, traduzione dei titoli e dei sommari esteri, raggruppamento delle voci che
raccontano lo stesso fatto (TF-IDF + legame medio), scelta del titolo, sommario estrattivo con le frasi
delle testate, tema, dossier, luogo, foto, importanza, prima pagina per edizione (07 e 19).
"""
import hashlib
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import numpy as np
import snowballstemmer
from scipy.cluster.hierarchy import fcluster, linkage
from scipy.sparse import csr_matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lexicon as L  # noqa: E402
from gazetteer import COUNTRY_NAMES, DEMONYMS, PLACE_LIST  # noqa: E402

NOW = datetime.strptime(os.environ['EDDY_NOW'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc) if os.environ.get('EDDY_NOW') else datetime.now(timezone.utc)
ROME = ZoneInfo('Europe/Rome')
ARCHIVE_DAYS = 7
RECENT_HOURS = 48
TAU = float(os.environ.get('EDDY_TAU', '0.30'))
MAX_RECENT = 320          # storie delle ultime 48 ore pubblicate al massimo
MAX_SINGLE = 80           # di cui al massimo queste di una sola testata (le specialistiche prima)
MAX_LOCAL = 110           # Roma e provincia: conto a parte, non tolgono posto alle altre
MAX_LOCAL_SINGLE = 80
LIVE = re.compile(r'(\blive\b|liveblog|live blog|live updates|\bdiretta\b|in diretta|minuto per minuto|as it happened|en direct|\ben vivo\b|\bticker\b|newsblog|🔴)', re.I)
MAX_SOURCES = 16
AGENCIES = {'ansa', 'agi', 'adnkronos'}
LOGO_SKIP = {'elpais', 'bbc', 'esa', 'lavoce'}
YEARS = {str(y) for y in range(2015, 2031)}
SMALL_GEO = {'336': ('380', 41.902, 12.453), '674': ('380', 43.936, 12.447), '492': ('250', 43.738, 7.424)}
LANGF = {'en': "dall'inglese", 'fr': 'dal francese', 'de': 'dal tedesco', 'es': 'dallo spagnolo', 'pt': 'dal portoghese', 'nl': "dall'olandese"}
STEMMERS = {k: snowballstemmer.stemmer(v) for k, v in
            {'it': 'italian', 'en': 'english', 'fr': 'french', 'de': 'german', 'es': 'spanish', 'pt': 'portuguese', 'nl': 'dutch'}.items()}


def iso(dt):
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def pdate(s):
    try:
        return datetime.strptime(s, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    except Exception:  # noqa: BLE001
        return None


def load(path, default):
    try:
        with open(path, encoding='utf-8') as fh:
            return json.load(fh)
    except Exception:  # noqa: BLE001
        return default


def dump(path, data):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, path)


def log(*a):
    print('[redazione]', *a, flush=True)


# ------------------------------------------------------------------ testo
ABBR = set('dott dr sig sigg prof avv ing on sen gen col mons st sr jr mr mrs ms vs etc ecc pag art nr fig cfr es ca spa srl inc ltd co corp gov rep'.split())
SENT_END = re.compile(r'[.!?…]+["»”’)]?\s+(?=[«"“(A-ZÀ-ÖØ-Þ0-9])')


def sentences(text):
    text = re.sub(r'\s+', ' ', text or '').strip()
    out, start = [], 0
    for m in SENT_END.finditer(text):
        seg = text[start:m.start()]
        last = seg.split()[-1] if seg.split() else ''
        w = L.norm(last).strip('.')
        if len(w) <= 1 or w in ABBR or re.fullmatch(r'(?:[a-z]\.)+[a-z]?', L.norm(last)):
            continue
        out.append(text[start:m.end()].strip())
        start = m.end()
    tail = text[start:].strip()
    if tail:
        out.append(tail)
    return [s for s in out if len(s) > 2]


DATELINE = re.compile(r'''^\s*(?:\(?\s*(?:ANSA|ANSAmed|AGI|Adnkronos|LaPresse|Askanews|Dire|Italpress|AFP|Reuters|AP|dpa|EFE)(?:/[A-Za-z]+)?\s*\)?\s*(?:[-–—]\s*)?)?
                          (?:[A-ZÀ-Ü][A-ZÀ-Ü'’. ]{1,30}(?:\s*\([A-Za-z]{2,4}\))?\s*,?\s*)?
                          (?:\d{1,2}\s+(?:[A-Za-z]{3,9})\.?\s*(?:\d{4})?\s*)?
                          [-–—]\s+''', re.X)
TAIL = re.compile(r'''\s*(?:(?:Leggi|Continua a leggere|Leggi tutto|Leggi l'articolo|Leggi di più|Read more|Continue reading|Lire la suite|Weiterlesen|Mehr lesen|Leer más|Seguir leyendo)\b.*
                    |The post .{1,200} appeared first on .*|L'articolo .{1,200} proviene da .*|\[\s*(?:…|\.\.\.)\s*\]\s*$|\(\s*continua\s*\)\s*$)$''', re.X | re.I | re.S)


PLUS_RX = re.compile(r'(?<![\w])\+{2,}')


def noplus(t, title=True):
    """Toglie i «++» con cui le agenzie segnano le ultim'ora («++ Titolo ++»), non i «++» attaccati a una parola (C++)."""
    if not isinstance(t, str) or '++' not in t:
        return t
    lead = re.match(r'\s*\+{2,}', t) and not re.search(r'(?<![\w])\+{2,}\s*$', t)
    t = PLUS_RX.sub(' ', t)
    if lead:  # «++Titolo++»: aperto in testa, chiuso anche se attaccato all'ultima parola
        t = re.sub(r'(?<!\b[A-Za-z])\+{2,}(?=\s*$)', '', t, flags=re.M)
    t = re.sub(r'[ \t]{2,}', ' ', t)
    t = re.sub(r' +([,.;:!?»”)])', r'\1', t)
    return t.strip(' -–—|:') if title else '\n'.join(x.strip() for x in t.split('\n'))


def clean_title(t, o):
    t = re.sub(r'\s+', ' ', noplus(t or '')).strip()
    t = L.PREFIX_RX.sub('', t)
    t = L.SUFFIX_RX.sub('', t)
    t = L.DATE_TAIL.sub('', t)
    for nm in {o.get('name', ''), o.get('short', '')}:
        if nm and len(nm) > 2:
            t = re.sub(r'\s+[|\-–—:]\s+' + re.escape(nm) + r'(?:\.\w{2,3})?\s*$', '', t, flags=re.I)
    letters = [c for c in t if c.isalpha()]
    if len(letters) > 20 and sum(c.isupper() for c in letters) / len(letters) > 0.7:
        t = t[:1] + t[1:].lower()
    t = t.strip(' -–—|:').replace('...', '…')
    return t


def clean_snippet(s, title):
    s = re.sub(r'\s+', ' ', noplus(s or '')).strip().replace('...', '…')
    if not s:
        return ''
    s = DATELINE.sub('', s, count=1) if re.match(r'^\s*\(?[A-ZÀ-Ü]', s) else s
    s = TAIL.sub('', s).strip()
    nt, ns = L.norm(title), L.norm(s)
    if ns.startswith(nt) and len(nt) > 15:
        s = s[len(title):].lstrip(' .:-–—') if s.lower().startswith(title.lower()) else s
        ns = L.norm(s)
    if len(s) < 25 or ns == nt or jacc(tset(title), tset(s)) > 0.8:
        return ''
    return s


WORD = re.compile(r'[a-z0-9]+')
PROPER = re.compile(r"(?<![\w'’])([A-ZÀ-ÖØ-Þ][\wÀ-ÿ'’\-]*(?:\s+(?:di|del|della|de|da|van|von|der|al|el|bin|ibn|la|le)?\s*[A-ZÀ-ÖØ-Þ][\wÀ-ÿ'’\-]+)*)")


def undate(t):
    return L.WEEKDAY_RX.sub(' ', L.DATE_RX.sub(' ', t))


QAPOS = re.compile(r"(?<=[A-Za-zÀ-ÖØ-öø-ÿ])\?(?=[A-Za-zÀ-ÖØ-öø-ÿ])")


def fix_q(t):
    """«l?elettrico» → «l'elettrico»: apostrofo perso dal feed (succede con Il Messaggero)."""
    return QAPOS.sub("'", t) if t and '?' in t else t


def tset(text):
    return {w for w in WORD.findall(undate(L.norm(text))) if w not in L.ALLSTOP and len(w) > 2}


def jacc(a, b):
    return len(a & b) / max(1, len(a | b))


def toks(text, lang):
    t = undate(L.norm(L.expand(text, lang)))
    st = STEMMERS.get(lang, STEMMERS['it'])
    out = []
    for w in WORD.findall(t):
        if w in L.ALLSTOP or w in YEARS:
            continue
        if w.isdigit():
            if len(w) < 2:
                continue
            out.append(w)
        elif len(w) >= 3:
            out.append(st.stemWord(w))
    return out


def propers(text):
    out = []
    if not text:
        return out
    for i, m in enumerate(PROPER.finditer(text)):
        phrase = m.group(1).strip("'’-")
        words = phrase.split()
        if m.start() == 0 or text[max(0, m.start() - 2):m.start()].strip() in ('.', ':', '!', '?', '«', '"', '“'):
            # parola iniziale: vale solo se è una sigla o un nome composto
            if len(words) == 1 and not phrase.isupper():
                continue
        n = L.norm(phrase)
        if n in L.CAPSTOP or len(n) < 3:
            continue
        parts = [p for p in n.split() if p not in L.CAPSTOP]
        if not parts:
            continue
        out.append(' '.join(parts))
    return out


# ------------------------------------------------------------------ voci
def detect_lang(text):
    """Lingua di un titolo+estratto dalle parole vuote; None se incerta."""
    from translate import STOPL, WORDS
    w = WORDS.findall((text or '').lower())
    if len(w) < 5:
        return None
    sc = sorted(((sum(1 for x in w if x in v), k) for k, v in STOPL.items()), reverse=True)
    (b, lb), (n, _) = sc[0], sc[1]
    return lb if b >= 3 and b >= 2 * max(1, n) else None


def junk_title(t, s=''):
    nt = L.norm(t)
    return bool(L.JUNK_TITLE.search(nt) or L.JUNK_DATEONLY.match(nt) or L.JUNK_ANY.search(t + ' ' + (s or '')))


def prepare(items, outlets):
    res, seen_t = [], {}
    for it in items:
        o = outlets.get(it.get('o'))
        if not o:
            continue
        u = it.get('u') or ''
        pu = urlparse(u)
        if pu.scheme not in ('http', 'https') or not pu.netloc or (pu.path in ('', '/') and not pu.query):
            continue
        t = fix_q(clean_title(it.get('t'), o))
        if len(t) < 12 or len(t.split()) < 3:
            continue
        if junk_title(t, it.get('s') or ''):
            continue
        hint = it.get('h')
        if o.get('sec') == 'roma' or hint == 'roma':
            # solo cronaca locale: le testate del territorio perdono le notizie nazionali, estere e lo sport di vertice;
            # la rubrica Roma di una testata nazionale le tiene, ma come notizie nazionali
            mode = 'mixed' if o.get('mista') else 'local' if o.get('rilancia') else 'pure'
            if L.is_local_text(L.norm(t + ' . ' + (it.get('s') or '')), mode):
                hint = 'roma'
            elif o.get('sec') == 'roma':
                continue
            else:
                hint = None
        d = pdate(it.get('d') or '')
        if not d:
            continue
        if d > NOW + timedelta(minutes=30):
            d = NOW
        key = (it['o'], L.norm(t))
        if key in seen_t:
            continue
        seen_t[key] = True
        s = fix_q(clean_snippet(it.get('s'), t))
        img = None
        if it.get('ik') and it.get('img') and str(it['img']).startswith(('https://', 'http://')):
            img = {'u': it['img'], 'w': it.get('iw') or 0, 'h': it.get('ih') or 0}
        lang = it.get('l') or o.get('lang', 'it')
        dl = detect_lang(t + ' ' + s)
        if dl and dl != lang:
            lang = dl
        res.append({'k': it['k'], 'o': it['o'], 't': t, 's': s, 'u': u, 'd': d, 'l': lang, 'live': bool(LIVE.search(it.get('t') or '')),
                    'a': it.get('a'), 'h': hint, 'img': img, 'gn': it.get('via') == 'gn', 'fs': pdate(it.get('fs') or '') or d})
    return res


def translate_items(items, trc, models):
    """Aggiunge ti/si (italiano) alle voci estere usando la cache e, se ci sono, i modelli."""
    from translate import repair
    used, todo = set(), defaultdict(list)
    fixed = 0
    for it in items:
        if it['l'] == 'it':
            continue
        for fld, src in (('ti', it['t']), ('si', it['s'])):
            if not src:
                continue
            h = hashlib.sha1((it['l'] + '|' + src).encode()).hexdigest()[:16]
            used.add(h)
            if h in trc:
                good_tr = repair(src, trc[h], it['l'])
                if good_tr:
                    if good_tr != trc[h]:
                        trc[h] = good_tr
                        fixed += 1
                    it[fld] = good_tr
                    continue
                trc.pop(h)
            todo[it['l']].append((it, fld, src, h))
    info = {'ok': False, 'langs': {}, 'new': 0}
    tr = None
    if models and any(todo.values()):
        try:
            from translate import Translator
            tr = Translator(models)
            info['langs'] = tr.available()
        except Exception as ex:  # noqa: BLE001
            log('traduzione non disponibile:', ex)
    if tr:
        for lang, lst in todo.items():
            if not tr.route(lang):
                continue
            outs = tr.to_italian([x[2] for x in lst], lang)
            for (it, fld, src, h), o in zip(lst, outs):
                if o:
                    it[fld] = o
                    trc[h] = o
                    info['new'] += 1
    elif models:
        try:
            from translate import Translator
            info['langs'] = Translator(models).available()
        except Exception:  # noqa: BLE001
            pass
    info['ok'] = any(info['langs'].values()) if info['langs'] else bool(trc)
    info['fixed'] = fixed
    for h in list(trc):
        if h not in used:
            trc.pop(h)
    return info


def ititle(it):
    return it.get('ti') or it['t']


def isnip(it):
    return it.get('si') or it.get('s') or ''


def lang_for_text(it):
    return 'it' if it['l'] == 'it' or it.get('ti') else it['l']


# ------------------------------------------------------------------ vettori e gruppi
def vectorize(items):
    docs = []
    for it in items:
        lg = lang_for_text(it)
        tt = toks(ititle(it), lg)
        ss = toks(isnip(it)[:400], 'it' if it.get('si') or it['l'] == 'it' else it['l'])
        pp = ['#' + p for p in set(propers(it['t']) + (propers(it['ti']) if it.get('ti') else []))]
        c = Counter()
        for w in tt:
            c[w] += 2
        for w in ss:
            c[w] += 1
        for p in pp:
            c[p] += 2.5
        docs.append(c)
    df = Counter()
    for c in docs:
        df.update(c.keys())
    N = len(docs)
    vocab = {w: i for i, w in enumerate(w for w, n in df.items() if n >= 1)}
    idf = {w: math.log((N + 1) / (df[w] + 1)) + 1 for w in vocab}
    rows, cols, vals = [], [], []
    vecs = []
    for r, c in enumerate(docs):
        v = {w: (1 + math.log(n)) * idf[w] for w, n in c.items() if df[w] < N * 0.25 or w.startswith('#')}
        nrm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        v = {w: x / nrm for w, x in v.items()}
        vecs.append(v)
        for w, x in v.items():
            rows.append(r)
            cols.append(vocab[w])
            vals.append(x)
    X = csr_matrix((vals, (rows, cols)), shape=(N, len(vocab)))
    return X, vecs, df


def cluster(items, X, tau):
    n = len(items)
    if n == 0:
        return []
    if n == 1:
        return [[0]]
    S = (X @ X.T).toarray()
    S = np.clip(S, 0, 1)
    out = np.array([it['o'] for it in items])
    same = out[:, None] == out[None, :]
    S[same] *= 0.8
    t = np.array([it['d'].timestamp() for it in items]) / 3600
    gap = np.abs(t[:, None] - t[None, :])
    S[gap > 30] *= 0.75
    live = np.array([bool(it.get('live')) for it in items])
    if live.any():
        S[live, :] *= 0.6
        S[:, live] *= 0.6
    np.fill_diagonal(S, 1.0)
    iu = np.triu_indices(n, 1)
    Z = linkage(1 - S[iu], method='average')
    labels = fcluster(Z, t=1 - tau, criterion='distance')
    groups = defaultdict(list)
    for i, lab in enumerate(labels):
        groups[lab].append(i)
    res = []
    for g in groups.values():
        if len(g) > 24 and tau < 0.6:
            sub = cluster([items[i] for i in g], X[g], tau + 0.08)
            res.extend([[g[j] for j in s] for s in sub])
        else:
            res.append(g)
    return res


def merge_pass(groups, items, vecs, df):
    """Unisce i gruppi che raccontano lo stesso fatto da angoli diversi: stesso nome proprio raro
    e centroidi vicini, a meno di 24 ore di distanza."""
    if len(groups) < 2:
        return groups
    N = len(items)
    rare_max = max(6, min(30, N // 40))
    cents = [centroid(vecs, g) for g in groups]
    anchors = []
    for g, c in zip(groups, cents):
        if all(items[i].get('live') for i in g):
            anchors.append(set())
            continue
        a = {w for w in c if w.startswith('#') and 2 <= df.get(w, 0) <= rare_max and c[w] >= 0.12}
        anchors.append(a)
    span = [(min(items[i]['d'] for i in g), max(items[i]['d'] for i in g)) for g in groups]
    idx = defaultdict(list)
    for gi, a in enumerate(anchors):
        for w in a:
            idx[w].append(gi)
    parent = list(range(len(groups)))
    size = [len(g) for g in groups]

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    seen = set()
    for w, gl in idx.items():
        for x in range(len(gl)):
            for y in range(x + 1, len(gl)):
                a, b = gl[x], gl[y]
                if (a, b) in seen:
                    continue
                seen.add((a, b))
                if span[a][0] - span[b][1] > timedelta(hours=24) or span[b][0] - span[a][1] > timedelta(hours=24):
                    continue
                if cos(cents[a], cents[b]) < 0.33:
                    continue
                ra, rb = find(a), find(b)
                if ra != rb and size[ra] + size[rb] <= 30:
                    parent[rb] = ra
                    size[ra] += size[rb]
    out = defaultdict(list)
    for gi, g in enumerate(groups):
        out[find(gi)].extend(g)
    return list(out.values())


def centroid(vecs, idx):
    c = Counter()
    for i in idx:
        for w, x in vecs[i].items():
            c[w] += x
    nrm = math.sqrt(sum(x * x for x in c.values())) or 1.0
    top = c.most_common(40)
    return {w: round(x / nrm, 4) for w, x in top}


def cos(a, b):
    if len(a) > len(b):
        a, b = b, a
    return sum(x * b.get(w, 0) for w, x in a.items())


# ------------------------------------------------------------------ classificazione
def topic_scores(text_title, text_body, members, outlets):
    sc = Counter()
    nt, nb = L.norm(text_title), L.norm(text_body)
    for t, rules in L.TOPIC_RX.items():
        for w, rx in rules:
            hits_t = {m.group(0) for m in rx.finditer(nt)}
            hits_b = {m.group(0) for m in rx.finditer(nb)} - hits_t
            sc[t] += w * (2 * len(hits_t) + min(len(hits_b), 4))
    for it in members:
        o = outlets.get(it['o'], {})
        if it.get('h') == 'roma':
            sc['roma'] += 9
        elif it.get('h'):
            sc[it['h']] += 5
        ot = L.OUTLET_TOPIC.get(it['o'])
        if ot:
            sc[ot] += 5
        if it['o'] in L.MOTORSPORT:
            sc['motori'] += 4
            sc['sport'] += 2
        elif o.get('sec') == 'motori':
            sc['motori'] += 4
        if o.get('sec') == 'mondo' and not ot:
            sc['mondo'] += 1.5
    return sc


def classify(sc, members, outlets):
    if not sc or max(sc.values()) <= 0:
        foreign = sum(1 for it in members if outlets.get(it['o'], {}).get('lang', 'it') != 'it')
        return ('mondo' if foreign > len(members) / 2 else 'cronaca'), []
    order = sorted(sc.items(), key=lambda kv: (-kv[1], L.TOPIC_ORDER.index(kv[0]) if kv[0] in L.TOPIC_ORDER else 99))
    top, best = order[0]
    alt = [t for t, v in order[1:] if v >= max(6, 0.5 * best)][:2]
    return top, alt


def pick_dossier(text_title, text_body, topic, alt=()):
    nt, nb = L.norm(text_title), L.norm(text_body)
    best, bs = None, 0
    for k, rx in L.DOSSIER_RX.items():
        title, dtopic, _, _, need = L.DOSSIERS[k]
        ht = {m.group(0) for m in rx.finditer(nt)}
        hb = {m.group(0) for m in rx.finditer(nb)} - ht
        s = 2 * len(ht) + min(len(hb), 4)
        if s < need or not ht and s < need + 1:
            continue
        if dtopic != topic and dtopic not in alt and s < need + 3:
            continue
        s += 0.5 if dtopic == topic else 0
        if s > bs:
            best, bs = k, s
    return best


_PLACE_RX = []
for p in PLACE_LIST:
    for nm in p['names']:
        amb = nm.endswith('!')
        nm = nm.rstrip('!')
        rx = r"(?<![\w'’])" + re.escape(nm) + r"(?![\w’])"
        if nm == 'Latina':
            rx = r'(?<!America )' + rx
        if nm in ('Sofia', 'Washington', 'Potenza', 'Lima', 'Nice', 'Monza'):
            rx += r'(?! [A-Z][a-z])'
        _PLACE_RX.append((re.compile(rx), p, amb))
for cc, names in COUNTRY_NAMES.items():
    for nm in names:
        amb = nm.endswith('!')
        nm = nm.rstrip('!')
        rx = r"(?<![\w'’])" + re.escape(nm) + r"(?![\w’])"
        if nm == 'Congo':
            rx = r'(?<!Repubblica Democratica del )(?<!Repubblica democratica del )(?<!Repubblica del )' + rx
        _PLACE_RX.append((re.compile(rx), {'cc': cc, 'zoom': 'paese', 'names': [names[0]], 'country': True}, amb))
_DEM_RX = {cc: re.compile(r'\b(?:' + rx + r')\b') for cc, rx in DEMONYMS.items()}


def find_place(parts, geoc):
    """parts: [(testo, peso)]. Restituisce {name,cc,lat,lon,zoom} o None."""
    score = defaultdict(float)
    ref = {}
    for text, w in parts:
        if not text:
            continue
        starts = {0} | {m.end() for m in re.finditer(r'[.!?:]\s+|[«"“]', text)}
        for rx, p, amb in _PLACE_RX:
            for m in rx.finditer(text):
                if amb and m.start() in starts:
                    continue
                key = p['names'][0] + '|' + p['cc']
                score[key] += w * (1.0 if p.get('country') else 1.6 if p['zoom'] == 'citta' else 1.3)
                ref[key] = p
                break
        nt = L.norm(text)
        for cc, rx in _DEM_RX.items():
            if rx.search(nt):
                key = COUNTRY_NAMES[cc][0] + '|' + cc
                score[key] += w * 0.45
                ref[key] = {'cc': cc, 'zoom': 'paese', 'names': [COUNTRY_NAMES[cc][0]], 'country': True}
    if not score:
        return None
    # una città vince sul suo paese; l'Italia generica vale poco
    for key in list(score):
        p = ref[key]
        if not p.get('country'):
            ck = COUNTRY_NAMES.get(p['cc'], [''])[0] + '|' + p['cc']
            if ck in score:
                score[key] += score[ck] * 0.6
        if p.get('country') and p['cc'] == '380':
            score[key] *= 0.35
    key, best = max(score.items(), key=lambda kv: kv[1])
    if best < 1.4:
        return None
    p = ref[key]
    if p.get('country'):
        cc = p['cc']
        if cc in SMALL_GEO:
            cc2, lat, lon = SMALL_GEO[cc]
            return {'name': p['names'][0], 'cc': cc2, 'lat': lat, 'lon': lon, 'zoom': 'citta'}
        c = geoc.get(cc)
        if not c:
            return None
        return {'name': p['names'][0], 'cc': cc, 'lat': c[0], 'lon': c[1], 'zoom': 'paese'}
    return {'name': p['names'][0], 'cc': p['cc'], 'lat': p['lat'], 'lon': p['lon'], 'zoom': p['zoom']}


def geo_centroids(path):
    g = load(path, None)
    out = {}
    if not g:
        return out
    q = g['q']
    for cid, rings in g['c'].items():
        best, ba = None, -1
        for enc in rings:
            x = y = 0
            pts = []
            for i in range(0, len(enc), 2):
                x += enc[i]
                y += enc[i + 1]
                pts.append((x / q, y / q))
            a = cx = cy = 0.0
            for i in range(len(pts) - 1):
                x0, y0 = pts[i]
                x1, y1 = pts[i + 1]
                f = x0 * y1 - x1 * y0
                a += f
                cx += (x0 + x1) * f
                cy += (y0 + y1) * f
            if abs(a) > ba and a != 0:
                ba = abs(a)
                best = (round(cy / (3 * a), 3), round(cx / (3 * a), 3))
        if best:
            out[cid] = best
    return out


def tags_of(members, headline):
    c = Counter()
    for it in members:
        for p in set(propers(ititle(it)) + propers(it['t'])):
            c[p] += 1
    for p in propers(headline):
        c[p] += 1.5
    out = []
    for p, n in c.most_common(12):
        if n < 1.5 or p in ('stati uniti', 'unione europea', 'italia'):
            continue
        disp = ' '.join(w.capitalize() if len(w) > 3 or i == 0 else w for i, w in enumerate(p.split()))
        if any(L.norm(disp) in L.norm(x) or L.norm(x) in L.norm(disp) for x in out):
            continue
        out.append(disp)
        if len(out) == 4:
            break
    return out


# ------------------------------------------------------------------ storie
def slug(text):
    w = [x for x in WORD.findall(L.norm(text)) if x not in L.ALLSTOP and len(x) > 2][:6]
    s = '-'.join(w)[:52].strip('-')
    return s or hashlib.sha1(text.encode()).hexdigest()[:8]


def weight_of(o, outlets):
    oo = outlets.get(o, {})
    if o in AGENCIES:
        return 1.1
    if oo.get('sec') in ('scienza', 'motori'):
        return 0.7
    if oo.get('sec') == 'roma':
        return 0.6
    return 1.0


def short(s, n):
    s = re.sub(r'\s+', ' ', s or '').strip()
    if len(s) <= n:
        return s
    cut = s[:n].rsplit(' ', 1)[0].rstrip(',;:')
    return cut + '…'


def build_story(members, vecs_idx, vecs, outlets, geoc):
    """members: voci ordinate per data. Restituisce i campi editoriali della storia."""
    n = len(members)
    # centralità
    cen = []
    for i, it in enumerate(members):
        vi = vecs[vecs_idx[i]]
        s = sum(cos(vi, vecs[vecs_idx[j]]) for j in range(n) if j != i) / max(1, n - 1)
        cen.append(s)

    def quality(i):
        it = members[i]
        t = it['t']
        q = cen[i] if n > 1 else 1
        q += 0.15 if it['l'] == 'it' else 0
        q += 0.08 if it['o'] in AGENCIES else 0
        q += 0.05 if 45 <= len(t) <= 130 else -0.1 if len(t) < 30 or len(t) > 170 else 0
        q -= 0.08 if t.endswith('?') else 0
        q -= 0.3 if t.endswith('…') else 0
        q -= 0.05 if it['gn'] else 0
        return q
    rep = max(range(n), key=quality)
    it_ids = [i for i in range(n) if members[i]['l'] == 'it']
    if it_ids:
        hi = max(it_ids, key=quality)
        headline = members[hi]['t']
    else:
        hi = rep
        headline = ititle(members[rep])
    hset = tset(headline)

    # frasi disponibili, già in italiano dove possibile
    cands = []
    order = sorted(range(n), key=lambda i: (-(members[i]['l'] == 'it'), -quality(i)))
    for rank_i, i in enumerate(order):
        it = members[i]
        sn = isnip(it)
        if not sn or (it['l'] != 'it' and not it.get('si')):
            continue
        for k, s in enumerate(sentences(sn)[:3]):
            if len(s) < 35 or s.endswith('…') and len(s) < 70:
                continue
            trunc = s.endswith('…')
            cands.append({'s': s, 'o': it['o'], 'i': i, 'pos': k, 'q': quality(i) - 0.08 * k - 0.01 * rank_i - (0.2 if trunc else 0),
                          'set': tset(s), 'tr': it['l'] != 'it'})
    used = []

    def novel(c, thr=0.45):
        if jacc(c['set'], hset) > 0.6:
            return False
        return all(jacc(c['set'], u['set']) < thr for u in used)
    dek = ''
    for c in sorted(cands, key=lambda c: (c['i'] != hi, c['pos'], -c['q'])):
        if novel(c) and len(c['s']) <= 320:
            dek = short(c['s'], 260)
            used.append(c)
            break
    paras, pts = [], []
    by_o = set()
    for c in sorted(cands, key=lambda c: -c['q']):
        if len(paras) >= 3 or c in used or not novel(c):
            continue
        if c['o'] in by_o and len(set(x['o'] for x in cands)) > len(by_o):
            continue
        same = [x for x in cands if x['i'] == c['i'] and x['pos'] == c['pos'] + 1 and novel(x)]
        txt = c['s'] + (' ' + same[0]['s'] if same and len(c['s']) + len(same[0]['s']) < 420 else '')
        used.append(c)
        if same and txt != c['s']:
            used.append(same[0])
        name = outlets.get(c['o'], {}).get('name', c['o'])
        paras.append(short(txt, 520) + f' ({name}{", tradotto" if c["tr"] else ""})')
        by_o.add(c['o'])
    for c in sorted(cands, key=lambda c: -c['q']):
        if len(pts) >= 3 or c in used or not novel(c, 0.4):
            continue
        name = outlets.get(c['o'], {}).get('name', c['o'])
        pts.append(f'{name}: {short(c["s"], 220)}')
        used.append(c)
    if n == 1 and not paras and not dek:
        dek = ''
    summary = '\n\n'.join(paras)

    # tema, dossier, luogo
    titles = ' . '.join(ititle(it) for it in members[:12])
    body = ' '.join([dek, summary, ' '.join(isnip(it)[:300] for it in members[:8])])
    sc = topic_scores(headline + ' . ' + titles, body, members, outlets)
    place = find_place([(headline, 3), (dek, 2), (re.sub(r'\([^)]*\)', '', summary), 1)] +
                       [(ititle(it), 0.8) for it in members[:10]], geoc)
    if place and place['cc'] != '380' and max([sc[t] for t in sc if t not in ('italia', 'cronaca', 'mondo')] or [0]) < 8:
        sc['mondo'] += 6
    topic, alt = classify(sc, members, outlets)
    # Roma e provincia: solo cronaca locale. Le storie nazionali o estere che citano Roma restano nei loro temi, senza Roma.
    loc_o = {it['o'] for it in members if it.get('h') == 'roma'}
    nat_o = {it['o'] for it in members if it.get('h') != 'roma'} - loc_o
    if (topic == 'roma' or 'roma' in alt or loc_o) and L.story_local(L.norm(headline), L.norm(titles), len(loc_o), len(nat_o),
                                                                    bool(place and place['cc'] != '380')):
        if topic != 'roma':
            topic, alt = 'roma', [topic] + [t for t in alt if t not in ('roma', topic)][:1]
    elif topic == 'roma':
        rest = [t for t, v in sorted(sc.items(), key=lambda kv: -kv[1]) if t != 'roma' and v > 0]
        topic = rest[0] if rest else 'cronaca'
        alt = [t for t in alt if t not in ('roma', topic)][:2]
    alt = [t for t in alt if t != 'roma']
    dossier = pick_dossier(headline + ' . ' + titles, body, topic, alt)
    zona = None
    if topic == 'roma':
        dz = Counter(outlets.get(it['o'], {}).get('zona') for it in members if outlets.get(it['o'], {}).get('zona'))
        zona = L.zone_of([(L.norm(headline), 3), (L.norm(titles), 2), (L.norm(body), 1)], dz.most_common(1)[0][0] if dz else None)

    # foto
    img = None
    best = -9
    for i, it in enumerate(members):
        im = it.get('img')
        if not im or not im.get('w'):
            continue
        w, h = im['w'], im['h'] or 1
        ar = w / h
        s = quality(i) + (0.3 if 1.3 <= ar <= 2.1 else 0 if 1.0 <= ar <= 2.6 else -0.4) + (0.35 if w >= 700 else 0 if w >= 500 else -0.25) + (0.1 if i == hi else 0)
        if s > best:
            best = s
            img = {'u': im['u'], 'w': w, 'h': h, 'o': it['o']}

    outs = []
    for it in members:
        if it['o'] not in outs:
            outs.append(it['o'])
    langs = {outlets.get(o, {}).get('lang', 'it') for o in outs}
    wsum = sum(weight_of(o, outlets) for o in outs)
    rank = 20 + 14 * math.log2(1 + wsum) + (5 if len(langs) > 1 else 0) + (3 if img else 0)
    rank += 3 if topic in ('italia', 'mondo', 'economia') else 2 if topic == 'cronaca' else 0
    rank += 2 if any(o in AGENCIES for o in outs) else 0
    rank = int(max(15, min(96, round(rank))))
    return {'headline': headline, 'dek': dek, 'summary': summary, 'points': pts, 'topic': topic, 'alt': alt,
            'dossier': dossier, 'place': place, 'zona': zona, 'img': img, 'tags': tags_of(members, headline), 'rank': rank,
            'outletIds': outs, 'nf': sum(1 for o in outs if outlets.get(o, {}).get('lang', 'it') != 'it'), 'langs': sorted(langs)}


# ------------------------------------------------------------------ agenzie, sviluppi, segnalazioni
AG_OUT = {'ansa': 'ANSA', 'agi': 'AGI', 'adnkronos': 'Adnkronos'}
AG_IDS = {'ansa': 'ansa', 'agi': 'agi', 'adnkronos': 'adnkronos', 'lapresse': 'lapresse', 'askanews': 'askanews', 'italpress': 'italpress',
          'dire': 'dire', 'reuters': 'reuters', 'afp': 'afp', 'ap': 'ap', 'dpa': 'dpa', 'efe': 'efe', 'associated press': 'ap',
          'agence france-presse': 'afp'}
AG_MARK = re.compile(r'\((ANSA|AGI|Adnkronos|ADNKRONOS|LaPresse|Askanews|askanews|Italpress|ITALPRESS|DIRE|Dire|Reuters|AFP|AP|dpa|EFE)\)'
                     r'|\b[Ff]onte:?\s+(ANSA|AGI|Adnkronos|LaPresse|Askanews|Italpress|Dire|Reuters|AFP)\b')
AG_AUTHOR = re.compile(r'^\s*(ANSA|AGI|Adnkronos|LaPresse|Askanews|Italpress|Dire|Reuters|AFP|AP|Associated Press|Agence France-Presse)\b')
RETT = re.compile(r'\b(?:rettific|smentit|smentisc|precisazion|correzion|corrige|retract|correction|denies|denied)')
NUM_RX = re.compile(r'\b\d[\d.,]*\b')


def wordset(text):
    return {w[:7] for w in WORD.findall(L.norm(text or '')) if len(w) > 2 and w not in L.ALLSTOP}


def informative(text):
    """Nomi propri e numeri di un titolo: gli elementi che fanno di un titolo una notizia nuova."""
    t = text or ''
    names = {L.norm(m) for m in re.findall(r'(?<![.!?:«"“]\s)(?<![«"“\'‘])(?<!^)\b[A-ZÀ-Ý][\wà-ÿ\'’-]{2,}', t)}
    return {n for n in names if n not in L.ALLSTOP} | set(NUM_RX.findall(t))


def mark_agencies(srcs, raw):
    """Segna le voci che sono un lancio d'agenzia o lo riprendono: firma, sigla nel testo o titolo quasi identico a quello dell'agenzia."""
    ag_titles = [(x['o'], wordset(x.get('ti') or x['t'])) for x in srcs if x['o'] in AG_OUT]
    for x in srcs:
        x.pop('ag', None)
        if x['o'] in AG_OUT:
            x['ag'] = x['o']
            continue
        it = raw.get(x.get('k')) or {}
        m = AG_MARK.search(' '.join([x['t'], it.get('s') or x.get('s') or ''])) or AG_AUTHOR.search(it.get('a') or x.get('a') or '')
        if m:
            name = next(g for g in m.groups() if g)
            x['ag'] = AG_IDS.get(name.lower(), name.lower())
            continue
        ws = wordset(x.get('ti') or x['t'])
        for o, aw in ag_titles:
            if len(ws) >= 4 and aw and len(ws & aw) / len(ws | aw) >= 0.7:
                x['ag'] = o
                break


def load_reports(state):
    """Segnalazioni inviate dall'app (issue di GitHub lette dal workflow): articoli da staccare e sintesi da ritirare."""
    r = load(os.path.join(state, 'segnalazioni.json'), {}) or {}
    bad = {x['u'] for x in r.get('voci', []) if x.get('k') == 'fonte' and x.get('u')}
    off = {x['s'] for x in r.get('voci', []) if x.get('k') == 'sintesi' and x.get('s')}
    return bad, off


def source_rec(it, outlets, with_snip=True):
    r = {'o': it['o'], 't': it['t'], 'u': it['u'], 'd': iso(it['d']), 'l': it['l'], 'k': it['k']}
    if it.get('ti') and it['l'] != 'it':
        r['ti'] = it['ti']
    a = (it.get('a') or '').strip()
    if a and len(a) < 60 and not re.search(r'@|redazione|newsroom|staff', a, re.I) and L.norm(a) != L.norm(outlets.get(it['o'], {}).get('name', '')):
        r['a'] = a
    sn = isnip(it)
    if with_snip and sn and (it['l'] == 'it' or it.get('si')):
        r['s'] = short(sn, 240)
    return r


def eligible(members, outlets):
    outs = {it['o'] for it in members}
    if len(outs) >= 2:
        return True, False
    it = members[0]
    o = outlets.get(it['o'], {})
    if it.get('live'):
        return False, True
    if o.get('sec') in ('scienza', 'motori', 'roma') or it.get('h') in ('scienza', 'salute', 'tech', 'clima', 'motori', 'roma'):
        return bool(it.get('img') or len(it['s']) >= 40), True
    if it.get('img') and len(it['s']) >= 80:
        return True, True
    return False, True


# ------------------------------------------------------------------ edizioni
def edition_of(dt):
    loc = dt.astimezone(ROME)
    if 7 <= loc.hour < 19:
        start = loc.replace(hour=7, minute=0, second=0, microsecond=0)
        return f"{loc:%Y-%m-%d}-mattina", 'Edizione delle 7', start
    day = loc if loc.hour >= 19 else loc - timedelta(days=1)
    start = day.replace(hour=19, minute=0, second=0, microsecond=0)
    return f"{day:%Y-%m-%d}-sera", 'Edizione delle 19', start


def next_run(after):
    """Orari del workflow (UTC): :07 :22 :37 :52 dalle 4 alle 21, :07 nelle altre ore."""
    t = after.replace(second=0, microsecond=0) + timedelta(minutes=1)
    for _ in range(60 * 26):
        if (4 <= t.hour <= 21 and t.minute in (7, 22, 37, 52)) or (not 4 <= t.hour <= 21 and t.minute == 7):
            return t + timedelta(minutes=8)
        t += timedelta(minutes=1)
    return after + timedelta(minutes=30)


# ------------------------------------------------------------------ principale
def main():
    state, out = sys.argv[1], sys.argv[2]
    models = sys.argv[3] if len(sys.argv) > 3 else None
    os.makedirs(os.path.join(out, 'data'), exist_ok=True)
    raw = load(os.path.join(state, 'items.json'), [])
    outlets_src = load(os.path.join(state, 'outlets.json'), {})
    logos = load(os.path.join(state, 'logos.json'), {})
    status = load(os.path.join(state, 'status.json'), {})
    ed = load(os.path.join(state, 'editor.json'), {}) or {}
    trc = load(os.path.join(state, 'trcache.json'), {}) or {}
    geoc = geo_centroids(os.path.join(HERE, 'world.json'))
    prev = ed.get('stories', {})

    items = prepare(raw, outlets_src)
    tinfo = translate_items(items, trc, models)
    log(f'{len(items)} voci utili su {len(raw)}; traduzioni nuove: {tinfo["new"]}; cache: {len(trc)}')
    items.sort(key=lambda x: x['d'])
    X, vecs, df = vectorize(items)
    groups = cluster(items, X, TAU)
    n0 = len(groups)
    groups = merge_pass(groups, items, vecs, df)
    log(f'{n0} gruppi, {len(groups)} dopo le unioni')
    bad_u, sum_off = load_reports(state)
    if bad_u:
        split = []
        for g in groups:
            solo = [i for i in g if items[i]['u'] in bad_u] if len(g) > 1 else []
            rest = [i for i in g if i not in solo]
            if solo and rest:
                split.append(rest)
                split.extend([i] for i in solo)
            else:
                split.append(g)
        log(f'segnalazioni: {len(bad_u)} articoli staccati, {len(sum_off)} sintesi ritirate; {len(split) - len(groups)} gruppi in più')
        groups = split
    raw_by_k = {it['k']: it for it in items}

    key2prev = {}
    for sid, s in prev.items():
        for k in s.get('keys', []):
            key2prev[k] = sid
    used_prev = set()
    stories = {}
    claimed = {}
    gs = sorted(groups, key=lambda g: -len(g))
    plan = []
    cur_keys = {it['k'] for it in items}
    for g in gs:
        g = sorted(g, key=lambda i: items[i]['d'])
        members = [items[i] for i in g]
        ok, weak = eligible(members, outlets_src)
        cvec = centroid(vecs, g)
        ov = Counter(key2prev[it['k']] for it in members if it['k'] in key2prev)
        sid = None
        for cand, nshared in ov.most_common():
            if cand in used_prev:
                continue
            pk = sum(1 for k in prev[cand].get('keys', []) if k in cur_keys)
            if 2 * nshared >= min(len(members), max(1, pk)):
                sid = cand
                break
        if not sid:
            for cand, s in prev.items():
                if cand in used_prev or not s.get('vec'):
                    continue
                up = pdate(s.get('updatedAt') or '')
                if up and NOW - up < timedelta(hours=30) and cos(cvec, s['vec']) >= 0.55:
                    sid = cand
                    break
        if sid:
            used_prev.add(sid)
        if not ok and not sid:
            continue
        plan.append([g, members, weak, cvec, sid])
    # le storie di una sola testata entrano con un tetto per testata nelle ultime 24 ore
    have = Counter()
    for sid, s in prev.items():
        if s.get('weak') and s.get('outletIds') and (NOW - (pdate(s.get('updatedAt') or '') or NOW)) < timedelta(hours=24):
            have[(s['outletIds'][0], s.get('topic') == 'roma')] += 1

    def cap_of(o, local=False):
        if local:
            return 8
        sec = outlets_src.get(o, {}).get('sec')
        return {'it': 2, 'mondo': 1, 'scienza': 2, 'motori': 2}.get(sec, 1)

    def sing_score(it):
        hrs = (NOW - it['d']).total_seconds() / 3600
        return (2 if it.get('img') else 0) + (1 if len(it['s']) >= 100 else 0) + (1 if it.get('h') else 0) + (1 if it['o'] in AGENCIES else 0) - hrs / 12
    keep = []
    for row in sorted(plan, key=lambda r: -(sing_score(r[1][0]) if r[2] and not r[4] and len({m['o'] for m in r[1]}) == 1 else 99)):
        g, members, weak, cvec, sid = row
        if weak and not sid and len({m['o'] for m in members}) == 1:
            o = members[0]['o']
            loc = members[0].get('h') == 'roma'
            if (NOW - members[-1]['d']) > timedelta(hours=24) or have[(o, loc)] >= cap_of(o, loc):
                continue
            have[(o, loc)] += 1
        keep.append(row)
    for g, members, weak, cvec, sid in keep:
        base = build_story(members, g, vecs, outlets_src, geoc)
        srcs = [source_rec(it, outlets_src) for it in members]
        p = prev.get(sid) if sid else None
        if p:
            have = {x.get('k') or x['u'] for x in srcs}
            cutoff = NOW - timedelta(days=ARCHIVE_DAYS)
            for x in p.get('sources', []):
                kk = x.get('k') or x['u']
                if x.get('k') in cur_keys:
                    continue  # l'articolo è ancora nei feed: sta nel suo gruppo attuale
                if kk not in have and (pdate(x.get('d', '')) or NOW) > cutoff and x.get('u') not in bad_u:
                    srcs.append({k: v for k, v in x.items() if k != 's'})
                    have.add(kk)
            if not base['img'] and p.get('img') and p['img'].get('u'):
                base['img'] = p['img']
            if not base['place'] and p.get('place'):
                base['place'] = p['place']
            if len(base['outletIds']) == 1 and p.get('outletIds'):
                for o in p['outletIds']:
                    if o not in base['outletIds']:
                        base['outletIds'].append(o)
        else:
            day = members[0]['d'].astimezone(ROME).strftime('%Y%m%d')
            sid = f'{day}-{slug(base["headline"])}'
            while sid in stories or sid in prev:
                sid += '-' + hashlib.sha1((sid + members[0]['k']).encode()).hexdigest()[:3]
        srcs.sort(key=lambda x: x['d'])
        if len(srcs) > MAX_SOURCES:
            srcs = srcs[:2] + srcs[-(MAX_SOURCES - 2):]
        outs = []
        for x in srcs:
            if x['o'] not in outs:
                outs.append(x['o'])
        dates = [pdate(x['d']) for x in srcs if pdate(x['d'])]
        mark_agencies(srcs, raw_by_k)
        # nuovo sviluppo: un articolo arrivato dopo l'ultima edizione porta nomi o numeri che i titoli precedenti non avevano
        dev = (p or {}).get('dev')
        if p:
            oldk = set(p.get('keys', []))
            fresh = [it for it in members if it['k'] not in oldk]
            if fresh:
                old_txt = [x.get('ti') or x['t'] for x in p.get('sources', [])]
                old_w = set().union(*[wordset(t) for t in old_txt]) if old_txt else set()
                old_i = set().union(*[informative(t) for t in old_txt]) if old_txt else set()
                for it in fresh:
                    tt = ititle(it)
                    new_i = informative(tt) - old_i
                    new_w = wordset(tt) - old_w
                    kind = 'rettifica' if RETT.search(L.norm(tt)) else 'sviluppo' if (new_i and len(new_w) >= 3) else None
                    if kind:
                        dev = {'at': iso(it['d']), 't': short(tt, 160), 'o': it['o'], 'k': kind}
        st = dict(base)
        st.update({
            'outletIds': outs, 'sources': srcs, 'keys': [it['k'] for it in members] + [x['k'] for x in srcs if x.get('k')],
            'vec': cvec, 'weak': weak and len(outs) == 1,
            'publishedAt': iso(min(dates)), 'updatedAt': iso(min(NOW, max(dates))),
            'addedAt': (p or {}).get('addedAt') or iso(NOW), 'edition': (p or {}).get('edition') or edition_of(NOW)[0],
        })
        st['keys'] = list(dict.fromkeys(st['keys']))
        if dev:
            st['dev'] = dev
        if sid in sum_off:
            st['summary'], st['points'], st['sumOff'] = '', [], True
        if p and (p.get('updatedAt') != st['updatedAt'] or len(p.get('sources', [])) != len(srcs)):
            st['changedAt'] = iso(NOW)
        elif p:
            st['changedAt'] = p.get('changedAt') or p.get('addedAt')
        else:
            st['changedAt'] = iso(NOW)
        # rinforzo del rank con più fonti accumulate
        if len(outs) > len(base['outletIds']):
            wsum = sum(weight_of(o, outlets_src) for o in outs)
            st['rank'] = int(max(st['rank'], min(96, round(20 + 14 * math.log2(1 + wsum) + 3))))
        stories[sid] = st
        for it in members:
            claimed[it['k']] = sid

    # storie precedenti non più nei gruppi: restano in archivio
    for sid, s in prev.items():
        if sid in stories:
            continue
        up = pdate(s.get('updatedAt') or '') or NOW
        age = NOW - up
        if age > timedelta(days=ARCHIVE_DAYS):
            continue
        if s.get('weak') and age > timedelta(hours=48):
            continue
        keys = s.get('keys', [])
        if keys and sum(1 for k in keys if k in claimed) >= max(1, len(keys) * 0.6):
            continue  # confluita in un'altra storia
        srcs = [x for x in s.get('sources', []) if not (x.get('k') and x['k'] in claimed) and not (x.get('u') in bad_u and len(s.get('sources', [])) > 1)]
        if not srcs:
            continue
        if len(srcs) != len(s.get('sources', [])):
            s = dict(s)
            s['sources'] = srcs
            s['outletIds'] = list(dict.fromkeys(x['o'] for x in srcs))
            s['keys'] = [k for k in keys if k not in claimed]
        if s.get('topic') == 'roma' or 'roma' in (s.get('alt') or []):
            # storie d'archivio classificate con regole più larghe: le voci delle testate locali passano di nuovo
            # il filtro della cronaca locale e Roma resta solo se la storia è locale
            so = []
            for x in s.get('sources', []):
                oo = outlets_src.get(x['o'], {})
                if oo.get('sec') == 'roma' and not L.is_local_text(L.norm((x.get('t') or '') + ' . ' + (x.get('s') or '')),
                                                                     'mixed' if oo.get('mista') else 'local' if oo.get('rilancia') else 'pure'):
                    continue
                so.append(x)
            if not so:
                continue
            if len(so) != len(s.get('sources', [])):
                s = dict(s)
                s['sources'] = so
                s['outletIds'] = list(dict.fromkeys(x['o'] for x in so))
            loc = {x['o'] for x in so if outlets_src.get(x['o'], {}).get('sec') == 'roma' or x.get('h') == 'roma'}
            nat = {x['o'] for x in so} - loc
            ok = L.story_local(L.norm(s.get('headline') or ''), L.norm(' . '.join(x.get('t') or '' for x in so[:12])), len(loc), len(nat))
            if not ok or s.get('topic') != 'roma':
                s = dict(s)
                alt = [t for t in (s.get('alt') or []) if t != 'roma']
                if s.get('topic') == 'roma':
                    s['topic'], alt = (alt[0] if alt else 'cronaca'), alt[1:]
                    s.pop('zona', None)
                s['alt'] = alt
        stories[sid] = s
    # fonti conservate da giri precedenti che oggi le regole scartano (rubriche, pagine del giorno, guide tv)
    for st_ in stories.values():
        good = [x for x in st_.get('sources', []) if len(L.DATE_TAIL.sub('', x.get('t') or '').split()) >= 3 and not junk_title(x.get('t') or '')]
        if len(good) != len(st_.get('sources', [])):
            st_['sources'] = good
            st_['outletIds'] = list(dict.fromkeys(x['o'] for x in good))
    # ultima garanzia: lo stesso indirizzo non compare in due storie
    seen_u = {}
    for sid in sorted(stories, key=lambda k: (k not in {v for v in claimed.values()}, -len(stories[k].get('sources', [])))):
        st_ = stories[sid]
        keep_src = []
        for x in st_.get('sources', []):
            if x['u'] in seen_u and seen_u[x['u']] != sid:
                continue
            seen_u[x['u']] = sid
            keep_src.append(x)
        if len(keep_src) != len(st_.get('sources', [])):
            st_['sources'] = keep_src
            st_['outletIds'] = list(dict.fromkeys(x['o'] for x in keep_src))
    for sid in [k for k, v in stories.items() if not v.get('sources')]:
        stories.pop(sid)

    # tetto alle storie recenti: prima cadono le più deboli
    rec = [k for k, v in stories.items() if (NOW - (pdate(v['updatedAt']) or NOW)) < timedelta(hours=RECENT_HOURS)]

    def worth(k):
        v = stories[k]
        hrs = (NOW - (pdate(v['updatedAt']) or NOW)).total_seconds() / 3600
        spec = outlets_src.get((v.get('outletIds') or [''])[0], {}).get('sec') in ('scienza', 'motori', 'roma')
        return (v.get('rank', 40) + 6 * min(len(v.get('outletIds', [])), 6) - hrs * 0.8 + (4 if v.get('img') else 0)
                + (8 if spec else 0) + (10 if k in prev else 0))
    rec_l = [k for k in rec if stories[k].get('topic') == 'roma']
    rec = [k for k in rec if stories[k].get('topic') != 'roma']
    singles = sorted((k for k in rec if len(stories[k].get('outletIds', [])) < 2), key=worth, reverse=True)
    multis = sorted((k for k in rec if len(stories[k].get('outletIds', [])) >= 2), key=worth, reverse=True)
    n_single = min(len(singles), MAX_SINGLE, max(0, MAX_RECENT - min(len(multis), MAX_RECENT - min(len(singles), MAX_SINGLE))))
    n_multi = min(len(multis), MAX_RECENT - n_single)
    for k in singles[n_single:] + multis[n_multi:]:
        stories.pop(k)
    l_single = sorted((k for k in rec_l if len(stories[k].get('outletIds', [])) < 2), key=worth, reverse=True)
    l_multi = sorted((k for k in rec_l if len(stories[k].get('outletIds', [])) >= 2), key=worth, reverse=True)
    n_ls = min(len(l_single), MAX_LOCAL_SINGLE)
    n_lm = min(len(l_multi), MAX_LOCAL - n_ls)
    for k in l_single[n_ls:] + l_multi[n_lm:]:
        stories.pop(k)

    # traduzioni vecchie con caratteri persi («⁇»): si riparano dall'originale
    from translate import fix_unk, repair
    for v in stories.values():
        for f_ in ('headline', 'dek', 'summary'):
            if v.get(f_):
                v[f_] = fix_q(v[f_])
        v['points'] = [fix_q(p_) for p_ in v.get('points', [])]
        for x in v.get('sources', []):
            x['t'] = fix_q(x['t'])
            if x.get('ti') and '⁇' in x['ti']:
                r = repair(x['t'], x['ti'], x.get('l', 'en'))
                if r:
                    x['ti'] = r
                else:
                    x.pop('ti')
        if '⁇' in v.get('headline', ''):
            v['headline'] = fix_unk(v['headline'], ' '.join(x['t'] for x in v.get('sources', [])))
        for f_ in ('dek', 'summary'):
            if '⁇' in (v.get(f_) or ''):
                v[f_] = fix_unk(v[f_], ' '.join((x.get('s') or '') + ' ' + x['t'] for x in v.get('sources', [])))
        v['points'] = [fix_unk(p_, ' '.join(x['t'] for x in v.get('sources', []))) if '⁇' in p_ else p_ for p_ in v.get('points', [])]

    # prima pagina: con isteresi dentro l'edizione
    eid, elabel, estart = edition_of(NOW)
    prev_top = set(ed.get('top', [])) if ed.get('edition') == eid else set()
    cands = []
    for sid, s in stories.items():
        up = pdate(s['updatedAt']) or NOW
        hrs = (NOW - up).total_seconds() / 3600
        if hrs > 16 or len(s['outletIds']) < 2:
            continue
        if s.get('topic') == 'roma' and all(outlets_src.get(o, {}).get('sec') == 'roma' for o in s['outletIds']):
            continue  # in prima pagina solo la cronaca romana ripresa anche dalle testate nazionali
        sc = s['rank'] - 1.2 * hrs + (8 if sid in prev_top else 0) + (2 if s.get('img') else 0)
        cands.append((sc, sid))
    cands.sort(reverse=True)
    top, per_t, per_d = [], Counter(), Counter()
    for sc, sid in cands:
        s = stories[sid]
        if per_t[s['topic']] >= (1 if s['topic'] == 'roma' else 3) or (s.get('dossier') and per_d[s['dossier']] >= 2):
            continue
        if any(cos(s.get('vec') or {}, stories[t].get('vec') or {}) >= 0.3 for t in top):
            continue
        top.append(sid)
        per_t[s['topic']] += 1
        if s.get('dossier'):
            per_d[s['dossier']] += 1
        if len(top) == 9:
            break
    topset = set(top)
    for sid, s in stories.items():
        s['top'] = sid in topset
        nf = s.get('nf', 0)
        n = len(s['outletIds'])
        if s['top']:
            extra = f', {nf} {"straniera" if nf == 1 else "straniere"}' if nf else ''
            s['why'] = f'La raccontano {n} testate{extra}: è tra le storie più riprese dell\'{elabel.lower()}.'
        elif n >= 4:
            s['why'] = f'La raccontano {n} testate' + (f', {nf} dall\'estero.' if nf else '.')
        else:
            s['why'] = ''

    # dossier
    dossiers = {}
    for sid, s in stories.items():
        k = s.get('dossier')
        if not k or k not in L.DOSSIERS:
            continue
        title, topic, blurb, _, _ = L.DOSSIERS[k]
        d = dossiers.setdefault(k, {'title': title, 'topic': topic, 'blurb': blurb, 'updatedAt': s['updatedAt'], 'n': 0})
        d['n'] += 1
        if s['updatedAt'] > d['updatedAt']:
            d['updatedAt'] = s['updatedAt']
    for k in [k for k, d in dossiers.items() if d['n'] < 2]:
        for s in stories.values():
            if s.get('dossier') == k:
                s['dossier'] = None
        dossiers.pop(k)

    # testate
    outlets = {}
    for o, v in outlets_src.items():
        rec = dict(v)
        lg = logos.get(o)
        if lg and o not in LOGO_SKIP:
            rec['logo'] = f"logos/{o}.png?v={lg.get('sha', '')}"
            rec['logoBleed'] = bool(lg.get('bleed'))
            rec['logoBg'] = lg.get('bg') or '#FFFFFF'
        outlets[o] = rec

    st_out = status.get('outlets', {})
    nxt = next_run(NOW)
    meta = {
        'runAt': iso(NOW), 'label': elabel, 'edition': eid, 'editionAt': iso(estart), 'nextAt': iso(nxt),
        'collectedAt': status.get('generatedAt'), 'storyCount': len(stories), 'every': 15, 'repo': os.environ.get('GITHUB_REPOSITORY', ''),
        'outletsOk': sorted(o for o, v in st_out.items() if v.get('items')),
        'outletsFailed': sorted(o for o, v in st_out.items() if not v.get('items')),
        'translate': {'langs': tinfo.get('langs', {}), 'new': tinfo.get('new', 0), 'cached': len(trc)},
        'engine': 'eddy-redazione-1',
    }
    if os.environ.get('EDDY_APK'):
        meta['apk'] = os.environ['EDDY_APK']

    PUBLIC = ('headline', 'dek', 'summary', 'points', 'why', 'topic', 'alt', 'rank', 'top', 'dossier', 'tags', 'place', 'zona', 'edition',
              'sources', 'img', 'addedAt', 'publishedAt', 'updatedAt', 'outletIds', 'changedAt', 'dev', 'sumOff')
    recent, archive = [], []
    cut = NOW - timedelta(hours=RECENT_HOURS)
    for sid, s in sorted(stories.items(), key=lambda kv: kv[1]['updatedAt'], reverse=True):
        pub = {k: s.get(k) for k in PUBLIC if s.get(k) not in (None, '', [])}
        pub['id'] = sid
        # storie già in archivio scritte prima della pulizia dei «++»
        for k in ('headline', 'dek'):
            if k in pub:
                pub[k] = noplus(pub[k])
        if 'summary' in pub:
            pub['summary'] = noplus(pub['summary'], False)
        if 'points' in pub:
            pub['points'] = [noplus(x) for x in pub['points']]
        if any('++' in (x.get('t') or '') + (x.get('ti') or '') + (x.get('s') or '') for x in pub.get('sources', [])):
            pub['sources'] = [dict(x, **{f: noplus(x[f], f != 's') for f in ('t', 'ti', 's') if x.get(f)}) for x in pub['sources']]
        if (pdate(s['updatedAt']) or NOW) >= cut:
            recent.append(pub)
        else:
            pub['sources'] = [{k: v for k, v in x.items() if k not in ('s', 'k')} for x in pub.get('sources', [])]
            archive.append(pub)
    for pub in recent:
        out_src, nsnip = [], 0
        for x in pub.get('sources', []):
            y = {k: v for k, v in x.items() if k != 'k'}
            if y.get('s'):
                nsnip += 1
                if nsnip > 6:
                    y.pop('s')
                else:
                    y['s'] = short(y['s'], 200)
            out_src.append(y)
        pub['sources'] = out_src
    feed = {'v': 1, 'meta': meta, 'outlets': outlets, 'dossiers': {k: {kk: vv for kk, vv in d.items() if kk != 'n'} for k, d in dossiers.items()},
            'stories': recent, 'archive': {'n': len(archive), 'url': 'data/archive.json', 'at': iso(NOW)}}
    dump(os.path.join(out, 'data', 'feed.json'), feed)
    dump(os.path.join(out, 'data', 'archive.json'), {'v': 1, 'at': iso(NOW), 'stories': archive})
    for v in stories.values():
        if (NOW - (pdate(v.get('updatedAt') or '') or NOW)) > timedelta(hours=30):
            v.pop('vec', None)
            v['sources'] = [{k: x[k] for k in x if k != 's'} for x in v.get('sources', [])]
    ed_out = {'stories': stories, 'top': top, 'edition': eid, 'at': iso(NOW)}
    dump(os.path.join(state, 'editor.json'), ed_out)
    dump(os.path.join(state, 'trcache.json'), trc)
    nm = sum(1 for s in stories.values() if len(s['outletIds']) > 1)
    log(f'{len(stories)} storie ({nm} con più testate, {len(recent)} recenti, {len(archive)} in archivio), '
        f'prima pagina {len(top)}, dossier {len(dossiers)}')


if __name__ == '__main__':
    main()
