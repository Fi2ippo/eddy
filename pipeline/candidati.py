#!/usr/bin/env python3
"""Candidati per «Fuori dagli schemi»: gli studi nuovi di arXiv e bioRxiv, raccolti in silenzio.

  python candidati.py STATE                  aggiorna STATE/candidati-studi.json (al massimo ogni 3 ore per archivio)
  python candidati.py storico GIORNI FILE    scarica gli ultimi GIORNI in FILE (serve a tarare il filtro, non al sito)

Fonti: le API pubbliche e gratuite di arXiv (sezioni in ARXIV_CATS, una richiesta ogni 3 secondi) e di bioRxiv.
Per ogni studio: id, titolo, primo paragrafo del riassunto (al massimo 600 caratteri), link, fonte, sezione, data ed
eventuali testate di Eddy che ne parlano. Si tengono gli ultimi 21 giorni, in non più di 5 MB.
Niente di questo file entra in feed.json: lo legge solo il filtro (pipeline/insolito.py).
"""
import json
import math
import os
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

import feedparser
import requests

ARXIV_CATS = ['physics.pop-ph', 'q-bio.PE', 'cs.HC', 'cs.CY', 'econ.GN', 'stat.AP']
ARXIV_API = 'https://export.arxiv.org/api/query'
BIORXIV_API = 'https://api.biorxiv.org/details/biorxiv'
UA = {'User-Agent': 'eddy-raccolta/1.0 (aggregatore di notizie non commerciale; github.com/fi2ippo/eddy)'}
FILE = 'candidati-studi.json'
KEEP_DAYS = 21
MAX_BYTES = 5 * 1024 * 1024
EVERY_HOURS = 3      # a ogni giro si guarda, ma gli archivi si interrogano al massimo ogni 3 ore
ARXIV_PAUSE = 3.1    # secondi tra due richieste ad arXiv (limite chiesto da arXiv)
BIORXIV_PAUSE = 1.0
SNIP = 600
NOW = datetime.now(timezone.utc)


