# Eddy: stato del progetto

Aggiornato al 5 novembre 2026, dopo la nuova home (passi 2 e 6 già fatti).
Repository pubblico: https://github.com/Fi2ippo/eddy. I dati raccolti stanno sul ramo `dati`.
Le regole decise da Filippo sono in `CLAUDE.md`, nella sezione "Decisioni prese".

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
  - **Intestazione:** data piccola ("Giovedì 5 novembre"), saluto in base all'ora ("Buongiorno", "Buon pomeriggio", "Buonasera"), chip "Aggiornato 5 min fa" con pallino verde e chip "300 storie · 67 testate". Le testate sono quelle presenti nelle storie.
  - **"Prima pagina":** carosello orizzontale di 9 card grandi (foto, categoria, pillola testate, prime 2 testate, titolo, "Aggiornata 20 min fa"). Si scorre a scatti con dito, rotella e frecce della tastiera; sotto ci sono i puntini; con il mouse compaiono le frecce.
    - Solo storie delle ultime 24 ore, ordinate per punteggio = 3 punti per testata (fino a 15) + fino a 10 punti di freschezza (scendono a 0 in 24 ore) + 1,5 se c'è la foto. Pesi in `app/lib/stories.ts` (`W_OUTLET`, `MAX_OUTLETS`, `W_FRESH`, `W_PHOTO`).
    - Nessun filtro per interessi (gli interessi decidono solo l'ordine del Feed); il filtro Italia / Mondo / Tutto invece vale.
    - Una sola card per evento: la raccolta dà lo stesso `event` alle storie sullo stesso fatto (es. 8 storie sugli allarmi bomba), e la prima pagina ne mostra solo la più importante.
  - **"Sfoglia · una notizia per schermata":** apre il Feed (`/feed?da=prima-pagina`) partendo dalle 9 storie della prima pagina.
  - **Fila di temi:** Tutti + gli 8 interessi. Con un tema si vedono le storie che hanno quel tema come categoria principale (i temi secondari sono meno affidabili), ordinate per rilevanza.
  - **"Ultime notizie":** tutte le altre storie, dalla più recente, 20 alla volta con "Mostra altre". Ogni riga ha testate, orario, titolo, estratto breve, categoria, pillola testate e Salva.
- **Pillola "N testate"** (`OutletsTag`) su Oggi, Feed, Libreria e Storia: conta le testate diverse, comprese quelle arrivate da Google News.
- **Orario relativo** (`TimeAgo`): "ora", "5 min fa", "2 h fa", "ieri 18:30", "4 nov". Usa l'articolo più recente della storia e si aggiorna da solo ogni minuto.
- **Feed** (`FeedView`):
  - scuro e a tutto schermo, senza barra di navigazione;
  - in alto il contatore "01 / 30", "Eddy" e la X che torna a Oggi, con sotto un piccolo filtro Tutto / Italia / Mondo;
  - una storia per schermata, a scatti, con dito, rotella e tastiera (frecce, Pagina su/giù, Inizio/Fine);
  - ordine: prima le storie dei tuoi interessi, poi le altre, dalla più recente; 30 storie (da "Sfoglia" della home: prima le 9 della prima pagina);
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
  - verificati: carosello avanti e indietro con le frecce e con lo scorrimento, puntini, "Mostra altre" (da 20 a 40), tema Economia (73 storie per rilevanza, la prima pagina resta), filtro Italia anche nella home, Salva da una riga, "Sfoglia" che parte dalla prima pagina, orari, "Raccontata da…", pillola delle testate in Libreria;
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
