# Eddy

Eddy è un sito gratuito che ogni giorno raccoglie le notizie di molte testate, mette insieme gli articoli che parlano
dello stesso fatto e li mostra come **storie**: titolo, brevi frasi delle testate (al massimo tre per articolo, sempre
con nome e link all'originale) e l'elenco delle fonti. Nessun testo è scritto dall'intelligenza artificiale.

**Sito:** https://fi2ippo.github.io/eddy

Non ci sono account né tracciamento: interessi, storie salvate e letture restano solo nel browser di chi legge.

## Come funziona

```
data/sources.json ──► pipeline/collect.py (GitHub Actions, circa ogni 30 minuti) ──► ramo "dati": stories.json
                                                                                         │
sito statico Next.js (GitHub Pages) ◄── il browser scarica stories.json ◄────────────────┘
```

1. **Raccolta** (`pipeline/`, Python). Il workflow `.github/workflows/collect.yml` legge i feed delle testate attive in
   `data/sources.json` (più i titoli di altre testate tramite Google News), pulisce titoli ed estratti, scarta le
   non-notizie, traduce in italiano i testi stranieri con modelli liberi offline (OPUS-MT, Argos Translate),
   raggruppa gli articoli per fatto, assegna temi (8 interessi) e area (Italia / Mondo) e scrive `stories.json` sul
   ramo `dati`. Ogni giro, se riesce, prenota il successivo; un orario fisso fa da rete di sicurezza.
2. **Sito** (`app/`, Next.js + React + Tailwind). È un sito statico: le notizie non sono dentro il sito, l'app le
   scarica dal ramo `dati` quando si apre (e ogni 10 minuti). Per questo il sito non va ricostruito a ogni raccolta.
   La pagina di una storia è unica: `/storia/?id=…`.
3. **Pubblicazione.** Il workflow `.github/workflows/pages.yml` costruisce il sito e lo pubblica su GitHub Pages a
   ogni push su `main`.

Le foto restano sui siti delle testate: Eddy le mostra in collegamento, senza scaricarle, con il credito
"Foto: <testata>". Crediti completi nella pagina **Chi siamo** del sito (dal Profilo).

## Avviare il sito sul proprio computer

Servono Node.js 20.9 o più recente e npm.

```sh
npm ci          # una volta sola: installa le dipendenze
npm run dev     # poi apri http://localhost:3002
```

Controlli prima di ogni modifica: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
La build crea la cartella `out/` (sito statico); `npm start` la mostra su http://localhost:3002.
Su GitHub Pages il sito vive in `/eddy`: lo decide la variabile `EDDY_BASE_PATH` (vuota in locale).

Per provare la raccolta (Python 3.9 o più recente):

```sh
pip install -r pipeline/requirements.txt
python3 pipeline/selftest.py      # controlli senza rete
python3 pipeline/collect.py       # raccolta vera: scrive data/stories.json (non va su git)
```

## Aggiungere una fonte

1. Cerca la testata in `data/sources.json` (ci sono già 357 fonti del catalogo). Se manca, aggiungila copiando una
   voce simile: `id` unico, `name`, `site`, `area` (`italia` o `mondo`), `language`, `mode: "news"`.
2. Trova il feed: `python3 scripts/discover_feeds.py --only <id>` prova gli indirizzi più comuni e scrive `feed_url`.
   Per le testate grandi si possono aggiungere feed per sezione in `feeds` (con `topic` o `area`), come per Il Post.
   Se non c'è un feed, si può usare Google News: `via: "google_news"` e `gn_domain` (solo titolo e link).
3. **Leggi a mano le condizioni d'uso** della testata. Poi imposta `license_status` (`link_e_citazione` se si possono
   mostrare estratti brevi, `solo_link` se solo titolo e link) ed `enabled: true`.
4. Fai girare `python3 pipeline/collect.py` e controlla `data/report.json`; poi commit e push.

Le fonti attive ma con condizioni ancora da leggere sono in `docs/licenze-da-controllare.md`.

## Togliere un contenuto (richiesta di rimozione)

Le richieste arrivano dal modulo GitHub "Richiesta di rimozione" (Issues → New issue) o per email (vedi la pagina
Chi siamo). Per eseguirle:

1. Aggiungi a `data/blocklist.json` l'indirizzo esatto dell'articolo (`"https://www.esempio.it/articolo"`) oppure,
   per un intero sito, il dominio (`"esempio.it"`, vale anche per i sottodomini).
2. Se la testata non vuole più comparire, metti anche `enabled: false` alla sua voce in `data/sources.json`.
3. Commit e push: dal giro di raccolta successivo (al massimo mezz'ora) gli articoli spariscono dalle storie, con
   estratti e foto. Rispondi alla richiesta e chiudila.

## Licenze e grazie

- Testi e foto restano delle rispettive testate; Eddy ne mostra solo brevi estratti con link. I riquadri "Per capire"
  vengono da Wikipedia (CC BY-SA).
- Strumenti: Next.js, React, Tailwind CSS, Lucide, Manrope; feedparser, scikit-learn, CTranslate2, OPUS-MT, Argos
  Translate.

Questo non è un parere legale: prima di un uso pubblico ampio va chiesto il permesso alle testate principali.