def iso(dt):
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def pdate(s):
    try:
        s = str(s or '')
        if len(s) == 10:
            s += 'T12:00:00Z'
        return datetime.strptime(s[:19], '%Y-%m-%dT%H:%M:%S').replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def squash(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', str(s or ''))).strip()


def first_par(text, n=SNIP):
    """Primo paragrafo del riassunto, tagliato a fine frase entro n caratteri."""
    t = str(text or '').strip()
    t = squash(re.split(r'\n\s*\n', t)[0])
    if len(t) <= n:
        return t
    cut = t[:n]
    m = list(re.finditer(r'[.!?](?=\s)', cut))
    if m and m[-1].end() > n * 0.5:
        return cut[:m[-1].end()]
    return cut.rsplit(' ', 1)[0].rstrip(',;:') + '…'


# ------------------------------------------------------------------ archivi
def fetch_arxiv(since, budget=60, page=200, log=print):
    """Studi delle sezioni ARXIV_CATS inviati dopo `since`, dal più recente. None se l'archivio non risponde."""
    out, start, t0 = [], 0, time.monotonic()
    q = ' OR '.join('cat:' + c for c in ARXIV_CATS)
    while time.monotonic() - t0 < budget:
        if start:
            time.sleep(ARXIV_PAUSE)
        try:
            r = requests.get(ARXIV_API, params={'search_query': q, 'sortBy': 'submittedDate', 'sortOrder': 'descending',
                                                'start': start, 'max_results': page}, headers=UA, timeout=(8, 40))
        except requests.RequestException as ex:
            log('arXiv: richiesta non riuscita', str(ex)[:120])
            return out or None
        if r.status_code != 200:
            log('arXiv: HTTP', r.status_code)
            return out or None
        ent = feedparser.parse(r.content).entries
        if not ent:
            break
        old = False
        for e in ent:
            d = pdate(e.get('published'))
            if not d:
                continue
            if d < since:
                old = True
                continue
            m = re.search(r'arxiv\.org/abs/([^v\s]+(?:/\d+)?)', e.get('id') or '')
            if not m:
                continue
            tags = [t.get('term') for t in e.get('tags') or []]
            prim = (e.get('arxiv_primary_category') or {}).get('term')
            sez = prim if prim in ARXIV_CATS else next((t for t in tags if t in ARXIV_CATS), prim or '')
            out.append({'id': 'arxiv:' + m.group(1), 't': squash(e.get('title')), 's': first_par(e.get('summary')),
                        'u': 'https://arxiv.org/abs/' + m.group(1), 'f': 'arxiv', 'sez': sez, 'd': iso(d)})
        if old or len(ent) < page:
            break
        start += page
    return out


def fetch_biorxiv(since, budget=60, log=print):
    """Studi di bioRxiv pubblicati dopo `since` (prima versione o revisioni: resta una voce per studio)."""
    out, cur, t0 = {}, 0, time.monotonic()
    span = f'{since:%Y-%m-%d}/{NOW:%Y-%m-%d}'
    while time.monotonic() - t0 < budget:
        if cur:
            time.sleep(BIORXIV_PAUSE)
        j = None
        for attempt in range(3):  # bioRxiv ogni tanto chiude la connessione: si riprova dopo una pausa
            try:
                r = requests.get(f'{BIORXIV_API}/{span}/{cur}', headers=UA, timeout=(8, 40))
                j = r.json() if r.status_code == 200 else None
                if j:
                    break
                log('bioRxiv: HTTP', r.status_code)
            except (requests.RequestException, ValueError) as ex:
                log('bioRxiv: richiesta non riuscita', str(ex)[:120])
            time.sleep(4 * (attempt + 1))
        if not j:
            return list(out.values()) or None
        col = j.get('collection') or []
        if not col:
            break
        for e in col:
            doi, d = e.get('doi'), pdate(e.get('date'))
            if not doi or not d or not e.get('title'):
                continue
            rec = {'id': 'biorxiv:' + doi, 't': squash(e['title']), 's': first_par(e.get('abstract')),
                   'u': 'https://www.biorxiv.org/content/' + doi, 'f': 'biorxiv', 'sez': squash(e.get('category')).lower(), 'd': iso(d)}
            old = out.get(rec['id'])
            if old:  # una revisione non rende nuovo lo studio: resta la data più vecchia
                rec['d'] = min(rec['d'], old['d'])
            out[rec['id']] = rec
        cur += len(col)
        try:
            total = int((j.get('messages') or [{}])[0].get('total') or 0)
        except (TypeError, ValueError):
            total = 0
        if cur >= total:
            break
    return list(out.values())


# ------------------------------------------------------------------ file dei candidati
def load(path):
    try:
        with open(path, encoding='utf-8') as fh:
            d = json.load(fh)
        return d if isinstance(d, dict) and isinstance(d.get('studi'), list) else {'studi': []}
    except (OSError, ValueError):
        return {'studi': []}


def prune(studi, days=KEEP_DAYS, max_bytes=MAX_BYTES):
    cut = iso(NOW - timedelta(days=days))
    studi = sorted((x for x in studi if x.get('d', '') >= cut), key=lambda x: x['d'], reverse=True)
    while studi and len(json.dumps(studi, ensure_ascii=False, separators=(',', ':')).encode()) > max_bytes - 2048:
        studi = studi[:int(len(studi) * 0.95)]  # troppo grande: restano i più recenti
    return studi


def merge(old, new):
    by = {x['id']: x for x in old if x.get('id')}
    for x in new:
        cur = by.get(x['id'])
        if cur:
            x = dict(x, d=min(x['d'], cur.get('d') or x['d']))
            if cur.get('testate'):
                x['testate'] = cur['testate']
        by[x['id']] = x
    return list(by.values())


def save(path, data):
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, path)


