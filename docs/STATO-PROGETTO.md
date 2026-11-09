# Eddy: stato del progetto

Aggiornato al 9 novembre 2026: nuovo design online su **https://fi2ippo.github.io/eddy**.
Repository pubblico: https://github.com/Fi2ippo/eddy. I dati raccolti stanno sul ramo `dati`.
Le regole decise da Filippo sono in `CLAUDE.md`, nella sezione "Decisioni prese".

---

## Nuovo design (8–9 novembre 2026)
Riferimento: `docs/design-definitivo/` (deciso da Filippo schermata per schermata). Lavoro sul ramo `nuovo-design`, un commit per passo; raccolta, redazione e formato dei dati non sono cambiati.
- [x] **1 · Fondamenta:** Schibsted Grotesk servito dal sito, variabili CSS, solo tema chiaro, colori dei temi "Famiglie Solare", luce dell'ora, logo "Tre notizie" e nuova icona.
- [x] **2 · Barra di navigazione** fluttuante a icone; Sfoglia è una voce della barra.
- [x] **3 · Oggi:** prima pagina a mazzo di carte trascinabile (anche con le frecce), Napoli e provincia, Ultime notizie.
- [x] **4 · Storia:** riga del tema, In breve, cronologia (ultimi 3 + tutta), capitoli Punti chiave, Confronto, Le fonti.
- [x] **5 · Sfoglia:** una notizia per schermata con foto incorniciata e frase di una testata.
- [x] **6 · Per te:** il filo, Collegate, primo giorno (poi sostituiti il 9/11 dai mazzi dei temi, vedi sotto).
- [x] **7 · Salvati:** cartelle per tema, Recenti per giorno con le novità, cartella con titolo nel colore del tema.
- [x] **8 · Profilo:** nome modificabile, temi più letti, pannelli per temi, testo, edizione, privacy; cancella i dati.
- [x] **9 · Primo avvio:** benvenuto, temi, nome; la prima volta in Oggi la carta si muove da sola.
- [x] **10 · Pulizia:** tolti Ascolta, Esplora e ricerca, seguire/silenziare, avvisi, tema scuro, "Installa Eddy" e il codice non più usato. I dati già salvati nel browser restano.
- [x] **11 · Controllo finale** a 390px contro le schermate, tastiera, console.
- [x] Unito a `main` e pubblicato (9/11).
- [x] **Temi a pillole per famiglia** nel primo avvio e nel pannello del Profilo (9/11).
- [x] **Fondo in cima alla pagina:** html e barra di stato nel colore di cima della luce dell'ora, niente più fascia grigia nel rimbalzo; grigio in fondo, in Storia e in Sfoglia (9/11).
- [x] **Nuovo Per te** (9/11): un mazzo per ogni tema scelto con le notizie nuove (dall'ultima apertura del tema, salvata nel browser), "Altri temi", pagina del tema con "Sfoglia le N notizie" e "Nei tuoi temi". Sfoglia dalla barra mostra prima i tuoi temi. Tolti "Si sono mosse", "Collegate" e il primo giorno.
- [x] **Spazi sull'iPhone** (9/11): barra a 16px dal fondo, circa 22px dal bordo sull'iPhone (`--nav-gap`), usata anche per fondo pagina, toast, Sfoglia e pannelli; mazzo di Oggi alto quanto lo schermo permette (380–500px) con carta e puntini sopra la barra; colore della barra di stato già nell'`<head>`; spazi di Per te, tema, Salvati, cartella, Profilo e primo avvio allineati ai riferimenti (entro 4px).

## Nuova app (6 novembre 2026)
Filippo ha deciso di rifare Eddy sulla base di un'app di un amico che gli piace in tutto (codice riusato con il suo permesso, nessuna citazione). Lavoro fatto sul ramo `nuova-app` e poi portato su `main`:
- [x] **1 · Base:** sito in una sola pagina (`site_src/`, `build_site.py`), raccolta (`pipeline/collect.py`) e redazione automatica (`pipeline/editor.py`) al posto del sito Next.js e della vecchia raccolta. Nome Eddy ovunque, icone nuove (`make_icons.py`).
- [x] **2 · Sezioni nuove:** Design, Architettura, Arte e fotografia, con 32 riviste verificate (design e UX, architettura, arte e fotografia) e parole chiave controllate contro i falsi positivi.
- [x] **3 · Napoli e provincia** al posto di Roma: 12 testate locali verificate, 5 zone (Napoli, Area flegrea, Area vesuviana, Area nord e nolana, Isole e penisola sorrentina), luoghi sulla mappa, il Napoli calcio resta nello sport.
- [x] **4 · Regole di Eddy:** foto mostrate direttamente dal sito della testata con credito "Foto: testata", nessun logo scaricato (bollini con le iniziali), `data/blocklist.json` rispettato.
- [x] **5 · Automazione:** `.github/workflows/eddy.yml` (raccolta, redazione, sito e prenotazione del giro dopo, circa ogni 15 minuti).
- [x] **6 · Pubblicazione** su https://fi2ippo.github.io/eddy

Le sezioni qui sotto descrivono la versione precedente (Next.js) e restano come storia del progetto.

## Lavori di novembre (lista di controllo)
Se il lavoro si interrompe, si riparte dalla prima fase non spuntata.

- [x] **A** · La raccolta deve girare sempre — verificato il 6/11: il giro delle 00:18 ha prenotato da solo quello delle 00:50, entrambi riusciti (circa 2 minuti di raccolta ciascuno). Corretto un blocco: un giro annullato rimasto "in attesa" fermava la catena; ora il passo "prenota" ignora i giri in attesa da più di 90 minuti.
- [x] **B** · Home (chip, Sfoglia, spazio in fondo) — chip identiche e Sfoglia tolto già il 5/11; misurato lo spazio in fondo: almeno 48px fra l'ultimo contenuto e la barra in Oggi, Libreria, Profilo e Storia
- [x] **C** · Storie più ricche (pipeline + pagina Storia)
  - **Raccolta** (`pipeline/enrich.py`, `pipeline/wiki.py`, `pipeline/images.py`):
    - descrizione ufficiale della pagina (og:description) quando l'estratto del feed è sotto i 120 caratteri; massimo 150 pagine per giro, con cache; nel primo giro ha arricchito circa 100 estratti;
    - In breve fino a 6 testate, senza quasi-doppioni, prima i più informativi;
    - Punti chiave: 3-5 frasi complete con nomi e numeri ripresi da più testate;
    - Per capire da Wikipedia (prime 2 frasi, solo se la voce è sicura: niente disambiguazioni, niente voci su concetti generici, titolo uguale al nome; massimo 80 richieste per giro, con cache).
  - **Pulizia:** tolti dagli estratti i link "correlati" dei feed, e dai titoli di Google News il nome della testata.
  - **Pagina Storia:** foto, titolo, "Raccontata da…", In breve, Punti chiave, Per capire, Confronto, Cronologia, Le fonti; ogni blocco compare solo se ha contenuto. Feed: testo fino a 4 righe (l'estratto più lungo).
  - **Su 10 storie vere con 3+ testate:** Punti chiave 8, Per capire 8, Confronto 10, Cronologia 10. Su tutte le 300: Punti chiave 28, Per capire 50, Confronto 39, Cronologia 35 (servono più testate sullo stesso fatto).
  - **Controllo a mano dei 48 abbinamenti Wikipedia del primo giro:** 4 sbagliati (Pentagono → geometria, Banca, Valle, Congresso), eliminati con le nuove regole; dopo, tutti corretti (alcuni poco utili, es. "Cina" per i conti di Pirelli).
  - Autotest: 37 controlli.
- [x] **D** · Qualità di categorie, traduzioni e ordine del Feed
  - **Categorie:** 60 storie a caso controllate a mano.
    - Sulle stesse 54 ancora presenti dopo la correzione: da 45/54 (83%) a 50/54 (93%).
    - Regola nuova in `topics.json` (`precedenza_politica`): se il titolo principale o metà dei titoli contiene governo, parlamento, elezioni, partito, democrazia, attivista, opposizione, ministro, presidente, sanzioni…, la categoria è Politica.
    - Aggiunte parole di sport, TV e reality, monarchia, governatore, turismo.
    - Errori rimasti: notizie finite nella sezione "business" di BBC o Guardian (Married at First Sight, il Re), turismo della chirurgia estetica.
  - **Traduzioni:** OPUS-MT "tc-big" inglese→italiano (conversione CTranslate2 di Hugging Face, versione fissa, Apache 2.0).
    - Su 30 titoli veri è nettamente migliore di Argos; resta Argos come riserva.
    - Al massimo 1.200 frasi nuove per giro: sul Mac il giro con 1.104 traduzioni nuove dura 81 secondi.
    - Nell'app, per le storie tradotte: "Tradotto dall'inglese · Titolo originale: …" (pagina Storia, Feed, Ultime notizie).
  - **Feed:** punteggio con testate (3 punti ciascuna, fino a 10), freschezza (fino a 10 punti in 36 ore) e interessi (+8); le storie già lette vanno in fondo.
- [x] **E** · Nuova identità visiva: anteprima delle 3 direzioni; **scelta di Filippo: 2 · Inchiostro blu**
  - Pagina `/anteprima-identita` (solo in sviluppo: `npm run dev`, poi http://localhost:3002/anteprima-identita) con 3 direzioni affiancate: 1 Edicola (carta, rosso #D7392B, titoli Fraunces), 2 Inchiostro blu (blu #2B3FD6, arancio #FF7A3D, Manrope 800 compatto), 3 Notte (scuro, giallo #E8FF5A, titoli Space Grotesk).
  - Colori degli 8 temi con icone lucide; tonalità calcolate per avere contrasto ≥ 4.5:1 (etichette piene sulle foto con testo bianco, chip tenui con testo colorato, versioni chiare per Notte). Rosso e arancio come testo su fondo chiaro scuriti (#C63528, #B9582C).
- [x] **F** · Applicare l'identità, i colori dei temi e l'onboarding — scelta "2 · Inchiostro blu"
  - Tutti i colori sono token in `app/globals.css` (nessun colore scritto a mano nei componenti; le illustrazioni segnaposto usano `--color-art-*` / `--color-thumb-*`). Fondo pieno senza alone verde; Feed scuro blu notte con accento arancio.
  - Temi con colore e icona (`app/lib/themes.tsx`): etichetta piena sulle foto (carosello, Feed, Storia), chip tenue in Libreria, riga sottile del colore nelle card di "Ultime notizie", fila dei temi con icone (il tema scelto si colora), interessi del Profilo e "temi più letti" con i loro colori.
  - Introduzione al primo avvio: 3 schermi a tutto schermo con "Salta", puntini, Indietro; almeno un tema per andare avanti; Italia / Mondo / Tutto; "Inizia a leggere". Salvata in `onboardingDone`, si rivede dal Profilo. Provata a 390px: tastiera (Tab ed Esc), nessun testo sotto 12px, nessun pulsante sotto 44px, nessun errore.
  - Pulizia: tolta la pagina di anteprima `/anteprima-identita` (non serve più) e il colore arancio-testo inutilizzato.
  - Raccolta (fase A): la catena si era fermata perché un vecchio giro annullato restava "in attesa"; ora il passo "prenota" ignora i giri in attesa da più di 90 minuti.
- [x] **G** · Pubblicazione online gratis — **https://fi2ippo.github.io/eddy**
  - Sito statico (`output: "export"`, percorso `EDDY_BASE_PATH`), pubblicato da `.github/workflows/pages.yml` a ogni push su `main`. Le notizie arrivano dal ramo `dati`: nessuna ricostruzione a ogni raccolta.
  - Provato online a 390px: `/storia/?id=…` funziona da link diretto e dopo una ricarica (anche `/storia?id=…` senza barra, rimandato da GitHub), indietro, navigazione, nessun errore.
  - Pagina **Chi siamo** dal Profilo (come funziona, 50 testate con estratti + 88 solo link da `sources.json`, foto, Wikipedia CC BY-SA, traduzioni segnalate, rimozioni, privacy). Il blocco "Grazie" è stato tolto su richiesta di Filippo.
  - Modulo GitHub "Richiesta di rimozione" + etichetta `rimozione`. **Da fare domani:** l'email per le rimozioni (`CONTACT_EMAIL` in `app/data/contact.ts`), per ora c'è solo il modulo.
  - `docs/licenze-da-controllare.md` (22 fonti) e README riscritto.
- [x] **H** · Controllo finale sul sito pubblicato (6/11, browser automatico a 390px su https://fi2ippo.github.io/eddy, cache disattivata)
  - Provati: introduzione (3 schermi), Oggi (carosello avanti e indietro con le frecce, fila dei temi su Economia), Feed (scorrimento), Storia con tutti i blocchi (In breve, Punti chiave, Per capire, Confronto, Cronologia, Le fonti), Salva → Libreria con una storia salvata, Profilo con i due pannelli, Chi siamo.
  - Risultati: nessun errore nella console, nessun testo sotto 12px, nessun pulsante sotto 44px (corretti i link delle testate nei blocchi della Storia, prima alti 24px), contrasto dei testi sempre sufficiente (≥ 4,5:1, ≥ 3:1 per i titoli grandi), larghezza 390px senza scorrimento orizzontale. "Aggiornato 3 min fa".
  - Corretto anche: nel Confronto il nome di una testata ("… - EFE") compariva come dettaglio "solo in alcune testate" (nuovo autotest).
  - Tolte da sito, codice e documenti tutte le citazioni del progetto di riferimento (decisione di Filippo).

### Correzioni del 6/11 (dopo la prova di Filippo sul sito)
- **Home piena di design di una sola testata:** It's Nice That mette nel feed date nel futuro (9/11) e la raccolta le trasformava in "adesso" a ogni giro, così i suoi 20 articoli erano sempre i più recenti. Ora una data nel futuro vale come la prima volta che Eddy ha visto l'articolo (fissa). In più ogni testata ha al massimo 6 storie "raccontate solo da lei" fra le 300.
- **Interessi che non servivano:** nuova miscela (`mix` in `app/lib/stories.ts`) per Prima pagina, Ultime notizie e Feed: circa 7 storie su 10 dei temi scelti, le altre di temi diversi; stessa testata mai entro 4 storie, stesso tema al massimo 2 volte di fila (3 per i temi scelti) e, se non scelto, al massimo 4 volte ogni 10 storie. Prima pagina: al massimo 3 storie per tema non scelto, le migliori dei temi scelti anche se raccontate da meno testate, storie già lette in fondo.
- **"Aggiornato 9 ore fa" sul telefono** (i dati su GitHub erano freschi): ogni scaricamento si interrompe dopo 15 secondi, uno rimasto appeso non blocca più i successivi, e i dati si ricontrollano anche quando la pagina torna dalla memoria del telefono, quando la finestra torna attiva o quando torna la connessione.

- **Feed nuovo, come le storie di Instagram** (richiesta di Filippo del 6/11): barrette di avanzamento e X in alto, tolti filtro Italia/Mondo, scritta Eddy e contatore; scorrimento verso sinistra per la storia successiva, verso l'alto per aprirla (la storia segue il dito); in fondo freccia "Scorri su per leggere" fra i pulsanti tondi Salva e Da leggere; alone del colore del tema sullo sfondo. Provato a 390px con tocco simulato: sinistra, freccia, Salva, su (apre la storia giusta), ritorno allo stesso punto, nessun errore.

### Idee future
- **Email per le rimozioni** in `app/data/contact.ts` (Filippo la sceglie il 6/11).
- **Licenze:** leggere le condizioni delle 22 fonti in `docs/licenze-da-controllare.md` e scrivere alle testate principali prima di far conoscere Eddy.
- ~~Titoli di Google News non tradotti~~ — fatto il 6/11: le testate segnate con un'altra lingua che scrivono in inglese (EFE, Deutsche Welle…) si riconoscono e si traducono; in "Le fonti" i titoli sono in italiano con "Tradotto automaticamente. Originale: …"; tolto anche il " - EFE" ripetuto in fondo.
- **App installabile (PWA)**: icona sulla schermata Home e lettura delle storie salvate anche senza rete.
- **Ricerca** tra le storie dei tre giorni.
- ~~Icona di Eddy~~ — fatta il 6/11: "E" bianca su quadrato blu Inchiostro con punto arancio (`app/icon.svg`, `app/apple-icon.png`).
- **Notifica "nuove storie"** quando l'app resta aperta e arrivano dati nuovi.
- **Dominio proprio** (es. eddy.it) puntato su GitHub Pages, se il progetto cresce.
- **Tema scuro** per tutta l'app (non prioritario, decisione di Filippo del 6/11).

---

## 1. In breve

| Passo (PROMPTS.md) | Stato |
|---|---|
| 1. Capire e rinominare ALT → Eddy | ✅ fatto |
| 2. Design nuovo, una schermata alla volta | ✅ fatto: Oggi, Feed, Storia, Libreria, Profilo |
| 3. Pagina Storia | ✅ fatta: pagina unica `/storia?id=…` con i dati veri |
| 4. Feed delle fonti + shortlist | ✅ fatto |
| 5. Raccolta automatica | ✅ fatta: 138 fonti, raccolta ogni ora su GitHub Actions, dati sul ramo `dati` |
| 6. Dati veri nell'app | ✅ fatto: l'app legge le storie dal ramo `dati` nel browser |
| 7. Pubblicare gratis (GitHub Pages + pagina "Chi siamo / Fonti") | ⬜ da fare |
| 8. Rifiniture (PWA, ricerca, sezioni personali, tema scuro…) | ⬜ da fare |

---

## 2. Cosa c'è oggi

### App (Next.js 16, React 19, TypeScript, Tailwind 4, lucide-react; porta 3002)

**Dati veri** (`app/lib/stories.ts`)
- **Da dove:** le storie si scaricano nel browser da `https://raw.githubusercontent.com/Fi2ippo/eddy/dati/stories.json`, una volta per visita. L'indirizzo si può cambiare con `NEXT_PUBLIC_EDDY_STORIES_URL`. Il sito non va ricostruito a ogni aggiornamento.
- **Controllo:** ogni storia viene verificata prima dell'uso. Si accettano solo link `http(s)` e argomenti fra gli 8 interessi.
- **Casi gestiti:** caricamento, dati non raggiungibili (con "Riprova"), nessuna storia per il filtro, foto mancante o che non si carica (illustrazione segnaposto).
- **Dati di prova:** non esistono più (`app/data/demo-stories.ts` è stato tolto).

**Schermate**
- **Oggi** (`HomeView`), dall'alto in basso:
  - **Intestazione:** data piccola ("Giovedì 5 novembre"), saluto in base all'ora ("Buongiorno", "Buon pomeriggio", "Buonasera"), due chip identiche, solo testo: "Aggiornato 5 min fa" e "300 storie · 67 testate". Le testate sono quelle presenti nelle storie.
  - **"Prima pagina":** carosello orizzontale di 9 card grandi (foto, categoria, pillola testate, prime 2 testate, titolo, "Aggiornata 20 min fa"). Si scorre a scatti con dito, rotella e frecce della tastiera; sotto ci sono i puntini; con il mouse compaiono le frecce.
    - Solo storie delle ultime 24 ore, ordinate per punteggio = 3 punti per testata (fino a 15) + fino a 10 punti di freschezza (scendono a 0 in 24 ore) + 1,5 se c'è la foto. Pesi in `app/lib/stories.ts` (`W_OUTLET`, `MAX_OUTLETS`, `W_FRESH`, `W_PHOTO`).
    - Nessun filtro per interessi (gli interessi decidono solo l'ordine del Feed); il filtro Italia / Mondo / Tutto invece vale.
    - Una sola card per evento: la raccolta dà lo stesso `event` alle storie sullo stesso fatto (es. 8 storie sugli allarmi bomba), e la prima pagina ne mostra solo la più importante.
  - **Fila di temi** (subito dopo il carosello, con lo stesso stacco di 28px degli altri blocchi): Tutti + gli 8 interessi. Con un tema si vedono le storie che hanno quel tema come categoria principale (i temi secondari sono meno affidabili), ordinate per rilevanza.
  - **"Ultime notizie":** tutte le altre storie, dalla più recente, 20 alla volta con "Mostra altre". Ogni riga ha testate, orario, titolo, estratto breve, categoria, pillola testate e Salva.
- **Pillola "N testate"** (`OutletsTag`) su Oggi, Feed, Libreria e Storia: conta le testate diverse, comprese quelle arrivate da Google News.
- **Orario relativo** (`TimeAgo`): "ora", "5 min fa", "2 h fa", "ieri 18:30", "4 nov". Usa l'articolo più recente della storia e si aggiorna da solo ogni minuto.
- **Feed** (`FeedView`):
  - scuro e a tutto schermo, senza barra di navigazione;
  - in alto il contatore "01 / 30", "Eddy" e la X che torna a Oggi, con sotto un piccolo filtro Tutto / Italia / Mondo;
  - una storia per schermata, a scatti, con dito, rotella e tastiera (frecce, Pagina su/giù, Inizio/Fine);
  - ordine: prima le storie dei tuoi interessi, poi le altre, dalla più recente; 30 storie;
  - per ogni storia: foto (o segnaposto) con credito, categoria, titolo, testo di massimo 3 righe, "Leggi la storia", Salva e Da leggere con etichetta e stato.
- **Storia** (`/storia?id=…`, `StoryDetail`):
  - aprirla la registra nei Recenti;
  - "In breve" mostra gli estratti con il nome della testata e "tradotto automaticamente" quando serve; se il titolo è tradotto, compare anche quello originale;
  - sotto il titolo: "Raccontata da Il Post, ANSA e altre 11 testate", la pillola delle testate e l'orario;
  - fonti con "Leggi su <testata>" e l'orario di ogni articolo (`sources[].published`, aggiunto alla raccolta); quelle arrivate da Google News sono sotto "Ne parlano anche";
  - se la storia non c'è più, mostra la scheda salvata e un messaggio.
- **Libreria** (`LibraryView`):
  - titolo centrato con sottotitolo;
  - schede Salvati / Recenti / Da leggere con i contatori;
  - card bianca con l'elenco: miniatura, categoria, titolo, testata, data e credito della foto;
  - stati vuoti con icona e "Vai al Feed".
- **Profilo** (`ProfileView`):
  - card "La tua curiosità" con i numeri veri: storie lette, argomenti esplorati, temi più letti;
  - righe che aprono pannelli dal basso:
    - "I tuoi interessi": 8 pulsanti;
    - "Impostazioni": dimensione del testo con anteprima, notizie Tutto / Italia / Mondo, privacy in parole semplici, "Cancella i dati di Eddy" con conferma;
  - i pannelli si chiudono con Esc, toccando fuori o con la X.

**Dati personali** (localStorage, chiave `eddy:personal:v1`)
- Campi nuovi: `area` (`tutto` | `italia` | `mondo`) e, per ogni storia salvata o letta, una piccola scheda (titolo, categoria, foto, credito, testata, data). Serve perché le storie escono dai dati dopo 72 ore, ma la Libreria e il Profilo devono poterle ancora mostrare.
- Gli archivi vecchi si leggono ancora: i campi mancanti prendono il valore predefinito.

**Controlli della nuova home** (5/11/2026)
- `tsc`, `lint` e `build` passano.
- **Browser automatico a 390px:**
  - verificati: carosello avanti e indietro con le frecce e con lo scorrimento, puntini, "Mostra altre" (da 20 a 40), tema Economia (73 storie per rilevanza, la prima pagina resta), filtro Italia anche nella home, Salva da una riga, orari, "Raccontata da…", pillola delle testate in Libreria;
  - nessun testo sotto 12px, nessun pulsante sotto 44px, nessun errore.
- **Pesi regolati:** con il tetto a 10 testate Joshua Wong (20 testate) finiva terzo dietro storie con 13 testate; con il tetto a 15 è primo.

**Controlli fatti in precedenza** (5/11/2026)
- `tsc`, `lint` e `build` passano.
- **Browser automatico a 390px:**
  - verificati: contatore, frecce, rotella, filtro, Salva / Da leggere, Recenti dopo l'apertura, contatori della Libreria, numeri del Profilo, pannelli (Esc e tocco fuori);
  - nessun testo sotto 12px, nessun pulsante sotto 44px, nessuna pagina più larga dello schermo, nessun errore in console;
  - screenshot di Feed, Libreria piena e vuota, Profilo con i pannelli aperti, confrontati con `design/`.
- **Differenze dal design corrette:**
  - "Leggi la storia" ora sta su una riga: i pulsanti accanto sono larghi 72px invece di 78;
  - i numeri del Profilo sono allineati in alto.
- **Differenza voluta:** nel Feed c'è il filtro Italia / Mondo sotto l'intestazione, quindi la foto parte un po' più in basso che nel design.

### Fonti (`data/sources.json`, 362 fonti)

- **Campi nuovi per ogni fonte:**
  - `language`;
  - `area` (`italia` | `mondo`). La regione del catalogo resta in `region`;
  - `topics`: argomento di default, solo per le testate di settore. Le generaliste non ne hanno; gli argomenti del catalogo restano in `catalog_topics`.
- **138 abilitate**:
  - **50 via feed:**
    - le 40 della shortlist;
    - Repubblica e Corriere (feed per sezione);
    - 3 fonti di economia dal catalogo: Bloomberg (feed economics + markets), Fortune, MIT Sloan Management Review;
    - 5 fonti di economia fuori dal catalogo (`aggiunta_fuori_catalogo: true`): lavoce.info, Wall Street Italia, Project Syndicate, CEPR VoxEU, CNBC.
  - **Feed per sezione** (`"feeds": [{url, topic, area, section}]`; `feed_url` resta per compatibilità):
    - ANSA, Il Post, Il Sole 24 Ore, Repubblica, Corriere, BBC, Guardian;
    - le sezioni esteri danno `area: mondo`;
    - La Stampa non ha feed per sezione: tutti gli indirizzi rimandano al feed principale.
  - **88 via Google News** (`"via": "google_news"`, `license_status: "solo_link"`):
    - sono le testate della selezione iniziale che bloccano i programmi o non hanno feed;
    - restano escluse le riviste accademiche;
    - danno solo "Leggi su <testata>" a storie già esistenti.
- **Licenze**:
  - 28 `link_e_citazione`;
  - 88 `solo_link` (Google News);
  - 22 `da_controllare`:
    - le 12 della shortlist senza termini d'uso trovati: la-stampa, il-sole-24-ore, linkiesta, facta, agenda-digitale, le-scienze, scienza-in-rete, altreconomia, economyup, rivista-studio, abitare, smashing-magazine;
    - le 10 aggiunte in questo passo: la-repubblica, corriere-della-sera, bloomberg, fortune, mit-sloan-management-review, lavoce-info, wall-street-italia, project-syndicate, cepr-voxeu, cnbc.
- **Correzioni:**
  - feed di Quanta → `https://www.quantamagazine.org/feed/`;
  - feed principale di Il Post → `https://www.ilpost.it/feed` (con la barra finale risponde 403).
- **`scripts/discover_feeds.py`:** ora segue i redirect 308 anche con Python 3.9. Rilanciato sulle 10 fonti fallite per motivi tecnici: 3 ora hanno il feed (Sydney Morning Herald, Semafor, Figma Blog).

### Raccolta (`pipeline/`)

| File | Cosa fa |
|---|---|
| `collect.py` | programma principale (opzioni `--out`, `--no-translate`, `--no-og`, `--no-gn`, `--debug`) |
| `feeds.py` | lettura dei feed (un sito alla volta, siti diversi in parallelo) e di Google News (ogni testata al massimo ogni 3 ore, risultati nello stato) |
| `clean.py` | pulizia: HTML, "Continua a leggere", "The post … appeared first on", righe d'agenzia, firme, crediti foto; estratto di massimo 3 frasi / 420 caratteri |
| `filters.py` | scarto delle non-notizie (oroscopo, video, podcast, dirette, gallery, sponsorizzati, offerte, necrologi, meteo…), lista facile da ampliare |
| `textproc.py` | parole importanti, parole generiche italiane e inglesi, radici, nomi propri |
| `translate.py` | traduzione offline inglese→italiano (modello Argos Translate con ctranslate2 + sentencepiece), con cache delle traduzioni |
| `cluster.py` | raggruppamento (vedi sotto) |
| `topics.py` + `topics.json` | gli 8 argomenti e l'area italia/mondo |
| `images.py` | foto dal feed; se manca, og:image dell'articolo principale (massimo 60 pagine per giro, con cache); sempre hotlink, credito "Foto: <testata>" |
| `stories.py` | storie, importanza, id stabili |
| `selftest.py` | 28 controlli senza rete (girano anche su Actions prima di ogni raccolta) |
| `requirements.txt` | feedparser, numpy, scikit-learn, ctranslate2, sentencepiece |

**Raggruppamento**
- TF-IDF (scikit-learn) sulle radici di titolo (peso doppio), estratto e nomi propri (peso maggiore). I titoli stranieri si confrontano dopo la traduzione.
- Somiglianza coseno; i gruppi si formano ad "average linkage" con soglia `TAU = 0.30`.
- Vincoli:
  - almeno 2 parole importanti in comune (i nomi propri non contano due volte);
  - mai la stessa testata due volte, salvo sezioni diverse;
  - al massimo 20 articoli per storia;
  - somiglianza ridotta se gli articoli sono lontani più di 36 ore.
- Google News si aggancia a una storia con soglia 0.45 e almeno 3 parole in comune.

**Argomenti**
- Ordine di priorità: sezione del feed, poi testata di settore, poi lessico.
- Il lessico si confronta su una radice leggera: "politica" e "politics" coincidono, "international" e "internet" no.
- Basta 1 parola nel titolo; ne servono 2 se compaiono solo nell'estratto.
- Senza nessuna parola trovata, la storia va in "societa".

**Importanza:** dipende dal numero di testate diverse (Google News conta mezza), dalla recenza e dalla foto. Finestra di 72 ore, massimo 300 storie.

**Id stabili:** lo stato ricorda a quale storia apparteneva ogni articolo, e una storia che si arricchisce mantiene il suo id.

**Stato** (`state.json`):
- prima volta che un articolo è stato visto (serve per i feed senza date, come Le Scienze);
- traduzioni (dimenticate dopo 10 giorni senza uso);
- og:image (cache);
- Google News (cache);
- prima volta che una storia è stata vista.

**Scrittura dei file:**
- `stories.json` si riscrive solo se le storie cambiano (il campo `generated` non conta nel confronto);
- `report.json` riassume ogni giro.

**Altro:** `data/blocklist.json` è stato creato (lista vuota): vi si mettono domini o URL da non mostrare mai.

### Ritocchi alla home (5/11)
- Tolti il pallino verde della chip "Aggiornato…", ora uguale all'altra chip, e il pulsante "Sfoglia · una notizia per schermata": il Feed si apre dalla barra in basso.
- Eliminati anche il codice e gli stili rimasti senza uso: lo stile `.browse-button` e la partenza del Feed "dalla prima pagina" (`/feed?da=prima-pagina`).
- Controlli: `tsc`, `lint`, `build` e screenshot a 390px. Lo stacco fra i puntini del carosello e i temi è di 28px, come quello fra intestazione e prima pagina.

### Correzioni del 5/11 sera
- **Eventi** (`pipeline/stories.py`, `assign_events`):
  - storie diverse sullo stesso fatto ricevono lo stesso campo `event`;
  - regola: somiglianza TF-IDF almeno 0,17 con una storia dell'evento e almeno 0,10 in media con tutte; massimo 8 storie per evento; si uniscono prima le coppie più simili, così l'ordine non conta;
  - risultato sui dati del 5/11: 34 eventi con più storie (allarmi bomba 8, elezioni USA 8, tassi della Banca d'Inghilterra 6, data center 5, Russell Brand 4…), senza più catene che uniscono temi diversi.
- **Categorie:**
  - votano tutti gli articoli della storia, anche i titoli di Google News, quindi una sola sezione "business" non decide da sola (allarmi bomba: da Economia a Società);
  - via dal lessico le parole che si confondevano con altre: "cellule" (con "cellulari"), "salute" (con "saluta"), "mostra" (con "il video mostra"), "partito" (con "partite"), "clima" (con "clima politico"), "azioni"; al loro posto espressioni intere;
  - aggiunte parole di politica ("democrazia", "sicurezza nazionale"…): Joshua Wong passa da Società a Politica.
- **Giri automatici:**
  - ogni giro, finita la raccolta, prenota il successivo (lavoro "prenota");
  - aspetta 55 minuti nell'ambiente "attesa" di GitHub, che ha il timer e durante l'attesa non usa macchine, poi avvia il giro dopo; se c'è già un giro in arrivo non ne prenota un secondo;
  - il cron orario resta come riserva per far ripartire la catena.
- **Autotest:** passa da 28 a 34 controlli (eventi, trappole del lessico, voto delle categorie).

### Formato di `stories.json`
`generated`, `count` e `stories[]`. Ogni storia ha:
- `id`, `title`, `title_original` (se tradotto), `translated`;
- `category` (= `topics[0]`), `topics[]` (solo gli 8 interessi), `area`;
- `image`, `image_credit`;
- `first_seen`, `updated`, `n_sources`, `event` (uguale per le storie sullo stesso evento);
- `summary[{source, text, translated}]` (massimo 3 estratti, da testate diverse);
- `sources[{name, title, url, via, published}]`.

### Automazione (`.github/workflows/collect.yml`)
- **Quando:** ogni ora al minuto 17, più l'avvio manuale (Actions → Raccogli notizie → Run workflow).
- **Prima della raccolta:** controlli del codice e autotest.
- **Cache:** quella di pip e quella del modello di traduzione (`actions/cache`).
- **Dove vanno i dati:** `stories.json`, `state.json` e `report.json` vanno sul ramo `dati`, con un solo commit sostituito a ogni giro, così il repository non cresce. Un JSON rovinato non viene salvato.
- **Resoconto:** ogni giro scrive i numeri principali nel riepilogo della pagina Actions.

### Prova su GitHub Actions (5/11/2026)

**Primo giro, avviato a mano:**
- tutti i passi verdi;
- 77 secondi, compreso il download del modello di traduzione;
- 300 storie: 89 con 2 o più testate, 280 con foto, 113 tradotte;
- ramo `dati` creato con un solo commit.

**Secondo giro:**
- modello e librerie arrivati dalla cache, 26 secondi;
- il commit del ramo `dati` è stato sostituito, non aggiunto;
- id delle storie stabili:
  - dei 381 articoli presenti in entrambi i giri, solo 2 sono passati a una storia con id diverso;
  - 16 storie si sono arricchite di nuove fonti mantenendo l'id.

**Come controllare che i dati siano salvati:**
1. **Actions:** su https://github.com/Fi2ippo/eddy/actions → "Raccogli notizie", l'ultimo giro deve essere verde. Aprendolo, il riepilogo mostra i numeri principali.
2. **Ramo dati:** su https://github.com/Fi2ippo/eddy/tree/dati, `report.json` dice data e numeri dell'ultimo giro. Il commit si chiama "dati: <data e ora>".
3. **Dal terminale:** `gh run list --workflow "Raccogli notizie" --limit 3`

### Risultati del giro sul Mac (5/11/2026, ultime 72 ore)

**Ingresso**
- 93 feed letti senza errori.
- 1078 articoli e 1469 titoli da Google News.
- 18 secondi (il primo giro, con il download del modello e senza cache, ha richiesto 68 secondi).

**Le 300 storie**
- **Testate per storia:**

  | Testate | Storie |
  |---|---|
  | 1 | 209 |
  | 2 | 57 |
  | 3 | 17 |
  | 4 | 6 |
  | 5 | 7 |
  | 6 o più | 4 |

  Quindi 91 storie hanno 2 o più testate. Nella prima prova, prima del passo 5, erano solo 7.
- **Foto:** 294 storie su 300.
- **Tradotte:** 114 storie hanno il titolo tradotto.
- **Google News:** 38 storie hanno almeno un "Leggi su" che viene da Google News.
- **Categoria:**

  | Categoria | Storie |
  |---|---|
  | economia | 81 |
  | politica | 52 |
  | società | 48 |
  | cultura | 44 |
  | tecnologia | 35 |
  | scienza | 27 |
  | ambiente | 10 |
  | design | 3 |

- **Area:** 136 italia, 164 mondo.

**Controllo a mano delle 91 storie con più testate:** circa 85 giuste e 6 sbagliate.
- **Sbagliate:** di solito due notizie diverse con parole in comune, oppure lo stesso tema ma un fatto diverso. Per esempio "I film della settimana" insieme a un articolo su Martin McDonagh, oppure i conti di Azimut insieme a quelli di Brembo.
- **Raggruppamenti che il codice evita apposta:**
  - un evento che dura giorni (gli allarmi bomba sui voli) resta diviso in più storie, una per sviluppo;
  - più articoli della stessa sezione della stessa testata non finiscono mai nella stessa storia.

---

## 3. Cosa manca, in ordine

### A. Passo 7: pubblicazione
- `output: 'export'`, GitHub Pages, pagina "Chi siamo / Fonti e crediti" con le istruzioni per chiedere la rimozione di un contenuto.

### B. Da tenere d'occhio
- **Qualità della traduzione:** il modello Argos inglese→italiano è veloce e leggero ma a volte goffo ("Vance cammina tromba stretta…"). Ogni storia tradotta conserva `title_original`. Se servirà più qualità c'è un'alternativa: OPUS-MT "tc-big", che però richiede di convertire il modello una volta con torch.
- **Argomenti poco presenti:** ambiente e design hanno poche storie, perché le fonti di settore pubblicano meno. Si possono aggiungere fonti o parole al lessico.
- **Google News:** circa 30 richieste all'ora. Se Google dovesse limitarle, si alza `GN_REFRESH_HOURS` in `pipeline/feeds.py`.
- **Workflow fermo:** GitHub sospende i workflow programmati dopo 60 giorni senza attività sul repository. Se succede, basta riattivarlo da Actions.
- **Feed:** l'ordine "interessi, poi recenza" porta in alto anche storie con una sola testata. Si potrebbe usare il punteggio della prima pagina.

- **Categorie da migliorare:** alcune sono discutibili, per esempio Joshua Wong finisce in "Società".
- **Uso senza rete:** se GitHub non risponde, Oggi e il Feed mostrano "Riprova". Libreria e Profilo funzionano comunque, grazie alle schede salvate.
- `README.md` descrive ancora la versione vecchia dell'interfaccia.

---

## 4. Decisioni aperte (servono da Filippo)
1. Controllare a mano le **22 fonti `da_controllare`** (elenco qui sopra) e decidere per ognuna: `link_e_citazione`, `da_contattare`, oppure disabilitarla.
2. Quando passare al passo 7 (pubblicazione su GitHub Pages).
