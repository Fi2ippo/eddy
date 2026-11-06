"""Traduzione automatica offline per Eddy: modelli OPUS-MT (Università di Helsinki) eseguiti con
CTranslate2, senza servizi esterni e senza costi.

  python translate.py need MODELS       esce con 0 se c'è da convertire qualche modello
  python translate.py setup MODELS      converte i modelli mancanti (serve torch+transformers, una volta)
  python translate.py test MODELS       traduce qualche frase di prova

Nel codice: Translator(MODELS).to_italian(['...'], 'en') -> lista di traduzioni (None se non disponibile).
Le lingue senza modello diretto verso l'italiano passano dall'inglese.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time

# candidati in ordine di preferenza; il primo che si converte vince
PAIRS = {
    'en-it': ['Helsinki-NLP/opus-mt-tc-big-en-it', 'Helsinki-NLP/opus-mt-en-it'],
    'fr-it': ['Helsinki-NLP/opus-mt-fr-it'],
    'de-it': ['Helsinki-NLP/opus-mt-de-it'],
    'es-it': ['Helsinki-NLP/opus-mt-es-it'],
    'fr-en': ['Helsinki-NLP/opus-mt-fr-en'],
    'de-en': ['Helsinki-NLP/opus-mt-de-en'],
    'es-en': ['Helsinki-NLP/opus-mt-es-en'],
    'nl-en': ['Helsinki-NLP/opus-mt-nl-en'],
    'pt-en': ['Helsinki-NLP/opus-mt-ROMANCE-en'],
}
# le coppie verso l'inglese servono solo se manca quella diretta verso l'italiano
PIVOT_FOR = {'fr-en': 'fr-it', 'de-en': 'de-it', 'es-en': 'es-it'}
MANIFEST = 'manifest.json'
RETRY_DAYS = 20


def _log(*a):
    print('[traduzione]', *a, flush=True)


# ------------------------------------------------------------------ preparazione dei modelli
def setup(root):
    os.makedirs(root, exist_ok=True)
    mpath = os.path.join(root, MANIFEST)
    man = {}
    if os.path.exists(mpath):
        try:
            man = json.load(open(mpath))
        except Exception:  # noqa: BLE001
            man = {}
    changed = False
    for pair, repos in PAIRS.items():
        direct = PIVOT_FOR.get(pair)
        if direct and (man.get(direct) or {}).get('ok') and os.path.exists(os.path.join(root, direct, 'model.bin')):
            continue
        cur = man.get(pair) or {}
        if cur.get('ok') and os.path.exists(os.path.join(root, pair, 'model.bin')):
            continue
        if cur.get('failedAt') and time.time() - cur['failedAt'] < RETRY_DAYS * 86400:
            continue
        done = False
        for repo in repos:
            if _convert(repo, os.path.join(root, pair)):
                man[pair] = {'ok': True, 'repo': repo, 'at': int(time.time())}
                done = True
                break
        if not done:
            man[pair] = {'ok': False, 'failedAt': int(time.time()), 'tried': repos}
        changed = True
    with open(mpath, 'w') as fh:
        json.dump(man, fh, indent=1)
    _log('modelli:', ', '.join(f"{p}={'ok' if v.get('ok') else 'no'}" for p, v in sorted(man.items())))
    return changed


def _convert(repo, out):
    tmp = out + '.tmp'
    shutil.rmtree(tmp, ignore_errors=True)
    try:
        r = subprocess.run(['ct2-transformers-converter', '--model', repo, '--output_dir', tmp, '--quantization', 'int8', '--force'],
                           capture_output=True, text=True, timeout=1500)
        if r.returncode != 0:
            _log('conversione fallita', repo, (r.stderr or r.stdout)[-400:])
            shutil.rmtree(tmp, ignore_errors=True)
            return False
        from huggingface_hub import hf_hub_download
        for f in ('source.spm', 'target.spm'):
            p = hf_hub_download(repo, f)
            shutil.copy(p, os.path.join(tmp, f))
        try:
            cfg = json.load(open(hf_hub_download(repo, 'config.json')))
        except Exception:  # noqa: BLE001
            cfg = {}
        meta = {'repo': repo, 'max': int(cfg.get('max_position_embeddings') or 512)}
        with open(os.path.join(tmp, 'eddy.json'), 'w') as fh:
            json.dump(meta, fh)
        shutil.rmtree(out, ignore_errors=True)
        os.rename(tmp, out)
        _log('convertito', repo)
        return True
    except Exception as ex:  # noqa: BLE001
        _log('errore', repo, str(ex)[:300])
        shutil.rmtree(tmp, ignore_errors=True)
        return False


def need(root):
    """True se manca almeno un modello da (ri)provare a convertire."""
    try:
        man = json.load(open(os.path.join(root, MANIFEST)))
    except Exception:  # noqa: BLE001
        return True
    for pair in PAIRS:
        cur = man.get(pair) or {}
        if cur.get('ok') and os.path.exists(os.path.join(root, pair, 'model.bin')):
            continue
        direct = PIVOT_FOR.get(pair)
        if direct and (man.get(direct) or {}).get('ok'):
            continue
        if cur.get('failedAt') and time.time() - cur['failedAt'] < RETRY_DAYS * 86400:
            continue
        return True
    return False


# ------------------------------------------------------------------ traduzione
SENT = re.compile(r'(?<=[.!?…])\s+(?=[«"“A-ZÀ-ÖØ-Þ0-9])')
# emoji e simboli che i modelli non conoscono (diventerebbero «⁇»)
EMOJI = re.compile('[\U0001F000-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D\u20E3\u2190-\u21FF\u25A0-\u25FF]+')
UNK = re.compile(r'(\w*)\s?⁇\s?(\w*)')
WORDS = re.compile(r"[a-zà-öø-ÿ]+")
# parole vuote per riconoscere una traduzione rimasta nella lingua d'origine (senza quelle comuni all'italiano)
STOPL = {
    'it': set('il lo gli di del della dei degli che per con non una sono nel nella alla alle dopo anche più come sulla questo'.split()),
    'en': set('the and of with for is are was were from after that this will has have says its their about into over'.split()),
    'de': set('der die das und mit für nicht ist ein eine den dem des auf sich im zum zur bei nach über wird werden'.split()),
    'fr': set('les des du et pour dans sur est au aux qui pas une ces leur sont avec été'.split()),
    'es': set('el los las y por para que es una del al sus como más fue han este esta'.split()),
    'pt': set('os não para uma com do em ao pela pelo são foi mais seu sua'.split()),
    'nl': set('het een en van voor met niet zijn dat op ook naar bij wordt'.split()),
}


def clean_src(t):
    t = EMOJI.sub(' ', t or '')
    return re.sub(r'\s{2,}', ' ', t).strip(' |·-–—')


def fix_unk(out, src):
    """Rimette le lettere che il modello non sa scrivere (ñ, ö, É, ğ…) prendendole dall'originale."""
    if '⁇' not in (out or ''):
        return out

    def find(pre, post):
        if not pre and not post:
            return None
        rx = (r'\b' if pre else r'(?<![\w])') + re.escape(pre) + r'[^\W\d_]{1,3}' + re.escape(post) + (r'\b' if post else r'(?![\w])')
        f = re.search(rx, src or '') or re.search(rx, src or '', re.I)
        return f.group(0) if f else None

    def sub(m):
        pre, post = m.group(1), m.group(2)
        w = find(pre, post)
        if w:
            return w
        w = find('', post) if post else None
        if w:
            return (pre + ' ' if pre else '') + w
        w = find(pre, '') if pre else None
        if w:
            return w + (' ' + post if post else '')
        return ' '.join(x for x in (pre, post) if x) or ' '
    out = UNK.sub(sub, out)
    return re.sub(r'\s{2,}', ' ', out.replace('⁇', '')).strip()


