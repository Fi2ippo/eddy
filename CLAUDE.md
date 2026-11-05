# Eddy — brief di progetto (leggi tutto prima di toccare il codice)

## Cos'è
Eddy è un sito/app web **gratuito** che ogni giorno raccoglie notizie da testate e riviste, le **raggruppa per argomento**, le mostra in un **Feed verticale** e in una **pagina Storia** semplice ("In breve" + elenco delle fonti). L'utente sceglie i propri interessi; tutto ciò che salva/legge resta **solo nel suo browser** (localStorage). Nome: **Eddy** (prima "ALT": rinominare ovunque).
Obiettivo: aiutare a capire, non a scrollare. Linguaggio semplice, poche cose per volta.

## Chi sono io
Filippo, studente di UX design, non programmatore. Spiega in italiano semplice, un passo alla volta, senza gergo non spiegato. Prima di cambiare molti file dimmi cosa farai.

## Regole di lavoro (obbligatorie)
1. Un passo alla volta. Alla fine di ogni passo: `npx tsc --noEmit`, `npm run lint`, `npm run build`, e dimmi cosa è cambiato.
2. Non modificare file non necessari. Nessuna nuova dipendenza npm senza chiedermelo. Non cambiare la porta 3002 in sviluppo.
3. Mai confondere contenuti dimostrativi e reali: i dati demo vivono solo in `app/data/demo-*` (oggi non ce ne sono più); quelli reali arrivano da `stories.json` sul ramo `dati`, letto nel browser (`app/lib/stories.ts`).
4. Niente scrittura con IA nel prodotto: i testi sono **estratti brevi delle testate** (max 3 frasi) con link all'originale.
5. Rispetto delle fonti: mai copiare articoli interi; foto in hotlink con credito "Foto: <testata>" e `referrerpolicy="no-referrer"`; mai riscaricare/ospitare le foto; se una testata chiede la rimozione, aggiungere il suo dominio/URL a `data/blocklist.json`. Non è consulenza legale: se Eddy diventa pubblico, scrivere a ogni testata prioritaria o preferire fonti con licenza aperta.
6. Repository **pubblico** su GitHub (minuti di GitHub Actions gratuiti). Mai committare chiavi o dati personali.

