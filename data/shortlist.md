# Shortlist fonti per il lancio di Eddy

Controllo del 5 novembre 2026. **Nessuna fonte è abilitata**: in `sources.json` tutte restano `enabled: false` e `license_status: "da_verificare"` finché non scegli tu.

Questa non è consulenza legale. I link ai termini d'uso servono come punto di partenza per la tua verifica a mano.

## Come leggere le tabelle

- **id**: il nome della fonte in `sources.json`. Per abilitarle scrivimi per esempio "abilita: ansa, il-post, …".
- **Argomento**: l'argomento principale secondo me. In `sources.json` le fonti italiane hanno tutte argomenti generici ("attualita, politica" oppure "attualita, cultura"), quindi li ho assegnati guardando cosa pubblicano davvero.
- **Ultimo articolo**: la data più recente trovata nel feed. Se c'è il 4–5 novembre, il feed è vivo.
- **Foto**: indica se il feed contiene già le immagini. Se manca, la storia avrà l'illustrazione segnaposto, a meno che un'altra fonte dello stesso gruppo di notizie non abbia la foto.
- **Termini d'uso / licenza**: ✅ licenza aperta dichiarata (Creative Commons o regole di ripubblicazione) · 📄 pagina dei termini trovata · ❓ non trovata in automatico, da cercare a mano o chiedere alla testata.

## Fonti italiane (20)

