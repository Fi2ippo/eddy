# Eddy: stato del progetto

Aggiornato al 5 novembre 2026, alla fine del passo 5 ("raccolta completa").
Repository pubblico: https://github.com/Fi2ippo/eddy. I dati raccolti stanno sul ramo `dati`.
Le regole decise da Filippo sono in `CLAUDE.md`, nella sezione "Decisioni prese".

---

## 1. In breve

| Passo (PROMPTS.md) | Stato |
|---|---|
| 1. Capire e rinominare ALT → Eddy | ✅ fatto |
| 2. Design nuovo, una schermata alla volta | 🟡 **solo Oggi**. Mancano Feed, Libreria e Profilo |
| 3. Pagina Storia | ✅ fatta con i dati di prova (`/storia/[id]`). Al passo 6 diventa `/storia?id=…` |
| 4. Feed delle fonti + shortlist | ✅ fatto |
| 5. Raccolta automatica | ✅ fatta: 138 fonti, raccolta ogni ora su GitHub Actions, dati sul ramo `dati` |
| 6. Dati veri nell'app | ⬜ da fare (l'app usa ancora solo i dati di prova) |
| 7. Pubblicare gratis (GitHub Pages + pagina "Chi siamo / Fonti") | ⬜ da fare |
| 8. Rifiniture (PWA, ricerca, sezioni personali, tema scuro…) | ⬜ da fare |

---

## 2. Cosa c'è oggi

### App (Next.js 16, React 19, TypeScript, Tailwind 4, lucide-react; porta 3002)

**Comune a tutte le schermate**
- Nome Eddy, font Manrope e colori del brief.
- Barra di navigazione fluttuante a pillola, nascosta nella pagina Storia.

**Schermate**
- **Oggi**: nuovo design.
- **Storia** (`/storia/[id]`): nuovo design, con:
  - "In breve" scritto nella dimensione di testo scelta dall'utente;
  - fonti che si aprono in un'altra scheda;
  - barra Salva / Da leggere.
- **Feed, Libreria, Profilo**: layout vecchio con i colori nuovi.
  - Il Feed ha già il pulsante "Leggi la storia".
  - Il Profilo ha una sezione provvisoria per la dimensione del testo.

**Dati e controlli**
- Dati personali: chiave `eddy:personal:v1`, con migrazione da `alt:personal:v1`.
- Dati di prova: `app/data/demo-stories.ts`.
- `tsc`, `lint` e `build` passano.

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

### Formato di `stories.json`
`generated`, `count` e `stories[]`. Ogni storia ha:
- `id`, `title`, `title_original` (se tradotto), `translated`;
- `category` (= `topics[0]`), `topics[]` (solo gli 8 interessi), `area`;
- `image`, `image_credit`;
- `first_seen`, `updated`, `n_sources`;
- `summary[{source, text, translated}]` (massimo 3 estratti, da testate diverse);
- `sources[{name, title, url, via}]`.

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

### A. Finire il passo 2: design di Feed, Libreria e Profilo
- **Feed** (`design/Feed.dc.html`): scuro, a tutto schermo, senza barra di navigazione, contatore "01 / 03", X, scorrimento a scatti.
- **Libreria** (`design/Libreria.dc.html`): schede Salvati / Recenti / Da leggere con contatori.
- **Profilo** (`design/Profilo.dc.html`): righe che aprono pannelli dal basso (interessi e impostazioni con dimensione testo).

### B. Passo 6: dati veri nell'app
- Leggere `stories.json` dal ramo `dati`, per esempio `https://raw.githubusercontent.com/Fi2ippo/eddy/dati/stories.json`, oppure copiarlo durante la build.
- Pagina Storia unica `/storia?id=…` (decisione già presa) e "aprire la Storia la registra nei Recenti" (decisione già presa).
- Filtro Italia / Mondo / Tutto.
- Mostrare il titolo originale e "tradotto automaticamente" quando `translated` è vero.
- Gestire: storia senza foto (segnaposto), nessuna storia per gli interessi scelti, dati non caricati.

### C. Passo 7: pubblicazione
- `output: 'export'`, GitHub Pages, pagina "Chi siamo / Fonti e crediti" con le istruzioni per chiedere la rimozione di un contenuto.

### D. Da tenere d'occhio
- **Qualità della traduzione:** il modello Argos inglese→italiano è veloce e leggero ma a volte goffo ("Vance cammina tromba stretta…"). Ogni storia tradotta conserva `title_original`. Se servirà più qualità c'è un'alternativa: OPUS-MT "tc-big", che però richiede di convertire il modello una volta con torch.
- **Argomenti poco presenti:** ambiente e design hanno poche storie, perché le fonti di settore pubblicano meno. Si possono aggiungere fonti o parole al lessico.
- **Google News:** circa 30 richieste all'ora. Se Google dovesse limitarle, si alza `GN_REFRESH_HOURS` in `pipeline/feeds.py`.
- **Workflow fermo:** GitHub sospende i workflow programmati dopo 60 giorni senza attività sul repository. Se succede, basta riattivarlo da Actions.
- `README.md` descrive ancora la versione vecchia dell'interfaccia.

---

## 4. Decisioni aperte (servono da Filippo)
1. Controllare a mano le **22 fonti `da_controllare`** (elenco qui sopra) e decidere per ognuna: `link_e_citazione`, `da_contattare`, oppure disabilitarla.
2. Ordine dei prossimi lavori: prima il design (A) o prima i dati veri (B)?