def update(state, log=print):
    path = os.path.join(state, FILE)
    data = load(path)
    at = data.get('at') or {}
    new = []
    for name, fn in (('arxiv', fetch_arxiv), ('biorxiv', fetch_biorxiv)):
        last = pdate(at.get(name))
        if last and NOW - last < timedelta(hours=EVERY_HOURS):
            continue
        # la prima volta quattro giorni (nel fine settimana arXiv non pubblica), poi da poco prima dell'ultima lettura
        since = max(NOW - timedelta(days=4), last - timedelta(days=1)) if last else NOW - timedelta(days=4)
        try:
            got = fn(since, budget=70, log=log)
        except Exception as ex:  # noqa: BLE001  # un archivio che cambia formato non deve fermare il giro
            log(name, 'errore:', repr(ex)[:160])
            got = None
        if got is None:  # archivio irraggiungibile: si riprova al prossimo giro
            log(f'{name}: nessuna risposta')
            continue
        at[name] = iso(NOW)  # anche senza novità: non si torna a chiedere prima di EVERY_HOURS
        new.extend(got)
        log(f'{name}: {len(got)} studi letti')
    studi = prune(merge(data.get('studi', []), new))
    save(path, {'v': 1, 'at': at, 'aggiornato': iso(NOW), 'studi': studi})
    log(f'candidati: {len(studi)} studi negli ultimi {KEEP_DAYS} giorni')


# ------------------------------------------------------------------ altre testate che parlano dello stesso studio
_W = re.compile(r'[a-z][a-z0-9-]{2,}')
_STOP = set('''the and for with from that this these those are was were been has have had not but its their our his her into over under
between among than then there here what which who whom when where why how all any each more most other some such only also new can
could may might will would should using use used based via towards toward study studies paper research researchers results result
analysis approach method methods model models data evidence show shows showed suggest suggests reveal reveals found find finds
scientists science university team work one two three first however while during after before about across both'''.split())


def _tok(text):
    return [w[:8] for w in _W.findall(str(text or '').lower()) if w not in _STOP]


def link_outlets(studi, items, outlets_of, days=4, thr=0.34, shared=4):
    """Segna in ogni studio recente le testate di Eddy che ne parlano (campo «testate»).
    items: voci della raccolta con titolo e sommario originali; outlets_of(k): testate della storia in cui la voce è finita
    (il raggruppamento della redazione). Confronto per parole rare in comune tra studio e voce in inglese."""
    cut = iso(NOW - timedelta(days=days))
    rec = [x for x in studi if x.get('d', '') >= cut]
    docs_i = [(it, Counter(_tok(it.get('t', '') + ' ' + (it.get('s') or '')))) for it in items if (it.get('l') or 'it') == 'en']
    if not rec or not docs_i:
        return 0
    docs_c = [Counter(_tok(x['t'] + ' ' + x['t'] + ' ' + x.get('s', ''))) for x in rec]
    df = Counter()
    for c in docs_c + [c for _, c in docs_i]:
        df.update(c.keys())
    n = len(docs_c) + len(docs_i)
    idf = {w: math.log((n + 1) / (k + 1)) + 1 for w, k in df.items()}

    def vec(c):
        v = {w: (1 + math.log(k)) * idf[w] for w, k in c.items() if df[w] < n * 0.2}
        nrm = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {w: x / nrm for w, x in v.items()}
    vi = [vec(c) for _, c in docs_i]
    idx = defaultdict(list)
    for j, v in enumerate(vi):
        for w in v:
            idx[w].append(j)
    done = 0
    for x, c in zip(rec, docs_c):
        v = vec(c)
        sc, sh = Counter(), Counter()
        for w, a in v.items():
            for j in idx.get(w, ()):
                sc[j] += a * vi[j][w]
                sh[j] += 1
        found = set(x.get('testate') or [])
        for j, s in sc.items():
            if s >= thr and sh[j] >= shared:
                found.update(outlets_of(docs_i[j][0]['k']) or [docs_i[j][0]['o']])
        if found != set(x.get('testate') or []):
            x['testate'] = sorted(found)
            done += 1
    return done


def main():
    if len(sys.argv) >= 4 and sys.argv[1] == 'storico':
        days, path = int(sys.argv[2]), sys.argv[3]
        since = NOW - timedelta(days=days)
        a = fetch_arxiv(since, budget=900)
        print(f'arXiv: {len(a)}', flush=True)
        b = fetch_biorxiv(since, budget=1500)
        print(f'bioRxiv: {len(b)}', flush=True)
        save(path, {'v': 1, 'aggiornato': iso(NOW), 'studi': sorted(a + b, key=lambda x: x['d'], reverse=True)})
        return 0
    update(sys.argv[1])
    return 0


if __name__ == '__main__':
    sys.exit(main())
