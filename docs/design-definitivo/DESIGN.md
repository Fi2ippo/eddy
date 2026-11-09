# Eddy · design definitivo (8 novembre 2026)

Questa cartella è il riferimento visivo della nuova Eddy, deciso da Filippo schermata per schermata.
- `schermate/NN-nome.html`: la schermata a 390×844, da aprire nel browser. Contiene misure, colori e testi esatti. È un **riferimento**, non codice da incollare: l'app resta `site_src/page.html` + `site_src/app.js`.
- `schermate/NN-nome.png`: la stessa schermata, intera (tutto lo scorrimento). Nei PNG il carattere è sostituito: quello giusto è Schibsted Grotesk.
- `logo/`: il logo "Tre notizie" in SVG.
- I testi delle notizie nelle schermate sono esempi: nell'app vanno sempre e solo i dati veri della raccolta.
- La vecchia cartella `design/` (Main, Feed, Libreria…) è superata: ignorala.

## Fondamenta
- **Carattere:** Schibsted Grotesk (Google Fonts, pesi 400–900) per tutto. Titoli 800, testo 400–500.
- **Per ora solo tema chiaro.** Il tema scuro automatico si spegne (si potrà ridisegnare più avanti).
- **Fondo bianco #FFFFFF ovunque** (tutte le sezioni, primo avvio, pannelli e fogli; anche theme-color): nessuno stacco con la zona dell'ora dell'iPhone. Le parti grigie interne (anteprima del saluto, segnaposto, riquadri del Profilo) restano #F4F5F7.
- **Inchiostro** #111216 · **grigio testo** #6B6E76 · **grigio chiaro** #9A9DA5 · **bordi** #E1E3E7 · **card** #FFFFFF.
- **Pulsante principale:** pillola nera #111216 con testo bianco, alta almeno 54px. Niente blu acceso, niente verde, niente pallini verdi.
- **Card:** bianche, bordo 1px #E1E3E7 (sul fondo bianco si staccano con il bordo), raggio 14–16px, ombra leggerissima. Il tema si vede da una **riga colorata in cima** (5–6px) e dall'etichetta del tema.
- Testi mai sotto 12px, pulsanti e tocchi mai sotto 44px.

## Il colore del nome cambia con l'ora
Il fondo resta bianco; cambiano solo il saluto e il colore del nome: 5–12 Buongiorno, nome #B0502A · 12–18 Buon pomeriggio, nome #2F6496 · 18–5 Buonasera, nome #5B4CA0.

## Logo "Tre notizie"
Tre strisce arrotondate sfalsate verso destra: rossa #D0021B, blu #3D5FC4, arancio #C25400 (geometria in `logo/eddy-segno.svg`). Accanto, il nome **"eddy"** minuscolo, peso 800.
- Nell'app compare **solo in cima a Oggi**, a sinistra (strisce 23×17px + "eddy" 19px); a destra c'è la pillola per aggiornare.
- Icona dell'app: strisce su quadrato bianco (`logo/eddy-icona.svg`; per Android `eddy-icona-maskable.svg`). Va al posto della vecchia "E" blu di `make_icons.py`.

## Colori dei temi · "Famiglie Solare"
Ogni tema ha due toni: **pieno** per righe, cartelle, quadratini e barre; **scritta** per il testo colorato (etichette, numeri, titoli). Il testo bianco non va mai sul tono pieno: se serve un'etichetta piena, usa il tono scritta come fondo.

| Famiglia | Tema (chiave in app.js) | Pieno | Scritta |
|---|---|---|---|
| Attualità | Cronaca (`cronaca`) | #D0021B | #D0021B |
| Attualità | Politica (`italia`) | #C2185B | #C2185B |
| Attualità | Salute (`salute`) | #F06B8B | #E31748 |
| Luoghi | Mondo (`mondo`) | #3D5FC4 | #3D5FC4 |
| Luoghi | Napoli e provincia (`napoli`) | #3FB0F0 | #0E79B6 |
| Sapere | Economia (`economia`) | #2BAE66 | #21854E |
| Sapere | Scienza (`scienza`) | #17B3B0 | #11817F |
| Sapere | Clima (`clima`) | #A3C736 | #657B21 |
| Sapere | Tecnologia (`tech`) | #1E8A96 | #1B7E89 |
| Cultura | Cultura (`cultura`) | #C25400 | #C25400 |
| Cultura | Design (`design`) | #F2B32B | #996C09 |
| Cultura | Arte e fotografia (`arte`) | #F08A4B | #C05310 |
| Cultura | Architettura (`architettura`) | #C4A57A | #8F6D3F |
| Tempo libero | Spettacoli (`spettacoli`) | #D25BB4 | #C837A4 |
| Tempo libero | Sport (`sport`) | #8E6CF0 | #7C55EE |
| Tempo libero | Motori (`motori`) | #5E6272 | #5E6272 |