def italian_enough(out, lang):
    w = WORDS.findall((out or '').lower())
    if len(w) < 6 or lang == 'it':
        return True
    it = sum(1 for x in w if x in STOPL['it'])
    fo = sum(1 for x in w if x in STOPL.get(lang, ()))
    return not (fo >= 2 and fo > it)


def repair(src, out, lang):
    """Ripara una traduzione (anche presa dalla cache); None se è da rifare o da scartare."""
    if not out:
        return None
    out = tidy(fix_unk(out, src))
    if not out or not good(src, out) or not italian_enough(out, lang):
        return None
    return out
REPEAT = re.compile(r'\b(\w+(?:\s+\w+){0,3})(?:\s+\1\b){2,}', re.I)


class Translator:
    def __init__(self, root, threads=None):
        self.root = root
        self.models = {}
        self.ok = False
        try:
            import ctranslate2  # noqa: F401
            import sentencepiece  # noqa: F401
            self.ok = True
        except Exception as ex:  # noqa: BLE001
            _log('librerie assenti:', ex)
        self.threads = threads or max(1, os.cpu_count() or 1)
        try:
            self.manifest = json.load(open(os.path.join(root, MANIFEST)))
        except Exception:  # noqa: BLE001
            self.manifest = {}

    def has(self, pair):
        return self.ok and os.path.exists(os.path.join(self.root, pair, 'model.bin'))

    def _load(self, pair):
        if pair in self.models:
            return self.models[pair]
        m = None
        if self.has(pair):
            try:
                import ctranslate2
                import sentencepiece as spm
                d = os.path.join(self.root, pair)
                tr = ctranslate2.Translator(d, device='cpu', inter_threads=1, intra_threads=self.threads, compute_type='int8')
                src = spm.SentencePieceProcessor(model_file=os.path.join(d, 'source.spm'))
                tgt = spm.SentencePieceProcessor(model_file=os.path.join(d, 'target.spm'))
                m = (tr, src, tgt)
            except Exception as ex:  # noqa: BLE001
                _log('modello non caricato', pair, ex)
                m = None
        self.models[pair] = m
        return m

    def route(self, lang):
        if lang == 'it':
            return []
        if self.has(f'{lang}-it'):
            return [f'{lang}-it']
        if lang == 'en':
            return None
        if self.has(f'{lang}-en') and self.has('en-it'):
            return [f'{lang}-en', 'en-it']
        return None

    def available(self):
        return {lang: bool(self.route(lang)) for lang in ('en', 'fr', 'de', 'es', 'pt', 'nl')}

    def _run(self, pair, texts):
        m = self._load(pair)
        if not m:
            return [None] * len(texts)
        tr, src, tgt = m
        out = [None] * len(texts)
        live = [i for i, t in enumerate(texts) if t and t.strip()]
        toks = {i: src.encode(texts[i], out_type=str)[:400] + ['</s>'] for i in live}
        order = sorted(live, key=lambda i: len(toks[i]))
        B = 32
        for s in range(0, len(order), B):
            idx = order[s:s + B]
            try:
                res = tr.translate_batch([toks[i] for i in idx], beam_size=3, max_decoding_length=300,
                                         repetition_penalty=1.15, no_repeat_ngram_size=4)
            except Exception as ex:  # noqa: BLE001
                _log('errore di traduzione', pair, ex)
                continue
            for i, r in zip(idx, res):
                hyp = [t for t in r.hypotheses[0] if t not in ('</s>', '<pad>')]
                out[i] = tgt.decode(hyp)
        return out

    def to_italian(self, texts, lang):
        """Traduce in italiano; frase per frase per i testi lunghi. None dove non riesce."""
        route = self.route(lang)
        if not route:
            return [None] * len(texts)
        pieces, owner = [], []
        for i, t in enumerate(texts):
            t = (t or '').strip()
            if not t:
                continue
            t = clean_src(t)
            if not t:
                continue
            parts = [p for p in SENT.split(t) if p.strip()] if len(t) > 220 else [t]
            for p in parts:
                pieces.append(p)
                owner.append(i)
        cur = pieces
        for pair in route:
            cur = self._run(pair, cur)
        joined = [[] for _ in texts]
        for i, c in zip(owner, cur):
            joined[i].append(c)
        result = []
        for i, t in enumerate(texts):
            parts = joined[i]
            if not parts or not all(p and p.strip() for p in parts):
                result.append(None)
                continue
            result.append(repair(t, ' '.join(parts), lang))
        return result


