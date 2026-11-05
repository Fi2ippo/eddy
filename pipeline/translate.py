"""Traduzione automatica offline verso l'italiano, gratuita e senza servizi esterni.

Usa i modelli di Argos Translate (https://www.argosopentech.com), eseguiti con CTranslate2 e SentencePiece:
niente torch, niente conversioni. Il modello inglese→italiano (~90 MB) si scarica una volta e si conserva
(sul Mac in .cache/, su GitHub Actions nella cache del workflow).
Ogni testo tradotto finisce nella cache dello stato (data/state.json) e non si traduce più.

Le traduzioni si riparano o si scartano se hanno lettere sconosciute, ripetizioni o una lunghezza strana.
"""
from __future__ import annotations

import io
import re
import shutil
import zipfile
from pathlib import Path

from common import NOW, fetch, log, short_hash

# lingua di partenza -> pacchetto Argos verso l'italiano (per aggiungere una lingua basta un pacchetto diretto)
PACKAGES = {
    "en": "https://argos-net.com/v1/translate-en_it-1_0.argosmodel",
}
CACHE_DAYS = 10  # una traduzione non più usata da 10 giorni esce dalla cache

_SENT = re.compile(r"(?<=[.!?…])\s+(?=[«\"“A-ZÀ-Ý0-9])")
_EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍⃣]+")
_REPEAT = re.compile(r"\b(\w+(?:\s+\w+){0,3})(?:\s+\1\b){2,}", re.I)
_EN_STOP = set("the and of with for is are was were from after that this will has have says its their about into over".split())
_IT_STOP = set("il lo gli di del della dei degli che per con non una sono nel nella alla alle dopo anche più come".split())


class Translator:
    def __init__(self, models_dir: Path, cache: dict, enabled: bool = True):
        self.dir = Path(models_dir)
        self.cache = cache  # {chiave: [traduzione, "AAAA-MM-GG ultimo uso"]}
        self.enabled = enabled
        self.models: dict = {}
        self.new = 0
        self.failed = 0

    # ------------------------------------------------------------ modelli
    def _model_path(self, lang: str) -> Path | None:
        d = self.dir / f"{lang}_it"
        if (d / "model" / "model.bin").exists() and (d / "sentencepiece.model").exists():
            return d
        url = PACKAGES.get(lang)
        if not url or not self.enabled:
            return None
        try:
            log(f"scarico il modello di traduzione {lang}→it (una volta sola)…")
            _, data = fetch(url, timeout=300, max_bytes=400_000_000)
            tmp = self.dir / f"{lang}_it.tmp"
            shutil.rmtree(tmp, ignore_errors=True)
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                zf.extractall(tmp)
            inner = next(p for p in tmp.iterdir() if p.is_dir())  # il pacchetto contiene una cartella
            shutil.rmtree(d, ignore_errors=True)
            d.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(inner), str(d))
            shutil.rmtree(tmp, ignore_errors=True)
            return d
        except Exception as ex:  # noqa: BLE001
            log("modello di traduzione non disponibile:", lang, ex)
            return None

    def _load(self, lang: str):
        if lang in self.models:
            return self.models[lang]
        m = None
        d = self._model_path(lang)
        if d:
            try:
                import ctranslate2
                import sentencepiece as spm
                m = (ctranslate2.Translator(str(d / "model"), device="cpu", compute_type="int8"),
                     spm.SentencePieceProcessor(model_file=str(d / "sentencepiece.model")))
            except Exception as ex:  # noqa: BLE001
                log("modello di traduzione non caricato:", lang, ex)
        self.models[lang] = m
        return m

    def can(self, lang: str) -> bool:
        return lang == "it" or lang in PACKAGES

    # ------------------------------------------------------------ traduzione
    def to_italian(self, texts: list[str], lang: str) -> list[str | None]:
        """Traduce una lista di testi; None dove non riesce (si userà l'originale)."""
        today = NOW.strftime("%Y-%m-%d")
        out: list[str | None] = [None] * len(texts)
        todo = []
        for i, t in enumerate(texts):
            if not t:
                continue
            key = short_hash(lang + "|" + t, 16)
            hit = self.cache.get(key)
            if hit:
                hit[1] = today
                out[i] = hit[0]
            else:
                todo.append((i, t, key))
        if not todo or not self.enabled:
            return out
        model = self._load(lang)
        if not model:
            return out
        tr, sp = model
        # frase per frase: il modello perde le frasi dopo la prima se gliele si dà insieme
        pieces, owner = [], []
        for n, (i, t, _) in enumerate(todo):
            for p in _SENT.split(_EMOJI.sub(" ", t).strip()):
                if p.strip():
                    pieces.append(p.strip())
                    owner.append(n)
        try:
            res = tr.translate_batch([sp.encode(p, out_type=str)[:300] for p in pieces], beam_size=2,
                                     max_batch_size=32, max_decoding_length=300, repetition_penalty=1.1)
            trans = [sp.decode(r.hypotheses[0]) for r in res]
        except Exception as ex:  # noqa: BLE001
            log("errore di traduzione:", ex)
            return out
        joined: list[list[str]] = [[] for _ in todo]
        for n, t in zip(owner, trans):
            joined[n].append(t)
        for n, (i, src, key) in enumerate(todo):
            fixed = _repair(src, " ".join(joined[n]))
            if fixed:
                out[i] = fixed
                self.cache[key] = [fixed, today]
                self.new += 1
            else:
                self.failed += 1
        return out


def _repair(src: str, out: str) -> str | None:
    out = re.sub(r"\s+([,.;:!?»”])", r"\1", (out or "").replace("⁇", " "))
    out = re.sub(r"\s{2,}", " ", out).strip()
    if not out or _REPEAT.search(out):
        return None
    ratio = len(out) / max(1, len(src))
    if not 0.4 <= ratio <= 2.5:
        return None
    w = re.findall(r"[a-zà-ÿ]+", out.lower())
    if len(w) >= 6 and sum(x in _EN_STOP for x in w) >= 2 and sum(x in _EN_STOP for x in w) > sum(x in _IT_STOP for x in w):
        return None  # è rimasta in inglese
    if src[:1].isupper():
        out = out[:1].upper() + out[1:]
    return out


def prune_cache(cache: dict) -> None:
    """Toglie le traduzioni non usate da CACHE_DAYS giorni."""
    from datetime import timedelta
    limit = (NOW - timedelta(days=CACHE_DAYS)).strftime("%Y-%m-%d")
    for k in [k for k, v in cache.items() if not isinstance(v, list) or len(v) != 2 or v[1] < limit]:
        cache.pop(k, None)