## Barra di navigazione
Pillola bianca che fluttua (16px dal fondo, 14px dai lati), alta 68px, raggio 34px, bordo #E4E5E9, ombra leggera. **Solo icone**; la voce attiva si allarga in una pillola #EEEFF2 con icona e nome in #111216. Le voci inattive sono #6B6E76.
Cinque voci, con le icone disegnate nelle schermate: **Oggi** (giornale) · **Per te** (bussola) · **Sfoglia** (carte) · **Salvati** (segnalibro) · **Profilo** (persona). Non c'è più Esplora.

## Le schermate (nell'ordine in cui le incontri)
1. **01–04 · Primo avvio**: Benvenuto (anteprima di card affiancate) → Cosa ti interessa? (i 16 temi divisi per famiglia — Attualità, Luoghi, Sapere, Cultura, Tempo libero — come pillole con icona; scelto, il tema si riempie del suo colore; pulsante "Avanti · N temi" sempre in fondo) → Come ti chiamiamo? (con l'anteprima del saluto) → **04 · Come si sfoglia**: la prima volta in Oggi la fila di Prima pagina scorre di 48px e torna indietro due volte; sotto il titolo compare "Scorri per le altre →", che sparisce al primo scorrimento. Il cenno si interrompe quando interagisci e non si ripete, anche rivedendo l'introduzione; con movimento ridotto rimane solo il testo. "Salta" sempre possibile; l'introduzione si rivede dal Profilo.
2. **05 · Oggi**: testata compatta con logo a sinistra (19px) e pillola #F4F5F7 a destra, senza bordo e alta 40px, con "Aggiornato alle…" e icona; tutta la pillola aggiorna le notizie. Sotto, saluto a sinistra a 27px con il nome nel colore dell'ora, su una riga salvo nomi lunghi; poi solo la data per esteso a 14px. Dopo 30px, **Prima pagina** come fila di card che **scorre di lato** (scorrimento normale del telefono, la card dopo si intravede a destra), contatore "1 di 9" in alto a destra, niente puntini. Card con foto di 180px, etichetta, titolo sempre intero a 22px, testate e tempo in fondo: sommario e indicazione della traduzione si leggono nella storia. A 390×844 la card intera resta sopra la barra di navigazione. Dopo la fila, linea #ECEDF0 con margini di 20px e 22px di spazio prima di **Napoli e provincia**; poi **Ultime notizie** in elenco.
3. **08 · Per te, i tuoi temi**: "I tuoi temi" (con "Modifica") come mazzi di carte su due colonne, uno per tema scelto: carta davanti con foto e titolo della notizia più importante, riga del colore del tema, bollino "N nuove", sotto icona, nome e numero di notizie. Poi "Altri temi" su due colonne. "Nuove" sono le notizie arrivate nelle ultime 12 ore (contando dall'ultimo articolo, la stessa ora che si legge sotto il titolo); la stessa regola vale per il totale in cima a Per te e per la pagina del tema. Senza temi scelti: un invito con il pulsante per sceglierli.
4. **09 · Per te, dentro un tema**: "‹ Per te" e la pillola "Nei tuoi temi / Aggiungi ai tuoi temi"; icona e nome del tema affiancati, "N notizie · X nuove". Sezione **Nuove** (ultime 12 ore) come fila di card che scorre di lato, con "1 di N"; sotto **Tutte le notizie** con le altre, dalla più recente.
5. **10 · Sfoglia**: una notizia per schermata, foto incorniciata come una stampa, poi tema, titolo e una frase di una testata con il bordo del colore del tema. Niente barra di avanzamento.
6. **11 · Storia**: riga del tema in cima; indietro, salva, condividi; tema, titolo, "Raccontata da…", foto con "Foto: testata"; **In breve** (frasi delle testate con nome); **Cronologia** con gli ultimi 3 aggiornamenti + "Tutta la cronologia · N"; **Approfondisci** con capitoli che si aprono: Punti chiave, Confronto tra le testate, Le fonti.
7. **12–14 · Salvati**: schede "Salvati" e "Recenti". Salvati è una griglia di **cartelle per tema** (prima "Tutte"; le cartelle vuote sono grigie); Recenti divide le storie aperte per giorno (Oggi, Ieri, Questa settimana) con le novità; dentro una cartella, titolo nel colore del tema.
8. **15 · Profilo**: nome con matita, "I tuoi temi più letti" (3 riquadri con percentuale), I tuoi temi, Dimensione del testo, Come funziona l'edizione, Privacy, Rivedi l'introduzione, Cancella i dati di Eddy, "Eddy · fatto da Fi2ippo".

## Cose tolte rispetto all'app attuale
Ascolta e la lettura a voce · la sezione Esplora (con la ricerca) · seguire o silenziare le testate · gli avvisi · la fila dei temi in Oggi e in Per te · il tema scuro · il pallino verde · "Installa Eddy" nel Profilo. I temi si scelgono solo nel primo avvio e nel Profilo.
