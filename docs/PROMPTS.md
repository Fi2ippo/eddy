# Eddy — prompt da incollare in Claude Code (VS Code), in ordine

Prima volta: apri la cartella del progetto in VS Code, copia dentro `CLAUDE.md`, `design/`, `data/`, `scripts/`, `pipeline/`, `.github/` (dalla cartella eddy-handoff), poi apri Claude Code. Incolla un prompt alla volta e aspetta la fine. Se qualcosa va storto, scrivi "stop, spiegami cosa è successo".

## PROMPT 1 — Capire e rinominare
```
Leggi CLAUDE.md e design/*.dc.html. Non cambiare ancora nulla. Dimmi in italiano semplice: (1) cosa c'è nel progetto, (2) cosa dovrai cambiare per ottenere il nuovo design, (3) in che ordine. Poi aspetta il mio ok.
```
```
Ok. Passo 1: rinomina ALT in Eddy ovunque (testi visibili, titolo pagina, metadata, README, package name). Cambia la chiave localStorage in eddy:personal:v1 e fai una migrazione che copia i dati vecchi da alt:personal:v1 se esistono. Poi tsc, lint, build.
```

## PROMPT 2 — Design nuovo, una schermata alla volta
```
Passo 2: applica il design di design/Main.dc.html alla schermata Oggi. Riusa i componenti esistenti, aggiorna i token in globals.css (colori e font Manrope via next/font). Mantieni i dati demo. Titolo centrato, wordmark "Eddy". Poi tsc, lint, build e dimmi come vederlo su localhost:3002.
```
Ripeti con `Feed.dc.html` (scuro, scorrimento a scatti, senza barra di navigazione), `Libreria.dc.html` (sezioni Salvati / Recenti / Da leggere), `Profilo.dc.html` (righe che aprono pannelli dal basso: interessi e impostazioni con dimensione testo). Per ognuna: "applica il design di design/X.dc.html a <schermata>, stesse regole".

## PROMPT 3 — Pagina Storia
```
Passo 3: crea la rotta /storia/[id] seguendo design/Storia.dc.html: foto con categoria e credito, titolo centrato, "In breve" con la dimensione testo scelta nel Profilo (Piccolo 15 / Medio 17 / Grande 20), elenco "Le fonti" con link che si aprono in un'altra scheda, barra Salva / Da leggere collegata allo store personale. Il pulsante "Leggi la storia" del Feed e di Oggi porta qui. Usa i dati demo per ora. Poi tsc, lint, build.
```

## PROMPT 4 — Trovare i feed delle fonti (serve internet libero: sul tuo Mac va)
```
Passo 4: esegui `python3 scripts/discover_feeds.py --limit 20` per provare. Mostrami il risultato. Se funziona, esegui senza --limit (può durare qualche minuto). Poi riassumi: quante fonti ok, quante senza feed, quante irraggiungibili. Non abilitare nessuna fonte.
```
```
Ora crea data/shortlist.md: per le fonti con feed_status ok scegli le 40 migliori per un lancio equilibrato (circa metà italiane, il resto internazionali; almeno 3 fonti per ciascun argomento: tecnologia, scienza, ambiente, economia, cultura, design, mondo). Per ognuna scrivi il link alla pagina "termini d'uso / note legali" se la trovi. Non abilitarle: scelgo io.
```
Poi tu guardi la shortlist, e dici: "abilita queste: …" → Claude mette `enabled: true` e `license_status: "link_e_citazione"` (o "da_contattare").

## PROMPT 5 — Raccolta automatica
```
Passo 5: crea il repository GitHub pubblico "eddy" se non esiste (guidami, uso il terminale integrato), pubblica il progetto, poi esegui `pip install feedparser && python3 pipeline/collect.py`. Mostrami data/stories.json: quante storie, quante hanno foto, esempi di raggruppamento giusto e sbagliato. Poi proponi miglioramenti a SIM_THRESHOLD e TOPIC_WORDS in base a quello che vedi, senza applicarli finché non dico ok.
```
```
Abilita il workflow .github/workflows/collect.yml, avvialo a mano da GitHub (Actions → Raccogli notizie → Run workflow) e dimmi come controllare che abbia salvato i dati.
```

## PROMPT 6 — Dati veri nell'app
```
Passo 6: sostituisci i dati demo con i dati reali. L'app legge public/data/stories.json (copiato da data/stories.json durante la build o scaricato a runtime dal raw di GitHub). Feed = storie ordinate per interessi scelti dall'utente poi per recenza; Oggi = la storia più importante + altre due; Storia = riepilogo + fonti. Gestisci: nessuna foto (usa il segnaposto), nessuna storia per gli interessi scelti, dati non caricati. Credito foto "Foto: <testata>" con referrerpolicy="no-referrer". Poi tsc, lint, build.
```

## PROMPT 7 — Pubblicare gratis
```
Passo 7: configura output statico (output: 'export'), un workflow GitHub Pages che ricostruisce il sito a ogni aggiornamento di data/stories.json, e dimmi l'indirizzo finale. Aggiungi una pagina "Chi siamo / Fonti e crediti" con l'elenco delle testate usate, e come chiedere la rimozione di un contenuto (email o issue GitHub).
```

## PROMPT 8 — Rifiniture (quando 1–7 funzionano)
Sezioni personali (es. "Design e UX"), installabile come app (PWA), ricerca, interruttore Italia/Mondo, tema scuro del resto dell'app.

## Se qualcosa si rompe
`git status` per vedere cosa è cambiato, `git restore .` per tornare indietro prima di un commit. Fai un commit alla fine di ogni passo ("fine passo 3").
