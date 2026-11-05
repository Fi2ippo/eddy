"""Raggruppamento degli articoli in storie (stesso fatto raccontato da testate diverse).

1. Ogni articolo diventa un vettore TF-IDF (scikit-learn) fatto di radici di parole: titolo in italiano (tradotto
   per le testate estere) con peso doppio, estratto con peso semplice, nomi propri con peso maggiore.
2. Somiglianza coseno fra tutti gli articoli. Due articoli possono stare insieme solo se hanno almeno 2 parole
   importanti in comune; se sono lontani nel tempo (oltre 36 ore) la somiglianza si riduce.
3. Raggruppamento "average linkage" con soglia TAU: due gruppi si uniscono se la somiglianza media fra tutti i loro
   articoli supera TAU. Mai due articoli della stessa testata e della stessa sezione nello stesso gruppo.
4. Gli articoli di Google News (solo titolo) non creano gruppi: si agganciano al gruppo più simile, se abbastanza
   simile, per aggiungere "Leggi su <testata>".

Il metodo: TF-IDF con nomi propri pesati, average linkage, riduzione per distanza nel tempo.
"""
from __future__ import annotations

import os

import numpy as np
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

from textproc import proper_nouns, stems

TAU = float(os.environ.get("EDDY_TAU", "0.30"))        # soglia del raggruppamento (più alta = gruppi più prudenti)
GN_TAU = float(os.environ.get("EDDY_GN_TAU", "0.45"))  # soglia per agganciare un titolo di Google News
MIN_SHARED = 2        # parole importanti in comune, almeno (i nomi propri non contano due volte)
GN_MIN_SHARED = 3     # per i titoli di Google News (solo titolo, quindi più prudenza)
MAX_GROUP = 20        # articoli al massimo in una storia
FAR_HOURS = 36


def _title(a):
    return a.get("title_it") or a["title"]


def _extract(a):
    return (a.get("extract_it") or a.get("extract") or "")[:420]


def _propers(a):
    p = proper_nouns(a["title"])
    if a.get("title_it"):
        p += proper_nouns(a["title_it"])
    return sorted(set(p))


def _doc(a, with_extract=True):
    toks = stems(_title(a)) * 2
    if with_extract:
        toks += stems(_extract(a))
    for p in _propers(a):
        toks += [p, p, p]
    return toks


def _identity(doc):
    return doc


def _hours(a):
    d = a.get("published") or a.get("first_seen")
    return d.timestamp() / 3600 if d else 0.0


def _plain(doc):
    return [w for w in doc if not w.startswith("#")]


def _binary(docs, vocab):
    """Matrice 0/1 delle parole importanti (quelle rimaste nel vocabolario TF-IDF) di ogni documento.
    I nomi propri (#...) non contano: le loro parole sono già fra le parole normali, altrimenti conterebbero due volte."""
    plain_vocab = {w: i for i, w in enumerate(w for w in vocab if not w.startswith("#"))}
    return CountVectorizer(analyzer=_plain, vocabulary=plain_vocab, binary=True, dtype=np.float32).transform(docs)


def _average_linkage(S, forbid, tau, max_size):
    """Average linkage con vincoli: unisce sempre la coppia di gruppi più simile finché la media supera tau."""
    n = S.shape[0]
    C = S.astype(np.float64).copy()
    np.fill_diagonal(C, 0.0)
    F = forbid.copy()
    size = np.ones(n)
    active = np.ones(n, dtype=bool)
    members = [[i] for i in range(n)]
    while True:
        A = C / np.outer(size, size)
        A[~active, :] = -1
        A[:, ~active] = -1
        A[F] = -1
        A[(size[:, None] + size[None, :]) > max_size] = -1
        np.fill_diagonal(A, -1)
        k = int(A.argmax())
        i, j = divmod(k, n)
        if A[i, j] < tau:
            break
        C[i, :] += C[j, :]
        C[:, i] += C[:, j]
        C[i, i] = 0.0
        C[j, :] = 0.0
        C[:, j] = 0.0
        F[i, :] |= F[j, :]
        F[:, i] |= F[:, j]
        size[i] += size[j]
        active[j] = False
        members[i] += members[j]
        members[j] = []
    return [m for m in members if m]


def cluster(arts: list[dict], tau: float = TAU):
    """Raggruppa gli articoli (non Google News). Restituisce (gruppi come liste di indici, vettorizzatore)."""
    n = len(arts)
    if n == 0:
        return [], None
    docs = [_doc(a) for a in arts]
    vec = TfidfVectorizer(analyzer=_identity, sublinear_tf=True, norm="l2", min_df=1,
                          max_df=0.25 if n > 40 else 1.0)
    X = vec.fit_transform(docs)
    S = (X @ X.T).toarray()
    B = _binary(docs, vec.vocabulary_)
    shared = (B @ B.T).toarray()
    S[shared < MIN_SHARED] = 0.0
    t = np.array([_hours(a) for a in arts])
    S[np.abs(t[:, None] - t[None, :]) > FAR_HOURS] *= 0.75
    np.fill_diagonal(S, 0.0)
    # solo gli articoli con almeno un vicino sopra soglia possono finire in un gruppo (la media non supera il massimo)
    cand = np.where(S.max(axis=1) >= tau)[0]
    in_cand = set(cand.tolist())
    groups = [[i] for i in range(n) if i not in in_cand]
    if len(cand):
        keys = np.array([f"{arts[i]['source_id']}|{arts[i].get('section') or ''}" for i in cand])
        forbid = keys[:, None] == keys[None, :]
        np.fill_diagonal(forbid, False)
        for g in _average_linkage(S[np.ix_(cand, cand)], forbid, tau, MAX_GROUP):
            groups.append([int(cand[i]) for i in g])
    return groups, vec


def attach_google_news(groups: list[list[int]], arts: list[dict], gn: list[dict], vec, tau: float = GN_TAU) -> dict:
    """Aggancia i titoli di Google News ai gruppi. Restituisce {indice gruppo: [articoli Google News]}."""
    out: dict = {}
    if not gn or not groups or vec is None:
        return out
    member_idx = [i for g in groups for i in g]
    owner = np.array([gi for gi, g in enumerate(groups) for _ in g])
    mdocs = [_doc(arts[i], with_extract=False) for i in member_idx]
    gdocs = [_doc(a, with_extract=False) for a in gn]
    Xm, Xg = vec.transform(mdocs), vec.transform(gdocs)
    S = (Xg @ Xm.T).toarray()
    vocab = vec.vocabulary_
    shared = (_binary(gdocs, vocab) @ _binary(mdocs, vocab).T).toarray()
    S[shared < GN_MIN_SHARED] = 0.0
    G = len(groups)
    counts = np.bincount(owner, minlength=G).astype(float)
    sources = [{arts[i]["source_id"] for i in g} for g in groups]
    taken = [set() for _ in groups]
    order = np.argsort(-S.max(axis=1)) if S.size else []
    for r in order:
        row = S[r]
        if row.max() < tau:
            continue
        avg = np.bincount(owner, weights=row, minlength=G) / counts
        a = gn[r]
        for gi in np.argsort(-avg):
            if avg[gi] < tau:
                break
            if a["source_id"] in sources[gi] or a["source_id"] in taken[gi]:
                continue
            out.setdefault(int(gi), []).append(a)
            taken[gi].add(a["source_id"])
            break
    return out