| # | Fonte | id | Argomento | Ultimo articolo | Foto | Termini d'uso / licenza |
|---|---|---|---|---|---|---|
| 1 | ANSA | `ansa` | mondo, attualità | 5 nov | no | 📄 [Condizioni generali di servizio](https://www.ansa.it/sito/static/condizioni_generali_di_servizio.html) |
| 2 | Il Post | `il-post` | attualità | 5 nov | sì | 📄 [Condizioni d'uso](https://www.ilpost.it/condizioni-generali/) |
| 3 | Internazionale | `internazionale` | mondo | 5 nov | sì | 📄 [Note legali](https://www.internazionale.it/notelegali) |
| 4 | La Stampa | `la-stampa` | attualità | 5 nov | sì | ❓ non trovata (gruppo GEDI, in cessione al gruppo SAE) |
| 5 | Domani | `domani` | attualità, politica | 5 nov | sì | 📄 [Termini d'uso](https://www.editorialedomani.it/terms-of-service) |
| 6 | Il Sole 24 Ore | `il-sole-24-ore` | economia | 5 nov | sì | ❓ non trovata |
| 7 | Linkiesta | `linkiesta` | attualità, politica | 5 nov | sì | ❓ non trovata |
| 8 | Valigia Blu | `valigia-blu` | attualità, approfondimento | 4 nov | no | ✅ [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (indicata nel sito) |
| 9 | Facta | `facta` | verifica dei fatti | 4 nov | no | ❓ non trovata |
| 10 | Agenda Digitale | `agenda-digitale` | tecnologia | 5 nov | no | ❓ non trovata (gruppo Network Digital360) |
| 11 | Le Scienze | `le-scienze` | scienza | 4 nov* | sì | ❓ non trovata (gruppo GEDI) |
| 12 | Il Bo Live (Università di Padova) | `il-bo-live` | scienza | 4 nov | no | ✅ [CC BY-NC-ND 3.0 IT](https://ilbolive.unipd.it/it/copyright): citare "Il Bo Live" e l'autore |
| 13 | Scienza in rete | `scienza-in-rete` | scienza | 5 nov | sì | ❓ non trovata |
| 14 | LifeGate | `lifegate` | ambiente | 4 nov | sì | 📄 [Termini e condizioni](https://www.lifegate.it/termini-e-condizioni) |
| 15 | Altreconomia | `altreconomia` | economia, ambiente | 4 nov | sì | ❓ trovate solo le [condizioni di vendita](https://altreconomia.it/condizioni-di-vendita/) |
| 16 | EconomyUp | `economyup` | economia, tecnologia | 5 nov | sì | ❓ non trovata (gruppo Network Digital360) |
| 17 | Doppiozero | `doppiozero` | cultura | 5 nov | no | ✅ [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it) (indicata nel sito) |
| 18 | Il Tascabile | `il-tascabile` | cultura, scienza | 5 nov | sì | 📄 [Informazioni legali](https://www.iltascabile.com/informazioni-legali) |
| 19 | Rivista Studio | `rivista-studio` | cultura | 5 nov | sì | ❓ non trovata |
| 20 | Abitare | `abitare` | design | 4 nov | sì | ❓ non trovata |

\* Il feed di Le Scienze non riporta le date. Gli articoli sono recenti (4 novembre), ma la raccolta automatica dovrà usare l'ora in cui li legge.

## Fonti internazionali (20)

| # | Fonte | id | Argomento | Ultimo articolo | Foto | Termini d'uso / licenza |
|---|---|---|---|---|---|---|
| 21 | BBC News | `bbc-news` | mondo | 5 nov | sì | 📄 [Terms of Use](https://www.bbc.com/pages/terms-of-use) |
| 22 | The Guardian | `the-guardian` | mondo | 5 nov | sì | 📄 [Terms of service](https://www.theguardian.com/help/terms-of-service) · [Licensing](https://licensing.theguardian.com/) |
| 23 | Al Jazeera English | `al-jazeera-english` | mondo | 5 nov | no | 📄 [Terms and Conditions](https://www.aljazeera.com/terms-and-conditions/) |
| 24 | France 24 | `france-24` | mondo | 5 nov | sì | 📄 [Legal notice di France Médias Monde](https://www.francemm.com/en/legal-notice) (l'editore) |
| 25 | MIT Technology Review | `mit-technology-review` | tecnologia | 4 nov | sì | ✅ [Republishing](https://www.technologyreview.com/republishing/) · 📄 [Terms of service](https://www.technologyreview.com/terms-of-service/) |
| 26 | Ars Technica | `ars-technica` | tecnologia | 5 nov | sì | 📄 [User Agreement di Condé Nast](https://www.condenast.com/user-agreement) (l'editore) |
| 27 | The Verge | `the-verge` | tecnologia | 5 nov | sì | 📄 [Terms of use di Vox Media](https://www.voxmedia.com/terms-of-use/). La pagina "About" rimanda anche a [pmc.com/terms-of-use](https://www.pmc.com/terms-of-use/): verificare quale vale oggi |
| 28 | Quanta Magazine | `quanta-magazine` | scienza | 4 nov† | sì | 📄 [Terms & Conditions](https://www.quantamagazine.org/terms-conditions/) |
| 29 | Science News | `science-news` | scienza | 5 nov | sì | 📄 [Terms of Service](https://www.sciencenews.org/terms-of-service) · [Rights & Permissions](https://www.sciencenews.org/permission-republish) |
| 30 | Our World in Data | `our-world-in-data` | scienza, dati | 2 nov | sì | ✅ [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [note legali](https://ourworldindata.org/organization#legal-disclaimer) |
| 31 | Undark | `undark` | scienza e società | 30 ott | sì | ✅ [Republishing guidelines](https://undark.org/republishing-guidelines/) |
| 32 | Carbon Brief | `carbon-brief` | ambiente | 4 nov | sì | ✅ [CC BY-NC-ND 4.0](http://creativecommons.org/licenses/by-nc-nd/4.0/legalcode) (indicata nel sito) |
| 33 | Mongabay | `mongabay` | ambiente | 4 nov | sì | ✅ [Copyright e ripubblicazione](https://news.mongabay.com/copyright/) · 📄 [Terms](https://news.mongabay.com/terms) |
| 34 | Grist | `grist` | ambiente | 5 nov | sì | ✅ [Republish our stories](https://grist.org/about/promote/) · 📄 [Terms](https://grist.org/terms/) |
| 35 | Rest of World | `rest-of-world` | economia, tecnologia | 2 nov | sì | ✅ [Licensing guidelines](https://restofworld.org/about/licensing-style-guidelines/) (solo articoli online da almeno una settimana) |
| 36 | Aeon | `aeon` | cultura, idee | 4 nov | sì | 📄 [Terms of Use](https://aeon.co/terms-of-use) |
| 37 | Designboom | `designboom` | design | 5 nov | sì | 📄 [Copyright](https://www.designboom.com/copyright/) · [Terms](https://daaily.com/terms-conditions.html) |
| 38 | It's Nice That | `it-s-nice-that` | design | 5 nov | sì | 📄 [Terms of Service](https://www.itsnicethat.com/terms-conditions) |
| 39 | Smashing Magazine | `smashing-magazine` | design (UX) | 3 nov | sì | ❓ non trovata (c'è solo la [privacy](https://www.smashingmagazine.com/privacy-policy/)) |
| 40 | ProPublica | `propublica` | inchieste | 4 nov | sì | ✅ [Steal Our Stories](https://www.propublica.org/steal-our-stories) (Creative Commons) · 📄 [Legal](https://www.propublica.org/legal) |

† In `sources.json` l'indirizzo del feed di Quanta è sbagliato: `…/quanta/feed/` contiene un solo articolo del 2013. Quello giusto è `https://www.quantamagazine.org/feed/`. Se scegli Quanta, correggo il file quando la abiliti.

## Equilibrio per argomento

| Argomento | Fonti | Quante |
|---|---|---|
| tecnologia | Agenda Digitale, EconomyUp, MIT Technology Review, Ars Technica, The Verge, Rest of World | 6 |
| scienza | Le Scienze, Il Bo Live, Scienza in rete, Il Tascabile, Quanta, Science News, Our World in Data, Undark | 8 |
| ambiente | LifeGate, Altreconomia, Carbon Brief, Mongabay, Grist | 5 |
| economia | Il Sole 24 Ore, Altreconomia, EconomyUp, Rest of World | 4 |
| cultura | Internazionale, Doppiozero, Il Tascabile, Rivista Studio, Aeon | 5 |
| design | Abitare, Designboom, It's Nice That, Smashing Magazine | 4 |
| mondo | ANSA, Internazionale, BBC News, The Guardian, Al Jazeera English, France 24 | 6 |

Ogni argomento ha almeno 3 fonti. **Economia è il più debole**: fra le 143 fonti con feed funzionante ce ne sono solo 5 di economia. Il Sole 24 Ore è l'unica grande testata economica.

Nota: "mondo" non è fra gli 8 interessi dell'app (tecnologia, economia, politica, scienza, cultura, società, ambiente, design). Va deciso se aggiungerlo come interesse o se le notizie dal mondo finiscono in "politica" e "società".

## Perché queste

- **Metà italiane e metà internazionali.** Fra le italiane ci sono punti di vista diversi (Il Post, La Stampa, Domani, Linkiesta, Il Sole 24 Ore) e due fonti di verifica dei fatti (Facta, Valigia Blu). Fra le internazionali ci sono emittenti pubbliche e testate di paesi diversi (BBC, France 24, Al Jazeera).
- **Licenze aperte preferite, come chiede il brief.** 12 fonti su 40 dichiarano una licenza aperta o regole di ripubblicazione (✅).
- **Feed vivi.** Ho tenuto solo fonti che hanno pubblicato negli ultimi giorni.

## Escluse dopo il controllo

- **Wired Italia**: il feed è fermo al 1° luglio 2026. Al suo posto ho messo Agenda Digitale.
- **The Markup**: buona licenza, ma pochi articoli (l'ultimo è del 15 ottobre). Al suo posto ho messo The Verge.

## Riserve (feed ok, se vuoi sostituire qualcuna)

- **Italiane:** Open, Pagella Politica, Il Fatto Quotidiano, Il Manifesto, Limes, Focus, Artribune, Exibart.
- **Internazionali:** NPR, The Hindu, Mail & Guardian, Yale Environment 360, Nautilus, Literary Hub, Core77, The Markup.

## Da sapere prima di abilitare

- Eddy mostra **estratti brevi (massimo 3 frasi) con link all'originale**, non articoli interi. Le licenze "ND" (nessuna opera derivata) e "NC" (non commerciale) vanno lette pensando a questo uso, e in ogni caso Eddy è gratuito.
- Per le fonti ❓ conviene cercare a mano in fondo alla home la voce "note legali" o "termini". In alternativa si può scrivere alla redazione, che è la strada più sicura anche secondo il brief se Eddy diventa pubblico.
