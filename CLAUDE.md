# Eddy — brief di progetto (leggi tutto prima di toccare il codice)

## Cos'è
Eddy è un sito/app web **gratuito** che ogni giorno raccoglie notizie da testate e riviste, le **raggruppa per argomento**, le mostra in un **Feed verticale** e in una **pagina Storia** semplice ("In breve" + elenco delle fonti). L'utente sceglie i propri interessi; tutto ciò che salva/legge resta **solo nel suo browser** (localStorage). Nome: **Eddy** (prima "ALT": rinominare ovunque).
Obiettivo: aiutare a capire, non a scrollare. Linguaggio semplice, poche cose per volta.

## Chi sono io
Filippo, studente di UX design, non programmatore. Spiega in italiano semplice, un passo alla volta, senza gergo non spiegato. Prima di cambiare molti file dimmi cosa farai.

## Regole di lavoro (obbligatorie)
1. Un passo alla volta. Alla fine di ogni passo: `npx tsc --noEmit`, `npm run lint`, `npm run build`, e dimmi cosa è cambiato.
2. Non modificare file non necessari. Nessuna nuova dipendenza npm senza chiedermelo. Non cambiare la porta 3002 in sviluppo.
3. Mai confondere contenuti dimostrativi e reali: i dati demo vivono solo in `app/data/demo-*`, quelli reali arrivano da `public/data/stories.json`.
4. Niente scrittura con IA nel prodotto: i testi sono **estratti brevi delle testate** (max 3 frasi) con link all'originale.
5. Rispetto delle fonti: mai copiare articoli interi; foto in hotlink con credito "Foto: <testata>" e `referrerpolicy="no-referrer"`; mai riscaricare/ospitare le foto; se una testata chiede la rimozione, aggiungere il suo dominio/URL a `data/blocklist.json`. Non è consulenza legale: se Eddy diventa pubblico, scrivere a ogni testata prioritaria o preferire fonti con licenza aperta.
6. Repository **pubblico** su GitHub (minuti di GitHub Actions gratuiti). Mai committare chiavi o dati personali.

## Stato attuale del codice (questa cartella)
Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, lucide-react. Schermate: Oggi, Feed, Libreria (Salvati/Recenti/Da leggere), Profilo (interessi + impostazioni). Store personale in `app/lib/personal-store.ts` (chiave localStorage `alt:personal:v1` → rinominare in `eddy:personal:v1` con migrazione dei dati vecchi). Demo in `app/data/demo-stories.ts`.

## Design da applicare
Le proposte HTML sono in `design/*.dc.html` (Main=Oggi, Feed, Libreria, Profilo, Storia). Sono la fonte di verità per l'aspetto.
- Colori: sfondo #F5F7F2 con alone verde chiaro in alto a destra, verde principale #2F5443, verde tenue #E3ECE5, testo #17191C, secondario #3E4A44 / #4A5560, Feed scuro #0E1311 con testo #F6F4EC.
- Font Manrope 500–800 (usare `next/font/google`). Raggi grandi (card 30px, pulsanti a pillola), barra di navigazione fluttuante a pillola (74px) con 4 voci, testi mai sotto 12px.
- **Titoli di pagina sempre centrati.** Libreria: sezioni nell'ordine Salvati / Recenti / Da leggere con contatori. Il Feed è a tutto schermo, scuro, senza barra di navigazione, con X per chiudere e contatore "01 / 03".
- Pagina Storia: foto con categoria e credito, titolo, "In breve" (estratti), "Le fonti" (link "Leggi su <testata>"), barra in basso Salva / Da leggere, dimensione testo Piccolo 15 / Medio 17 / Grande 20 px (impostazione nel Profilo).

## Dati e architettura (tutto gratis)
```
data/sources.json  --(scripts/discover_feeds.py)-->  feed_url verificati
GitHub Action ogni 2 ore: pipeline/collect.py  -->  data/stories.json
Next.js (output statico)  legge  public/data/stories.json  -->  GitHub Pages / Cloudflare Pages
```
- `data/sources.json`: 357 fonti dal catalogo "Fuori dal Feed". Campi: id, name, area, category, mode (`news` | `fase2_api` | `fase2_dati`), topics, in_initial_selection, site, feed_url, feed_status, license_status, enabled. Si abilita una fonte (`enabled: true`) solo dopo aver controllato a mano feed e condizioni d'uso.
- `mode=fase2_*` (Google Scholar, OpenAlex, arXiv, Eurostat…) non sono giornali: restano fuori dal lancio.
- Storia (`stories.json`): id, title, topics[], image, image_credit, updated, n_sources, summary[] (estratti), sources[{name,title,url}].
- Argomenti (`topics`) da allineare agli 8 interessi in `app/data/editorial-interests.ts`; il lessico vive in `pipeline/collect.py` (TOPIC_WORDS).

## Fasi
1 Rinomina + design nuovo · 2 Pagina Storia · 3 Fonti verificate · 4 Pipeline + Action · 5 Dati reali nell'app · 6 Pubblicazione · 7 Rifiniture (PWA, sezioni personali, ricerca).