def tidy(s):
    s = re.sub(r'\s+([,.;:!?»”])', r'\1', s)
    s = re.sub(r'([«“])\s+', r'\1', s)
    s = re.sub(r"(\w)\s+'\s*(?=\w)", r"\1'", s) if re.search(r"\w\s+'\s*\w", s) else s
    s = re.sub(r"\b([LlDdNnSsCcMmTtVv]|[Uu]n|[Dd]ell|[Nn]ell|[Ss]ull|[Dd]all|[Aa]ll|[Qq]uest|[Qq]uell|[Cc]om|[Dd]ov)'\s+(?=\w)", r"\1'", s)
    return re.sub(r'\s{2,}', ' ', s).strip()


def good(src, out):
    if not out or len(out) < 2:
        return False
    if REPEAT.search(out):
        return False
    r = len(out) / max(1, len(src))
    return 0.35 <= r <= 2.6


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        return
    cmd, root = sys.argv[1], sys.argv[2]
    if cmd == 'need':
        sys.exit(0 if need(root) else 1)
    if cmd == 'setup':
        changed = setup(root)
        go = os.environ.get('GITHUB_OUTPUT')
        if go:
            with open(go, 'a') as fh:
                fh.write(f"changed={'true' if changed else 'false'}\n")
    elif cmd == 'test':
        t = Translator(root)
        print(t.available())
        for lang, s in [('en', 'Trump says tariffs on China will stay until a deal is reached'),
                        ('fr', "Le gouvernement français présente son budget pour 2027"),
                        ('de', 'Die Bundesregierung plant neue Regeln für Elektroautos'),
                        ('es', 'El Gobierno aprueba la reforma de las pensiones')]:
            print(lang, '->', t.to_italian([s], lang))


if __name__ == '__main__':
    main()
