"""Traduzione automatica offline verso l'italiano, gratuita e senza servizi esterni, con CTranslate2 + SentencePiece.

Motori, dal migliore:
1. OPUS-MT "tc-big" inglese→italiano (Università di Helsinki), nella conversione per CTranslate2 pubblicata su
   Hugging Face (ooeoeo/opus-mt-tc-big-en-it-ct2-float16, licenza Apache 2.0), scaricata a una versione fissa.
   Nelle prove su 30 titoli veri è nettamente migliore di Argos.
2. Argos Translate inglese→italiano (più piccolo): riserva se il primo non si scarica.
I modelli si scaricano una volta e si conservano (sul Mac in .cache/, su GitHub Actions nella cache del workflow).
Ogni testo tradotto finisce nella cache dello stato e non si traduce più; al massimo MAX_NEW_SENTENCES frasi nuove
per giro, così un giro resta sotto i 10 minuti anche quando si cambia motore (le frasi non ancora ritradotte usano
la traduzione precedente).

Le traduzioni si riparano o si scartano se hanno lettere sconosciute, ripetizioni o una lunghezza strana.
"""
from __future__ import annotations

import io
import re
import shutil
import zipfile
from pathlib import Path

from common import NOW, fetch, log, short_hash

ENGINES = {
    "en": [
        {"tag": "tcbig", "kind": "hf", "repo": "ooeoeo/opus-mt-tc-big-en-it-ct2-float16",
         "rev": "ad98d533b469ecc4b266412eaa2c3d84d636675e",
         "files": ["config.json", "model.bin", "shared_vocabulary.json", "source.spm", "target.spm"]},
        {"tag": "argos", "kind": "argos", "url": "https://argos-net.com/v1/translate-en_it-1_0.argosmodel"},
    ],
}
LANG_NAMES = {"en": "inglese", "fr": "francese", "es": "spagnolo", "de": "tedesco", "pt": "portoghese", "nl": "olandese"}
CACHE_DAYS = 10  # una traduzione non più usata da 10 giorni esce dalla cache
MAX_NEW_SENTENCES = 1200

