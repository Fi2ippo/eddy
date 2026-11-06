# Eddy — brief di progetto (leggi tutto prima di toccare il codice)

## Cos'è
Eddy è un'app web **gratuita** e installabile che più volte all'ora raccoglie le notizie di circa 145 testate (italiane, estere, di Napoli e provincia, riviste di design, architettura e arte), riunisce in **un'unica storia** gli articoli che raccontano lo stesso fatto e la mostra con le testate in cima, un sommario fatto di frasi delle testate e i link agli originali. Sezioni: **Oggi** (prima pagina alle 7 e alle 19 + ultime notizie), **Per te** (temi scelti), **Esplora** (temi, dossier, testate, ricerca), **Salvati**, **Profilo**, più **Sfoglia** (una notizia per schermata) e **Ascolta** (lettura a voce del browser). Tutto ciò che l'utente sceglie o salva resta **solo nel suo browser**.

## Chi sono io
Filippo, studente di UX design, non programmatore. Spiega in italiano semplice, un passo alla volta, senza gergo non spiegato. Prima di cambiare molti file dimmi cosa farai.

## Regole di lavoro (obbligatorie)
1. Un passo alla volta. Alla fine di ogni passo: `python3 -m py_compile pipeline/*.py build_site.py make_icons.py`, `python3 pipeline/selftest.py`, `node --check site_src/app.js`, `node --check site_src/sw.js`, una prova di `build_site.py`, e dimmi cosa è cambiato.
2. Non modificare file non necessari. Nessuna nuova dipendenza senza chiedermelo. In locale il sito si guarda sulla porta 3002.
3. Mai confondere contenuti dimostrativi e reali: l'app mostra solo i dati veri prodotti dalla raccolta.
4. Niente scrittura con IA nel prodotto: sommari e punti chiave sono **frasi delle testate** (brevi, con nome e link all'originale); le traduzioni automatiche sono segnalate.
5. Rispetto delle fonti: mai copiare articoli interi; foto mostrate **direttamente dal sito della testata** con credito "Foto: <testata>" e `referrerpolicy="no-referrer"`, mai riscaricate, ospitate o fatte passare da servizi intermedi; niente loghi scaricati (bollini con le iniziali); se una testata chiede la rimozione, aggiungere il suo dominio/URL a `data/blocklist.json` (la raccolta lo rispetta). Non è consulenza legale: le condizioni d'uso delle fonti vanno controllate (`docs/licenze-da-controllare.md`).
6. Repository **pubblico** su GitHub. Mai committare chiavi o dati personali.

## Decisioni prese
- **Base dell'app (6/11/2026):** Filippo ha scelto di rifare Eddy sulla base di un'app di un amico che gli piace in tutto (codice riusato con il suo permesso). Differenze volute: sezioni **Design**, **Architettura**, **Arte e fotografia**; **Napoli e provincia** al posto di Roma; regole di Eddy su foto e loghi.
- **Nessuna citazione di progetti di riferimento** nel sito, nel codice, nei commenti o nella documentazione (l'autore è stato ringraziato a voce).
- **Dipendenze Python autorizzate** (solo GitHub Actions e Mac, mai nell'app): feedparser, requests, python-dateutil, pillow, numpy, scipy, snowballstemmer, ctranslate2, sentencepiece. Solo la prima volta su Actions, per convertire i modelli di traduzione OPUS-MT: torch, transformers, sacremoses, protobuf. Il codice deve girare con Python 3.9 sul Mac e 3.12 su Actions. Nessuna dipendenza npm: l'app è un solo file HTML/JS.

## Come è fatto
```
pipeline/sources.json ─► pipeline/collect.py (feed, foto og:image, Google News di riserva) ─► stato sul ramo "dati"
                         pipeline/editor.py (pulizia, traduzione, raggruppamento, temi, dossier, luoghi, prima pagina)
                         ─► site/data/feed.json + archive.json
site_src/ (page.html, app.js, sw.js) ─► build_site.py (+ make_icons.py) ─► site/ ─► GitHub Pages
```
- **Workflow** `.github/workflows/eddy.yml`: ogni giro raccoglie, compone, pubblica il sito e prenota il successivo (ambiente "attesa", timer 12 minuti); orari di riserva ogni mezz'ora; i giri bloccati da oltre 50 minuti si annullano. Sito: https://fi2ippo.github.io/eddy
- **Temi** (`site_src/app.js` TOPICS, `pipeline/lexicon.py` T): napoli, italia (Politica), mondo, economia, cronaca, scienza, salute, tech, clima, cultura, sport, motori, spettacoli, design, architettura, arte. Parole chiave in `lexicon.py`, testate specializzate in `OUTLET_TOPIC`, sezioni dei feed con `"h"` in `sources.json`.
- **Napoli e provincia:** testate con `"sec": "napoli"` e `"zona"` (citta, flegrea, vesuviana, nord, isole); riconoscimento della cronaca locale in `lexicon.py` (zone, nomi ambigui, altre province campane escluse, il Napoli calcio resta nello sport); luoghi per la mappa in `gazetteer.py`.
- **Quote:** fino a 320 storie recenti, di cui 80 a fonte unica; Napoli e i temi design/architettura/arte hanno quote proprie (`editor.py`); ogni testata ha almeno 12 voci garantite nella raccolta (`collect.py`).
- **Prova locale:** `python3 pipeline/collect.py pipeline/sources.json state`, poi `python3 pipeline/editor.py state site mt` (in `mt/en-it` un modello CTranslate2 inglese→italiano, facoltativo), poi `python3 build_site.py site` e `python3 -m http.server 3002 --directory site`. Le cartelle `state/`, `site/`, `mt/` sono ignorate da git.
- **Aggiungere una fonte:** voce in `pipeline/sources.json` (`o`, `name`, `short`, `color`, `kind`, `lang`, `site`, `sec`, `feeds: [{u, h}]`), dopo aver verificato feed e condizioni d'uso.

## Design
Aspetto e interazioni sono quelli di `site_src/page.html` (stile) e `site_src/app.js` (schermate): tema chiaro e scuro automatici, font Inter, schede morbide, pillole, barra di navigazione in basso con 5 voci. Icona di Eddy: "E" bianca su quadrato blu #2B3FD6 con punto arancio #FF7A3D (`make_icons.py`). Colori dei temi nuovi: Napoli #0A86BF, Design #5F7A12, Architettura #56677A, Arte #9B2242. Testi mai sotto 12px.