## Decisioni prese (valgono per tutti i passi successivi)
- **Interessi dell'app (8):** tecnologia, economia, politica, scienza, cultura, societa, ambiente, design. Ogni storia ha `topics[]` presi solo da questi 8; il primo è la categoria mostrata.
- **"Mondo" NON è un interesse:** ogni storia ha `area` = `"italia"` | `"mondo"` e l'app avrà un filtro Italia / Mondo / Tutto.
- **Aprire la pagina Storia la registra nei Recenti** (come dice il design della Libreria).
- **Pagina Storia unica** che legge l'id dall'indirizzo (`/storia?id=...`), con i dati caricati nel browser: così il sito statico non va ricostruito per ogni storia.
- **Nessuna citazione di progetti di riferimento** nel sito, nel codice, nei commenti o nella documentazione (decisione di Filippo del 6/11/2026: l'autore è stato ringraziato a voce).
- **Dipendenze Python autorizzate per la pipeline** (solo GitHub Actions e Mac, mai nell'app): feedparser, numpy, scikit-learn e un traduttore offline gratuito (scelto: modelli Argos Translate eseguiti con `ctranslate2` + `sentencepiece`). Il codice deve girare con Python 3.9 sul Mac e 3.12 su Actions. Nessuna nuova dipendenza npm.

## Stato attuale del codice (questa cartella)
Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, lucide-react. Tutte le schermate hanno il nuovo design e usano i dati veri (passi 2 e 6 fatti). Oggi (`HomeView`) non mostra più 3 storie: ha intestazione con saluto e chip, carosello "Prima pagina" di 9 storie delle ultime 24 ore ordinate per testate + freschezza + foto, "Sfoglia", fila dei temi, "Ultime notizie" 20 alla volta). Ovunque: pillola "N testate" (`OutletsTag`) e orario relativo (`TimeAgo`). Altre schermate: Feed (`FeedView`), Storia unica `/storia?id=` (`StoryDetail`), Libreria (`LibraryView`), Profilo (`ProfileView`, pannelli dal basso). Storie: `app/lib/stories.ts` (scarica `stories.json` dal ramo `dati`, controlla i dati, ordina Feed e Oggi). Store personale: `app/lib/personal-store.ts` (chiave `eddy:personal:v1`; campi `interests`, `stories` con scheda della storia, `textSize`, `area`).

Raccolta (passo 5, fatta): `pipeline/` (più file, vedi `pipeline/collect.py`), 50 fonti via feed (con feed per sezione per ANSA, Il Post, Sole 24 Ore, Repubblica, Corriere, BBC, Guardian) + 88 via Google News (solo "Leggi su"). Workflow `.github/workflows/collect.yml` ogni ora: scrive `stories.json`, `state.json`, `report.json` sul ramo `dati` (un solo commit sostituito ogni volta). Prova locale: `python3 pipeline/collect.py` (scrive in `data/`, file ignorati da git); autotest: `python3 pipeline/selftest.py`.

## Design da applicare
Le proposte HTML sono in `design/*.dc.html` (Main=Oggi, Feed, Libreria, Profilo, Storia). Sono la fonte di verità per l'aspetto.
- Colori: sfondo #F5F7F2 con alone verde chiaro in alto a destra, verde principale #2F5443, verde tenue #E3ECE5, testo #17191C, secondario #3E4A44 / #4A5560, Feed scuro #0E1311 con testo #F6F4EC.
- Font Manrope 500–800 (usare `next/font/google`). Raggi grandi (card 30px, pulsanti a pillola), barra di navigazione fluttuante a pillola (74px) con 4 voci, testi mai sotto 12px.
- **Titoli di pagina sempre centrati.** Libreria: sezioni nell'ordine Salvati / Recenti / Da leggere con contatori. Il Feed è a tutto schermo, scuro, senza barra di navigazione, con X per chiudere e contatore "01 / 03".
- Pagina Storia: foto con categoria e credito, titolo, "In breve" (estratti), "Le fonti" (link "Leggi su <testata>"), barra in basso Salva / Da leggere, dimensione testo Piccolo 15 / Medio 17 / Grande 20 px (impostazione nel Profilo).

## Dati e architettura (tutto gratis)
```
data/sources.json  --(scripts/discover_feeds.py)-->  feed_url verificati
GitHub Action ogni ora: pipeline/collect.py  -->  ramo "dati": stories.json (+ state.json, report.json)
Next.js (output statico)  legge  stories.json (dal ramo dati)  -->  GitHub Pages / Cloudflare Pages
```
- `data/sources.json`: 357 fonti dal catalogo "Fuori dal Feed". Campi: id, name, area, category, mode (`news` | `fase2_api` | `fase2_dati`), topics, in_initial_selection, site, feed_url, feed_status, license_status, enabled. Si abilita una fonte (`enabled: true`) solo dopo aver controllato a mano feed e condizioni d'uso.
- `mode=fase2_*` (Google Scholar, OpenAlex, arXiv, Eurostat…) non sono giornali: restano fuori dal lancio.
- Storia (`stories.json`): id (stabile nel tempo), title, title_original, translated, category, topics[] (solo gli 8 interessi), area (italia|mondo), image, image_credit ("Foto: <testata>"), first_seen, updated, n_sources, summary[{source, text, translated}], sources[{name, title, url, via: feed|google_news}].
- Argomenti: lessico italiano+inglese in `pipeline/topics.json`; filtri delle non-notizie in `pipeline/filters.py`; soglia del raggruppamento `TAU` in `pipeline/cluster.py`.

## Fasi
1 Rinomina + design nuovo · 2 Pagina Storia · 3 Fonti verificate · 4 Pipeline + Action · 5 Dati reali nell'app · 6 Pubblicazione · 7 Rifiniture (PWA, sezioni personali, ricerca).