_SENT = re.compile(r"(?<=[.!?…])\s+(?=[«\"“A-ZÀ-Ý0-9])")
_PIPE = re.compile(r"\s+\|\s+")  # "Titolo | Autore": le parti si traducono separatamente
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
        self.sentences = 0
        self.engine_used: dict = {}

    # ------------------------------------------------------------ modelli
    def _download(self, eng: dict) -> Path | None:
        d = self.dir / eng["tag"]
        ready = d / ("model.bin" if eng["kind"] == "hf" else "model/model.bin")
        if ready.exists():
            return d
        if not self.enabled:
            return None
        try:
            log(f"scarico il modello di traduzione {eng['tag']} (una volta sola)…")
            tmp = self.dir / (eng["tag"] + ".tmp")
            shutil.rmtree(tmp, ignore_errors=True)
            tmp.mkdir(parents=True)
            if eng["kind"] == "hf":
                for f in eng["files"]:
                    _, data = fetch(f"https://huggingface.co/{eng['repo']}/resolve/{eng['rev']}/{f}", timeout=600, max_bytes=900_000_000)
                    (tmp / f).write_bytes(data)
                target = tmp
            else:
                _, data = fetch(eng["url"], timeout=300, max_bytes=400_000_000)
                with zipfile.ZipFile(io.BytesIO(data)) as zf:
                    zf.extractall(tmp)
                target = next(p for p in tmp.iterdir() if p.is_dir())  # il pacchetto Argos contiene una cartella
            shutil.rmtree(d, ignore_errors=True)
            shutil.move(str(target), str(d))
            shutil.rmtree(tmp, ignore_errors=True)
            return d
        except Exception as ex:  # noqa: BLE001
            log("modello di traduzione non disponibile:", eng["tag"], ex)
            return None

    def _load(self, lang: str):
        """Primo motore disponibile per la lingua: (tag, traduttore, spm sorgente, spm destinazione, fine frase?)."""
        if lang in self.models:
            return self.models[lang]
        m = None
        for eng in ENGINES.get(lang, []):
            d = self._download(eng)
            if not d:
                continue
            try:
                import ctranslate2
                import sentencepiece as spm
                if eng["kind"] == "hf":
                    m = (eng["tag"], ctranslate2.Translator(str(d), device="cpu", compute_type="int8"),
                         spm.SentencePieceProcessor(model_file=str(d / "source.spm")),
                         spm.SentencePieceProcessor(model_file=str(d / "target.spm")), True)
                else:
                    sp = spm.SentencePieceProcessor(model_file=str(d / "sentencepiece.model"))
                    m = (eng["tag"], ctranslate2.Translator(str(d / "model"), device="cpu", compute_type="int8"), sp, sp, False)
                break
            except Exception as ex:  # noqa: BLE001
                log("modello di traduzione non caricato:", eng["tag"], ex)
        self.models[lang] = m
        return m

    def can(self, lang: str) -> bool:
        return lang == "it" or lang in ENGINES

    # ------------------------------------------------------------ traduzione
    def to_italian(self, texts: list[str], lang: str) -> list[str | None]:
        """Traduce una lista di testi; None dove non riesce (si userà l'originale)."""
        today = NOW.strftime("%Y-%m-%d")
        out: list[str | None] = [None] * len(texts)
        model = self._load(lang) if self.enabled else None
        tag = model[0] if model else None
        todo = []
        for i, t in enumerate(texts):
            if not t:
                continue
            hit = self.cache.get(short_hash(f"{lang}|{tag}|{t}", 16)) if tag else None
            old = self.cache.get(short_hash(lang + "|" + t, 16))  # traduzione del motore precedente (Argos)
            if hit:
                hit[1] = today
                out[i] = hit[0]
            elif model and self.sentences < MAX_NEW_SENTENCES:
                todo.append((i, t))
                self.sentences += len(_pieces(t))
            elif old:
                old[1] = today
                out[i] = old[0]
        if not todo:
            return out
        _, tr, sp_src, sp_tgt, add_eos = model
        pieces, owner = [], []
        for n, (_, t) in enumerate(todo):
            for p in _pieces(t):
                pieces.append(p)
                owner.append(n)
        try:
            res = tr.translate_batch([sp_src.encode(p, out_type=str)[:300] + (["</s>"] if add_eos else []) for p in pieces],
                                     beam_size=3 if add_eos else 2, max_batch_size=16, max_decoding_length=300,
                                     repetition_penalty=1.1)
            trans = [sp_tgt.decode([w for w in r.hypotheses[0] if w not in ("</s>", "<pad>", "<s>")]) for r in res]
        except Exception as ex:  # noqa: BLE001
            log("errore di traduzione:", ex)
            return out
        joined: list[list[tuple[str, str]]] = [[] for _ in todo]
        for n, p, t in zip(owner, pieces, trans):
            joined[n].append((p, t))
        for n, (i, src) in enumerate(todo):
            parts = joined[n]
            fixed = _repair(src, _rejoin(src, parts))
            if fixed:
                out[i] = fixed
                self.cache[short_hash(f"{lang}|{tag}|{src}", 16)] = [fixed, today]
                self.new += 1
                self.engine_used[tag] = self.engine_used.get(tag, 0) + 1
            else:
                self.failed += 1
                old = self.cache.get(short_hash(lang + "|" + src, 16))
                if old:
                    out[i] = old[0]
        return out


def _pieces(text: str) -> list[str]:
    """Frase per frase (il modello perde le frasi dopo la prima se gliele si dà insieme); "|" separa le parti."""
    out = []
    for part in _PIPE.split(_EMOJI.sub(" ", text).strip()):
        out += [p.strip() for p in _SENT.split(part) if p.strip()]
    return out


def _rejoin(src: str, parts: list[tuple[str, str]]) -> str:
    """Rimette insieme le frasi tradotte, con " | " dove il testo originale aveva le sue parti."""
    if not _PIPE.search(src):
        return " ".join(t for _, t in parts)
    out, k = [], 0
    for part in _PIPE.split(_EMOJI.sub(" ", src).strip()):
        n = len([p for p in _SENT.split(part) if p.strip()])
        out.append(" ".join(t for _, t in parts[k:k + n]))
        k += n
    return " | ".join(x for x in out if x)


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
