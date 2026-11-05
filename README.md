# Eddy

Piattaforma indipendente dai social network per informarsi attraverso notizie aggregate da più fonti.

Stato attuale: **STEP 07 + STEP 08** — Profilo, interessi editoriali e Libreria persistente nel browser.

## Stack

Next.js 16 con App Router, React, TypeScript, Tailwind CSS 4 ed ESLint. Icone: Lucide React. Package manager: npm.

Sviluppo e build usano Webpack, supportato da Next.js, per evitare il vincolo dell'ambiente sulle porte interne di compilazione di Turbopack. TypeScript è fissato alla serie 5 per compatibilità con il parser ESLint. ESLint 9 è richiesto dai plugin attuali; npm ne segnala la fine del supporto.

## Requisiti

- Node.js >= 20.9.0; consigliato Node.js 24 LTS.
- npm >= 10.
- Porta 3002 libera.

Ambiente verificato: macOS, Node.js 24.14.0 e npm 11.9.0.

## Installazione e avvio

Dalla cartella del progetto, installare le dipendenze del lockfile:

```sh
npm ci
```

Avviare il server di sviluppo:

```sh
npm run dev
```

Aprire [http://localhost:3002](http://localhost:3002).

Per arrestare il server: `Ctrl+C`. Se la porta 3002 è occupata, il comando fallisce senza selezionare automaticamente altre porte. Le porte 3000 e 3001 non vengono utilizzate.

## Controlli tecnici

```sh
npm run lint
npm run typecheck
npm run build
```

Il controllo TypeScript genera prima i tipi delle route Next.js, quindi funziona anche dopo una nuova installazione.

Per eseguire localmente la build di produzione, dopo `npm run build`:

```sh
npm start
```

Anche il server di produzione usa la porta 3002. Non eseguirlo contemporaneamente al server di sviluppo.

Non sono necessarie variabili d'ambiente. Questo step non include funzionalità applicative, servizi esterni o configurazioni di deploy.

## Design system

I token sono centralizzati in `app/globals.css` tramite `@theme static` di Tailwind CSS 4: restano disponibili come variabili CSS anche quando non sono ancora usati dalla pagina. È implementato soltanto il tema chiaro.

### Colori

| Token CSS | Valore | Utility di esempio |
| --- | --- | --- |
| `--color-background` | `#FAFAF8` | `bg-background` |
| `--color-surface` | `#FFFFFF` | `bg-surface` |
| `--color-foreground` | `#17191C` | `text-foreground` |
| `--color-muted` | `#687078` | `text-muted` |
| `--color-border` | `#E7E8E5` | `border-border` |
| `--color-accent` | `#345B49` | `text-accent` |
| `--color-accent-soft` | `#E8EEE9` | `bg-accent-soft` |
| `--color-accent-soft-foreground` | riferimento a `foreground` | `text-accent-soft-foreground` |

Il testo sopra `accent-soft` ha un token semantico separato, senza introdurre altri colori. `border` è destinato ai separatori decorativi, non agli indicatori di focus o al testo.

### Tipografia

Stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Nessun font esterno.

| Utility | Dimensione rem (px con base 16) | Peso | Interlinea |
| --- | --- | --- | --- |
| `text-display` | 2.5 (40) | 700 | 1.2 |
| `text-heading-1` | 2 (32) | 700 | 1.25 |
| `text-heading-2` | 1.5 (24) | 600 | 1.3 |
| `text-heading-3` | 1.25 (20) | 600 | 1.4 |
| `text-body` | 1 (16) | 400 | 1.6 |
| `text-secondary` | 0.875 (14) | 400 | 1.5 |
| `text-caption` | 0.75 (12) | 500 | 1.4 |

Le utility includono dimensione, peso e interlinea; `h1`, `h2` e `h3` ricevono la gerarchia di base. Non si forza la dimensione radice né si limita lo zoom.

### Spaziature e geometria

- Token `--spacing-1`, `-2`, `-3`, `-4`, `-6`, `-8`, `-12`: 4, 8, 12, 16, 24, 32, 48 px espressi in rem. Esempi: `gap-4`, `p-6`.
- Raggi `--radius-sm`, `-md`, `-lg`, `-full`: 8, 12, 20, 9999 px. Esempi: `rounded-sm`, `rounded-lg`.
- `--container-reading`: 45rem (720 px alla dimensione predefinita), disponibile anche con `max-w-reading`.
- `reading-container`: contenitore centrato, largo al massimo 720 px compresi i margini interni. Margini interni laterali di 20 px, riducibili fino a 16 px su schermi stretti, con rispetto delle safe area.
- `page-shell`: altezza minima del viewport con unità `svh` e spaziatura verticale che rispetta le safe area. L'altezza resta libera di crescere con il testo.

### Accessibilità

Focus visibile con contorno accent, senza rimozione degli indicatori nativi; nei colori forzati si usa il colore di sistema `Highlight`. Le preferenze `prefers-reduced-motion` riducono eventuali transizioni e animazioni future e disabilitano lo scorrimento fluido. Non sono introdotte animazioni o interazioni dimostrative.

La pagina mantiene HTML semantico, testo ridimensionabile e a capo, senza nascondere l'overflow orizzontale.

### Verifiche STEP 02

- ESLint, controllo TypeScript e build di produzione completati con successo.
- Server esistente su `http://localhost:3002`: HTTP 200, nessun secondo server avviato.
- Chrome headless, con gli strumenti già disponibili sul computer: nessun overflow orizzontale a 320, 390 e 1440 px; colori, pesi, dimensioni e centratura verificati sugli stili calcolati.
- Testo ingrandito al 200% a 320 px senza overflow; focus da tastiera visibile e preferenza reduced-motion verificati. La preferenza scura del browser mantiene il tema chiaro.
- Contrasti calcolati: `foreground/background` 16,85:1, `muted/background` 4,81:1, `accent-soft-foreground/accent-soft` 14,96:1. Tutti superiori a 4,5:1.
- Nessuna nuova dipendenza o funzionalità applicativa. Configurazione del server e layout root preservati.

Le safe area sono predisposte nel CSS; non sono state provate su un dispositivo fisico con notch.

## Navigazione principale — STEP 03

| Sezione | Percorso | Icona Lucide |
| --- | --- | --- |
| Oggi | `/` | `Newspaper` |
| Feed | `/feed` | `GalleryVerticalEnd` |
| Libreria | `/libreria` | `Library` |
| Profilo | `/profilo` | `UserRound` |

Oggi ospita la selezione editoriale, Feed la lettura verticale, Libreria le tre raccolte personali e Profilo interessi, attività e gestione dei dati locali. Il componente client `app/components/BottomNavigation.tsx` è montato una sola volta nel layout root; layout e pagine restano Server Components. I link Next.js cambiano realmente URL; `usePathname()` determina lo stato attivo e l'unico `aria-current="page"`. Le icone sono decorative per gli screen reader, con etichette sempre visibili.

La barra è fissa in basso anche su desktop, senza ombre o animazioni, con i token `surface`, `border`, `accent` e `muted` dello STEP 02. I link hanno altezza minima di 2,75rem (44 px alla dimensione predefinita) e il focus globale da tastiera. Le etichette possono andare a capo con testo ingrandito. Il layout abilita `viewport-fit=cover` per consentire l'uso delle safe area mobili, senza limitare lo zoom.

Un `ResizeObserver` misura l'altezza reale della barra e aggiorna `--bottom-navigation-height`: il layout riserva lo stesso spazio al contenuto, anche quando aumentano testo o safe area. Il CSS prevede una riserva iniziale prima dell'idratazione. Le nuove regole di layout non alterano palette, scala tipografica o spaziature esistenti.

Unica dipendenza aggiunta nello STEP 03: `lucide-react`. Nessun feed, autenticazione, backend o altra funzionalità delle sezioni è implementato. La porta resta 3002; se il server è già attivo, riutilizzarlo.

### Verifiche STEP 03

- ESLint, TypeScript e build di produzione completati con successo; tutte le quattro route sono prerenderizzate.
- Chrome headless sul server già attivo alla porta 3002: HTTP 200 e contenuti corretti per tutte le route.
- Tutte le quattro pagine verificate a 320, 390 e 1440 px, con testo al 100% e al 200%: nessun overflow orizzontale, area di tocco di almeno 44 × 44 px, contenuto visibile sopra la barra e spazio riservato coerente con l'altezza misurata.
- Link reali, percorso di destinazione, stato attivo, colori, peso, icone decorative e un solo `aria-current="page"` verificati nel browser.
- Navbar unica e persistente durante i cambi di pagina; ordine di tabulazione, focus visibile e attivazione con Invio verificati.
- Nessun errore JavaScript rilevato durante i test. Nessuna animazione, anche con reduced-motion.

Le verifiche usano strumenti browser preesistenti, senza aggiungere dipendenze di test. Le safe area restano da verificare su un dispositivo fisico con Home Indicator; l'ingrandimento testato riguarda la dimensione del testo al 200%.

## Homepage editoriale — STEP 04

La pagina `/` presenta Oggi come titolo principale, il marchio Eddy e un'introduzione breve. Seguono esattamente tre contenuti statici, indicati come «Contenuti dimostrativi»: una lettura principale e due secondarie, in colonna su mobile e affiancate da 640 px quando lo spazio lo consente. La composizione usa soltanto i token già definiti, senza immagini, card colorate o interazioni fittizie.

- `app/data/demo-stories.ts`: dataset locale e tipo `EditorialStory` con identificatore, categoria, titolo e descrizione. I tre esempi sono temi esplorativi, senza eventi, fonti, date, autori o statistiche inventati.
- `app/components/StoryPreview.tsx`: anteprima editoriale semantica con titolo `h2`, categoria e descrizione; la variante principale ha maggiore peso tipografico. È un Server Component, senza link o pulsanti.
- `app/page.tsx`: intestazione e composizione delle tre anteprime, dentro il contenitore di lettura esistente.

Navbar, layout condiviso, altre route, design system, dipendenze e porta 3002 restano invariati. La pagina non usa API o servizi esterni.

### Verifiche STEP 04

- TypeScript, ESLint e build di produzione completati con successo.
- Chrome headless sul server esistente alla porta 3002: homepage HTTP 200, esattamente tre anteprime, un solo `h1` e tre titoli `h2`, indicazione dimostrativa visibile e nessuna interazione fittizia.
- Layout verificato a 320, 390, 768 e 1440 px con testo al 100% e al 200%: nessun overflow orizzontale, secondarie in colonna su mobile, gerarchia tipografica preservata e ultimo contenuto sopra la navbar a fine scorrimento.
- Contrasto di tutti i testi della homepage rispetto allo sfondo superiore a 4,5:1; screenshot mobile e desktop ispezionati.
- HTTP 200 su tutte le altre route, link e stato attivo corretti, navbar persistente e unica, focus e attivazione da tastiera verificati. Nessun errore JavaScript o richiesta a servizi esterni durante i controlli.
- Hash dei file preesistenti confrontati: navbar, layout, CSS globale, altre route, configurazione e dipendenze invariati.

I controlli responsive usano Chrome desktop con viewport simulati e ridimensionamento del testo; non sostituiscono una prova su iPhone fisico.

## Feed editoriale verticale — STEP 05

La route `/feed` presenta le stesse tre storie dimostrative di Oggi, una alla volta, con categoria, titolo, introduzione e un breve approfondimento concettuale. L'indicazione dimostrativa resta visibile nell'intestazione. Il dataset condiviso aggiunge soltanto il campo opzionale `insight`; i testi mostrati in Oggi restano identici.

- `app/components/FeedStory.tsx`: Server Component per una storia e l'indicazione di avanzamento; l'ultima termina con «Fine della selezione».
- `app/components/VerticalFeed.tsx`: piccolo contenitore client per il contatore `01 / 03`, l'area di lettura focalizzabile e gli observer nativi. I contenuti arrivano dalla pagina server attraverso `children`.
- `app/feed/page.tsx`: legge il dataset locale e compone esattamente tre storie; nessun caricamento esterno o generazione di contenuti.
- `app/globals.css`: regole isolate al Feed, senza modificare i token o la navbar.

Un'unica area di lettura scorre verticalmente tra l'intestazione e la navbar. Le storie hanno un'altezza minima pari a quella disponibile e possono crescere liberamente: niente clipping o scorrimenti interni ai singoli articoli. L'altezza del Feed usa `dvh`, con fallback `svh`, sottraendo l'altezza della navbar già misurata dal layout.

Lo snap nativo è `y proximity`, senza intercettare wheel o touch. Un `ResizeObserver` disattiva lo snap se anche una sola storia supera l'altezza disponibile, così testo ingrandito e contenuti lunghi restano leggibili. Con `prefers-reduced-motion: reduce` lo snap è disattivato e non viene introdotto scorrimento animato.

Un `IntersectionObserver` osserva una sottile fascia centrale dell'area di lettura per riconoscere la storia principale e aggiornare il contatore soltanto al cambio di storia. L'indicatore contiene anche «Storia N di 3» per gli screen reader, con annunci `polite`. Nessun ascoltatore globale di scorrimento, gesture personalizzata o blocco dei tasti del browser.

Da tastiera, Tab porta il focus nell'area di lettura; Pagina giù, Pagina su e gli altri comandi nativi consentono di scorrere. Tab permette di raggiungere i link della navbar. La sequenza finisce alla terza storia, senza loop o scorrimento infinito. Nessuna nuova dipendenza; homepage, altre sezioni e navbar preservate.

### Verifiche STEP 05

- TypeScript, ESLint e build di produzione completati con successo.
- Chrome headless sul server esistente alla porta 3002, a 320, 390, 768 e 1440 px, con testo al 100% e al 200%: avanzamento reale tramite wheel `01 → 02 → 03`, ritorno `03 → 02 → 01`, fine non ciclica, nessun overflow orizzontale, clipping o sovrapposizione con la navbar.
- Swipe touch nativo simulato in emulazione mobile a 390 px: passaggio dalla prima alla seconda storia e contatore `02 / 03` corretto.
- Tastiera: focus visibile nell'area di lettura, PageDown/PageUp, End/Home e uscita verso Oggi tramite i link della navbar verificati.
- Reduced motion: snap disattivato, scorrimento non animato e contatore funzionante. Contenuto allungato temporaneamente nel DOM e viewport ridotta a 550 px: lettura libera e snap disattivato automaticamente.
- Screenshot mobile e desktop ispezionati. Tutte le altre route rispondono HTTP 200; nessun errore JavaScript rilevato e nessun errore o avviso nei log di sviluppo consultati.
- Hash confrontati: codice della homepage, StoryPreview, navbar, layout, Libreria, Profilo e dipendenze invariati.

I test usano strumenti già disponibili, senza installare dipendenze. Il touch è simulato in Chrome; non sono stati provati un iPhone fisico, le sue barre dinamiche o uno screen reader reale.

## Libreria personale — STEP 06

La pagina `/libreria` presenta l'intestazione Libreria e tre sezioni: Salvati, Recenti e Da leggere. Ogni sezione mostra un titolo e una descrizione specifici del proprio stato vuoto, con una piccola icona outline decorativa. Non vengono mostrate storie dimostrative come contenuti personali.

- `app/libreria/page.tsx`: Server Component per intestazione e composizione dei tre stati vuoti.
- `app/components/LibrarySections.tsx`: unico componente client introdotto; usa stato React locale per selezionare una delle tre sezioni. I pulsanti nativi espongono `aria-pressed` e controllano un'area etichettata dalla sezione selezionata. Tab, Invio e Spazio mantengono il comportamento nativo.
- `app/components/LibraryEmptyState.tsx`: Server Component riutilizzabile per titolo, descrizione e icona, ricevuto come contenuto dalla parte client.
- `app/globals.css`: soltanto regole dedicate ai pulsanti della Libreria. Larghezza riservata per il peso attivo, sottolineatura sottile, focus globale preservato e navigazione che può andare a capo con testo ingrandito.

La selezione iniziale è Salvati e non viene salvata dopo il ricaricamento. Non sono implementati salvataggi, cronologia, lista di lettura, localStorage, API o persistenza. Non sono introdotte animazioni, nuove dipendenze o modifiche a Oggi, Feed, Profilo, navbar e porta 3002.

### Verifiche STEP 06

- TypeScript, ESLint e build di produzione completati con successo.
- Chrome headless sul server esistente alla porta 3002: clic reali sulle tre sezioni e controllo dei rispettivi titoli, descrizioni, nomi accessibili e stato `aria-pressed`.
- Verificate tutte le sezioni a 320, 390, 768 e 1440 px, con testo al 100% e al 200%: nessun overflow orizzontale o etichetta tagliata, aree di tocco almeno 44 × 44 px e nessun cambiamento delle posizioni dei controlli al cambio di selezione.
- Stati vuoti leggibili fino alla fine senza copertura della navbar, un solo `h1`, un solo `h2` per lo stato visibile, icone decorative e contrasto dei testi superiore a 4,5:1. Screenshot mobile e desktop ispezionati.
- Tab, Invio, Spazio, focus visibile e uscita/ritorno tramite la navbar verificati. Selezione ripristinata a Salvati dopo reload, localStorage e sessionStorage vuoti; nessuna storia personale simulata.
- Reduced motion verificato senza animazioni. Oggi, Feed e Profilo rispondono HTTP 200; verificate anche le tre storie di Oggi e la progressione del Feed. Nessun errore JavaScript rilevato.

I test responsive usano viewport simulati e ingrandimento del testo in Chrome; non sono state eseguite prove su iPhone fisico o screen reader reale.

## Profilo e preferenze — STEP 07

Il Profilo presenta otto interessi editoriali selezionabili, tre contatori derivati dall'attività effettiva e un'informativa sul funzionamento locale. Nessun interesse è selezionato inizialmente e i contatori partono da zero. Gli interessi vengono conservati ma non modificano la selezione dimostrativa di Oggi o Feed. Non sono presenti account, identità simulate o sincronizzazione cloud.

La cancellazione dei dati richiede una conferma in un dialog nativo con nome e descrizione accessibili, focus iniziale su Annulla, ciclo di Tab/Shift+Tab, chiusura con Escape e ripristino del focus. Vengono rimossi soltanto i dati personali di Eddy descritti di seguito. Annulla non modifica l'archivio. La finestra rispetta le safe area e può scorrere quando testo o contenuti superano l'altezza disponibile.

## Interazioni e Libreria persistente — STEP 08

- Oggi e Feed: comandi Salva/Salvata e Da leggere/In Da leggere, indipendenti e reversibili.
- Feed: comando esplicito Segna come letta, poi Segna di nuovo come letta per aggiornare la posizione nei Recenti. Visualizzare o scorrere una storia non registra una lettura.
- Libreria: liste derivate dalle azioni, ordinate dal timestamp più recente, con rimozione specifica per ciascuna sezione. Rimuovere da una lista lascia inalterate le altre. Gli stati vuoti dello STEP 06 restano disponibili.
- Profilo: contatori aggiornati dalle stesse informazioni, senza statistiche dimostrative.

Ogni storia mantiene il proprio ID stabile. L'archivio contiene soltanto gli ID e i metadati delle azioni, non copie degli articoli. Se una storia non è più nel dataset, la Libreria mostra «Storia non più disponibile» e consente di rimuoverne la voce senza inventare contenuti.

### Modello e persistenza

Unica chiave di questo sistema: **`eddy:personal:v1`** in localStorage.

Migrazione da ALT: al primo avvio, se esiste la vecchia chiave `alt:personal:v1` e non esiste ancora `eddy:personal:v1`, i dati vengono copiati nella nuova chiave e la vecchia viene rimossa. Se la nuova chiave esiste già, vince quella. «Cancella i dati di Eddy» rimuove entrambe le chiavi.

```json
{
  "version": 1,
  "interests": [],
  "stories": {}
}
```

`interests` contiene gli ID delle categorie; `stories` associa ogni ID di storia a uno o più timestamp `savedAt`, `readingListAt`, `readAt`. I timestamp sono generati soltanto dalle azioni esplicite e i tre campi sono indipendenti. Le liste non contengono duplicati.

Il validatore controlla versione e struttura, filtra interessi sconosciuti o duplicati e metadati non validi. Un archivio assente viene trattato come vuoto; JSON o struttura non validi producono un messaggio e uno stato vuoto, senza riscrivere automaticamente localStorage. Un'azione successiva può salvare un nuovo archivio valido. Gli ID di storie non più presenti rimangono gestibili nella Libreria.

Lo store condiviso usa `useSyncExternalStore`: snapshot iniziale identico sul server e durante l'idratazione, accesso al browser solo dopo il montaggio o in risposta alle azioni, notifiche ai componenti della stessa pagina ed evento `storage` per le altre schede. Prima di una modifica viene riletto l'archivio corrente. Se lettura, scrittura o cancellazione non sono consentite dal browser, viene mostrato un messaggio; una scrittura fallita non viene presentata come riuscita.

### File e responsabilità

- `app/data/editorial-interests.ts`: categorie con ID stabili.
- `app/lib/personal-data.ts`: tipi, chiave, campi indipendenti e validazione dell'archivio.
- `app/lib/personal-store.ts`: hook condiviso, azioni, localStorage, notifiche e sincronizzazione tra schede.
- `app/components/ProfilePreferences.tsx` e `app/profilo/page.tsx`: interazioni del Profilo e composizione server della pagina.
- `app/components/StoryActions.tsx`: controlli condivisi di Oggi e Feed, inseriti nei componenti editoriali esistenti.
- `app/components/LibrarySections.tsx` e `app/libreria/page.tsx`: raccolte personali e riuso delle anteprime e degli stati vuoti.
- `app/globals.css`: stili dei controlli, preferenze e conferma; nessuna nuova palette o animazione.
- `app/layout.tsx`: icona SVG vuota nei metadati per evitare la richiesta 404 al favicon predefinito, senza introdurre un logo grafico.

Il dataset editoriale, la BottomNavigation, la logica dello scorrimento del Feed, dipendenze e porta 3002 restano invariati. Le pagine mantengono il rendering server; lo stato personale è isolato nei componenti interattivi.

### Verifiche STEP 07

- Interessi inizialmente neutri, selezione e deselezione con clic, Invio e Spazio, persistenza dopo refresh.
- Contatori iniziali 0/0/0 e aggiornamento dopo azioni effettive.
- Conferma della cancellazione, focus e ciclo di tastiera, annullamento ed Escape senza modifica dei dati, cancellazione selettiva con una chiave estranea preservata.
- Ripristino immediato di contatori, interessi e stati vuoti, anche nell'altra scheda.

### Verifiche STEP 08

- Flusso completo Oggi → Salva prima storia → Libreria → Da leggere seconda → Feed → lettura esplicita terza → Recenti → Profilo con contatori 1/1/1 → refresh con dati preservati.
- Prima storia contemporaneamente salvata e Da leggere; rimozione dai Salvati senza rimozione da Da leggere. Rimozioni indipendenti da tutte le liste, letture ripetute senza duplicati e ordinamento dei Recenti aggiornato.
- Sincronizzazione dei controlli fra schermate e dei contatori fra due schede attraverso modifiche reali.
- JSON malformato, metadati parzialmente invalidi, interessi duplicati, storie assenti dal dataset e scrittura bloccata dal browser verificati.

### Verifiche tecniche e responsive

TypeScript, ESLint e build di produzione completati con successo. Tutte le quattro route rispondono HTTP 200. Browser Chrome verificato a 320, 390, 768 e 1440 px, con testo al 100% e al 200% su tutte le schermate: controlli funzionanti, contrasto almeno 4,5:1, nessun overflow orizzontale o clipping e ultimi controlli raggiungibili sopra la navbar. Verificati anche il dialog, focus, movimento ridotto e progressione 01/03 → 03/03 del Feed.

Nessun errore di console, idratazione o JavaScript nei test conclusivi. Screenshot mobile ispezionati. I test usano browser temporanei isolati e gli strumenti già disponibili, senza nuove dipendenze; al termine i dati Eddy usati nei test sono stati rimossi. I dati del browser personale dell'utente non vengono toccati.

Non sono stati eseguiti test su un iPhone fisico, su browser diversi da Chrome o con uno screen reader reale. La sincronizzazione resta limitata alle schede dello stesso browser e della stessa origine; non esiste sincronizzazione fra dispositivi.
