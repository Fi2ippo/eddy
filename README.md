# Eddy

Eddy è un'app web gratuita che raccoglie le notizie di circa 145 testate (italiane, estere, di Napoli e provincia e
riviste di design, architettura e arte), riunisce in un'unica storia gli articoli che raccontano lo stesso fatto e la
mostra con le testate in cima, un sommario fatto di frasi delle testate e i link agli articoli originali.
Nessun testo è scritto dall'intelligenza artificiale.

**Sito:** https://fi2ippo.github.io/eddy (si può installare sul telefono: "Aggiungi alla schermata Home").

Non ci sono account né tracciamento: temi scelti, testate seguite e notizie salvate restano solo nel browser.

## Come funziona

```
pipeline/sources.json ─► pipeline/collect.py ─► pipeline/editor.py ─► site/data/feed.json
site_src/ ─► build_site.py ─► site/ ─► GitHub Pages            (stato della raccolta sul ramo "dati")
```

Il workflow `.github/workflows/eddy.yml` gira circa ogni 15 minuti: legge i feed, cerca le foto (che restano sui siti
delle testate), traduce i testi stranieri con modelli liberi offline (OPUS-MT con CTranslate2), raggruppa gli articoli
per fatto, assegna temi, dossier e luoghi, compone la prima pagina alle 7 e alle 19, costruisce il sito e lo pubblica.

## Provare sul proprio computer

Serve Python 3.9 o più recente.

```sh
pip install -r pipeline/requirements.txt
python3 pipeline/selftest.py                                   # controlli senza rete
python3 pipeline/collect.py pipeline/sources.json state        # raccolta
python3 pipeline/editor.py state site mt                       # storie (mt: modelli di traduzione, facoltativi)
python3 build_site.py site
python3 -m http.server 3002 --directory site                   # poi apri http://localhost:3002
```

## Aggiungere una fonte

Aggiungi una voce a `pipeline/sources.json` con `o` (identificativo), `name`, `short` (iniziali), `color`, `kind`,
`lang`, `site`, `sec` (`it`, `mondo`, `scienza`, `design`, `napoli`, `motori`) e `feeds` (`[{"u": indirizzo, "h": tema}]`).
Prima verifica che il feed funzioni e leggi le condizioni d'uso della testata.

## Togliere un contenuto

Le richieste arrivano dal modulo GitHub "Richiesta di rimozione" (Issues → New issue). Per eseguirle aggiungi a
`data/blocklist.json` l'indirizzo esatto dell'articolo o il dominio del sito (vale anche per i sottodomini); se serve,
togli la testata da `pipeline/sources.json`. Dal giro successivo il contenuto non viene più raccolto.

Testi e foto restano delle rispettive testate; Eddy ne mostra solo brevi estratti con link. Questo non è un parere
legale: prima di un uso pubblico ampio va chiesto il permesso alle testate principali.
