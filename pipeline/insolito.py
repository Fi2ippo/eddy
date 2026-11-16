"""Filtro di «Fuori dagli schemi»: ogni giorno sceglie, tra gli studi raccolti (candidati.py), i 5 più interessanti.

Solo regole e punteggi, niente API, niente modelli di intelligenza artificiale, niente dipendenze nuove.
Uno studio vale se è insieme sorprendente, serio e comprensibile. Il punteggio è la somma di pochi segnali,
ognuno con un peso (WEIGHTS), tarati sui voti di Filippo (studi-prova/valuta.py):

  fonte           arXiv e bioRxiv hanno un peso diverso (arXiv ha riassunti più leggibili, bioRxiv è molto tecnico)
  campo           i campi di bioRxiv che parlano a tutti (ecologia, comportamento…) contro quelli da laboratorio
  sorpresa        «for the first time», «unexpected», «contrary to», «why do», domande nel titolo…
  rumore          «a novel framework», «we propose», «state-of-the-art», «platform»…
  sigle           sigle e nomi tecnici fitti nel titolo (GIP/GLP-2, TGFβ, SLIM-2PF)
  titolo          né troppo corto né lunghissimo
  leggibilità     parole molto lunghe nel riassunto
  umano           persone, società, lavoro, animali, spazio, storia: temi che si capiscono senza essere del campo
  altre testate   +punti se altre testate di Eddy ne parlano; se non ne parlano non toglie nulla
  tetto           al massimo 2 studi per campo, così non escono 5 studi dallo stesso settore
"""
import math
import re

N_DAILY = 5          # studi scelti ogni giorno
WINDOW_DAYS = 3      # si sceglie tra gli studi degli ultimi 3 giorni
PER_FIELD = 2        # tetto per campo (sezione di arXiv o categoria di bioRxiv)
STICKY = 0.4         # un po' di vantaggio a chi era già stato scelto, così la lista non balla a ogni giro
MIN_ABSTRACT = 120   # senza un riassunto leggibile non si sceglie

SURPRISE = re.compile(
    r"\bfor the first time\b|\bfirst (?:evidence|demonstration|observation|direct|time)\b|\bunexpected(?:ly)?\b|\bsurpris(?:e|es|ed|ing|ingly)\b|"
    r"\bcontrary to\b|\bcounterintuitive\b|\bcounter-intuitive\b|\bparadox(?:ical)?\b|\bpuzzl(?:e|es|ing)\b|\bmyster(?:y|ies|ious)\b|"
    r"\bwhy (?:do|does|did|are|is|can|we|people|some)\b|\bhow (?:do|does|did|can|could|many|much)\b|\bwhat (?:if|happens|makes|we could lose)\b|"
    r"\bdespite\b|\bin spite of\b|\bnot (?:as|what) (?:expected|thought)\b|\bchallenge[sd]? (?:the )?(?:assumption|view|belief|idea)|"
    r"\bdefy(?:ing)?\b|\bfail(?:s|ed)? to\b|\bhidden\b|\bbias(?:es)?\b|\bhumans?\b.{0,40}\b(?:vs|versus|or)\b.{0,40}\bmachines?\b|"
    r"\bfermi paradox\b|\bextraterrestrial\b|\balien\b|\bancient\b|\bextinct\b|\bdead\b|\bsecret\b|\bstrange\b|\bodd\b|\bweird\b", re.I)
NOISE = re.compile(
    r"\b(?:novel|a new) (?:framework|approach|method|algorithm|architecture|pipeline|platform|paradigm)\b|\bwe (?:propose|present|introduce|develop|devise)\b|"
    r"\bstate-of-the-art\b|\bsota\b|\bframework\b|\bplatform\b|\bpipeline\b|\bbenchmark(?:s|ing)?\b|\boutperform(?:s|ed|ing)?\b|"
    r"\bmulti-?scale\b|\bmulti-?modal\b|\bmulti-?source\b|\bend-to-end\b|\bscalable\b|\bgpu\b|\balgorithm(?:s|ic)?\b|\bestimators?\b|\bestimation\b|"
    r"\bposterior\b|\bbayesian\b|\bstochastic\b|\bfractional\b|\bkernel\b|\bmanifold\b|\bmonoid\b|\bsimulation\b|\bnumerical\b|"
    r"\bin vitro\b|\bin vivo\b|\bknockout\b|\bknockdown\b|\banalogue?s?\b|\bsignal(?:l)?ing\b|\btranscriptional\b|\bregulat(?:es|ion|ory)\b|\bpathway\b", re.I)
HUMAN = re.compile(
    r"\b(?:people|persons?|humans?|humanity|society|societal|social|public|citizens?|voters?|workers?|jobs?|work|labou?r|retirement|fertility|children|"
    r"students?|teachers?|women|men|gender|racial|race|culture|cultural|language models?|llms?|chatgpt|ai|artificial intelligence|trust|fact-check\w*|"
    r"misinformation|elections?|ballot|football|soccer|baseball|sports?|games?|music|art|history|historical|ancient|roman|civili[sz]ations?|"
    r"animals?|birds?|parrots?|dogs?|cats?|apes?|primates?|insects?|bees?|fish|ocean|forest|climate|planet|planets|mars|moon|galaxy|stars?|universe|"
    r"cosmic|interstellar|space|life|evolution|extinction|cities|urban|mobility|electric vehicles?|energy|food|sleep|brain)\b", re.I)
JARGON_TOKEN = re.compile(r"^[A-Za-z]*[A-Z]{2,}[A-Za-z0-9/-]*$|^[A-Za-z]+[0-9][A-Za-z0-9-]*$|^[A-Za-z0-9]+-[0-9A-Za-z]+$|[α-ωΑ-Ω]")
QUESTION_START = re.compile(r"^(?:why|how|what|when|where|who|do|does|did|can|could|is|are|will|should)\b", re.I)

# campi di bioRxiv che parlano a tutti contro quelli da laboratorio (conoscenza generale, non ricavata dai voti)
BIO_BROAD = {'ecology', 'evolutionary biology', 'animal behavior and cognition', 'paleontology', 'scientific communication and education',
             'epidemiology', 'neuroscience', 'zoology', 'genomics', 'genetics', 'microbiology', 'biodiversity', 'public and global health'}
BIO_LAB = {'biochemistry', 'biophysics', 'molecular biology', 'cell biology', 'immunology', 'cancer biology', 'physiology', 'pharmacology and toxicology',
           'bioengineering', 'synthetic biology', 'systems biology', 'plant biology', 'developmental biology', 'bioinformatics', 'pathology',
           'biophysics', 'cell biology', 'pharmacology', 'genetics', 'biochemistry'}
BIO_LAB -= {'genetics'}

# pesi: per ogni segnale quanti punti dà. Tarati su 60 voti di Filippo (regressione con penalità, segni decisi in partenza);
# «noise», «acronym» e «hard» hanno pesi piccoli di prudenza perché i 60 voti non bastano a misurarli.
# «press» non è misurabile con quei voti: è un'ipotesi, da ritarare con i dati veri di Eddy.
WEIGHTS = {'arxiv': 1.25, 'bio_broad': 0.5, 'bio_lab': -2.0, 'surprise': 0.5, 'question': 1.0, 'noise': -0.25, 'acronym': -0.25,
           'title_len': -0.25, 'hard': -0.5, 'human': 0.25, 'press': 1.0}


def _words(t):
    return re.findall(r"[A-Za-zÀ-ÿ0-9α-ωΑ-Ω][A-Za-zÀ-ÿ0-9α-ωΑ-Ω'’/-]*", t or '')


def features(x):
    """Segnali di uno studio (dict con t, s, f, sez, testate). Tutti numeri tra 0 e 3 circa."""
    t, s = x.get('t') or '', x.get('s') or ''
    ts = t + ' . ' + s
    w = _words(t)
    f = {}
    f['arxiv'] = 1.0 if x.get('f') == 'arxiv' else 0.0
    cat = (x.get('sez') or '').lower()
    f['bio_broad'] = 1.0 if x.get('f') == 'biorxiv' and cat in BIO_BROAD else 0.0
    f['bio_lab'] = 1.0 if x.get('f') == 'biorxiv' and cat in BIO_LAB else 0.0
    f['surprise'] = float(min(3, len(SURPRISE.findall(ts))))
    f['question'] = 1.0 if t.rstrip().endswith('?') or QUESTION_START.match(t) else 0.0
    f['noise'] = float(min(3, len(NOISE.findall(t)) * 2 + len(NOISE.findall(s))))
    f['acronym'] = float(min(3, sum(1 for tok in w if JARGON_TOKEN.search(tok) and tok.lower() not in ('ai', 'llm', 'llms', 'covid-19', 'us'))))
    n = len(w)
    f['title_len'] = 1.0 if n < 4 or n > 18 else 0.0
    sw = _words(s)
    f['hard'] = (sum(1 for a in sw if len(a) >= 13) / len(sw)) * 10 if sw else 0.0   # ~0.5 per 5% di parole lunghissime
    f['human'] = float(min(3, len(HUMAN.findall(ts))))
    f['press'] = 1.0 if x.get('testate') else 0.0
    return f


def score(x, weights=None):
    w = weights or WEIGHTS
    f = features(x)
    return sum(w[k] * v for k, v in f.items())


def field_of(x):
    return (x.get('sez') or x.get('f') or '?').lower()


def pick(studi, now, n=N_DAILY, window_days=WINDOW_DAYS, prev=(), weights=None):
    """I n studi migliori degli ultimi window_days giorni, al massimo PER_FIELD per campo. now: datetime con fuso."""
    from datetime import timedelta
    cut = (now - timedelta(days=window_days)).strftime('%Y-%m-%dT%H:%M:%SZ')
    prev = set(prev)
    rows = []
    for x in studi:
        if x.get('d', '') < cut or len(x.get('s') or '') < MIN_ABSTRACT or not x.get('u'):
            continue
        rows.append((score(x, weights) + (STICKY if x['id'] in prev else 0), x['d'], x['id'], x))
    rows.sort(key=lambda r: (r[0], r[1], r[2]), reverse=True)
    out, per = [], {}
    for sc, _, _, x in rows:
        k = field_of(x)
        if per.get(k, 0) >= PER_FIELD:
            continue
        per[k] = per.get(k, 0) + 1
        out.append((sc, x))
        if len(out) == n:
            break
    return out
