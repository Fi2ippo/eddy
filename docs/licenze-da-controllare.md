# Licenze da controllare

Queste 22 fonti sono attive in Eddy (`enabled: true` in `data/sources.json`) ma con `license_status: "da_controllare"`:
prima che Eddy diventi davvero pubblico bisogna leggere le loro condizioni d'uso, oppure scrivere alla testata.
Eddy mostra solo titolo, al massimo tre frasi d'estratto con nome e link, e la foto in collegamento con il credito "Foto: <testata>".
Non è consulenza legale.

Come leggere la tabella: "Condizioni" è il link trovato automaticamente in fondo alla home del sito il 6/11/2026 (va aperto e letto);
"—" vuol dire che non è stato trovato in automatico: cercare in fondo alla pagina voci come *Note legali*, *Termini*, *Copyright*.
Dopo il controllo, aggiornare `license_status` in `data/sources.json` (`link_e_citazione` se va bene, `solo_link` se si possono mostrare solo titolo e link, oppure `enabled: false`).

| Fonte | Sito | Condizioni | Cosa cercare |
|---|---|---|---|
| Corriere della Sera | https://corriere.it | — | Note legali: se titoli ed estratti dei feed RSS si possono mostrare altrove e se le foto in collegamento sono ammesse. |
| la Repubblica | https://repubblica.it | — | Note legali: uso dei feed RSS fuori dal sito e riproduzione di brevi estratti con link. |
| La Stampa | https://lastampa.it | — | Note legali: uso dei feed RSS e delle foto in collegamento. |
| Il Sole 24 Ore | https://ilsole24ore.com | — | Condizioni generali: i feed RSS sono per uso personale? Servono permessi per estratti e foto. |
| Linkiesta | https://linkiesta.it | — | Note legali o pagina contatti: permesso per titoli, estratti brevi e foto dal feed. |
| Le Scienze | https://lescienze.it | — | Note legali: uso dei feed RSS e foto (spesso di agenzie con diritti propri). |
| Rivista Studio | https://rivistastudio.com | — | Pagina contatti o note legali: chiedere il permesso per estratti e foto dal feed. |
| Abitare | https://abitare.it | — | Note legali: le foto di architettura hanno spesso diritti dei fotografi. |
| Scienza in rete | https://scienzainrete.it | — | Licenza degli articoli (alcuni siti di divulgazione usano Creative Commons): se c'è, citarla. |
| Agenda Digitale | https://agendadigitale.eu | [apri](https://www.digital4.biz/legal/) | Pagina legale del gruppo Digital360 (link trovato in fondo al sito): uso dei feed e degli estratti. |
| EconomyUp | https://economyup.it | [apri](https://www.digital4.biz/legal/) | Pagina legale del gruppo Digital360 (stessa di Agenda Digitale): uso dei feed e degli estratti. |
| Altreconomia | https://altreconomia.it | — | Nel sito c'è solo "Condizioni di vendita": cercare note legali o licenza degli articoli, altrimenti chiedere. |
| Facta | https://facta.news | — | Licenza degli articoli di fact-checking (verificare se Creative Commons) e uso delle immagini. |
| MIT Sloan Management Review | https://sloanreview.mit.edu | — | Terms of use / permissions: di solito vietano la riproduzione; controllare se titolo + estratto breve + link è ammesso. |
| Fortune | https://fortune.com | [apri](https://fortune.com/terms-of-use/) | Terms of Use (link trovato in fondo alla pagina): uso dei feed RSS e dei contenuti fuori dal sito. |
| Bloomberg | https://bloomberg.com | — | Il sito blocca i controlli automatici: aprire a mano i Terms of Service; se non è chiaro, tenerla solo come link. |
| Smashing Magazine | https://smashingmagazine.com | — | Pagina "Terms" o "Licensing": uso dei feed e delle immagini degli articoli. |
| lavoce.info | https://lavoce.info | [apri](https://www.lavoce.info/CREATIVE-COMMON) | Pagina "Copyright e disclaimer" (link trovato in fondo alla pagina): sembra indicare una licenza Creative Commons, verificare quale e citarla. |
| Wall Street Italia | https://www.wallstreetitalia.com | — | Il sito blocca i controlli automatici: aprire a mano le note legali; uso del feed e delle foto. |
| Project Syndicate | https://www.project-syndicate.org | [apri](https://www.project-syndicate.org/pages/terms-and-conditions) | Terms & Conditions (link trovato in fondo alla pagina): i commenti sono a pagamento per la ripubblicazione; controllare se titolo + estratto breve + link è ammesso. |
| CEPR VoxEU | https://cepr.org/voxeu | — | Il sito blocca i controlli automatici: aprire a mano i termini e controllare se gli articoli hanno una licenza Creative Commons. |
| CNBC | https://www.cnbc.com | — | Terms of Service: uso dei feed RSS fuori dal sito e delle foto. |

## Fonti aggiunte con la nuova app (6/11/2026)

Testate aggiunte per le sezioni Design, Architettura, Arte e fotografia e per Napoli e provincia: feed verificati, condizioni d'uso ancora da leggere. Cosa cercare: se titolo, breve estratto con link e foto mostrata dal loro sito sono ammessi.

| Fonte | Sito | Tipo |
|---|---|---|
| Abitare | https://www.abitare.it | Rivista di design e architettura |
| Interni | https://www.internimagazine.it | Rivista di design |
| Elle Decor Italia | https://www.elledecor.com/it/ | Rivista di design e interni |
| Living (Corriere) | https://living.corriere.it | Rivista di design e casa |
| Designboom | https://www.designboom.com | Rivista di design e architettura |
| Dezeen | https://www.dezeen.com | Rivista di architettura e design |
| It's Nice That | https://www.itsnicethat.com | Rivista di grafica e creatività |
| Smashing Magazine | https://www.smashingmagazine.com | Design di interfacce e web |
| Nielsen Norman Group | https://www.nngroup.com | Ricerca sulla user experience |
| UX Collective | https://uxdesign.cc | Rivista di UX design |
| Figma Blog | https://www.figma.com/blog/ | Strumenti e pratica del design |
| Core77 | https://www.core77.com | Rivista di design industriale |
| Yanko Design | https://www.yankodesign.com | Rivista di design di prodotto |
| Creative Bloq | https://www.creativebloq.com | Rivista di grafica e creatività |
| Creative Review | https://www.creativereview.co.uk | Rivista di comunicazione visiva |
| Wallpaper* | https://www.wallpaper.com | Rivista di design, architettura e arte |
| Fast Company Design | https://www.fastcompany.com/co-design | Design e innovazione |
| Design Milk | https://design-milk.com | Rivista di design |
| DesignWanted | https://designwanted.com | Rivista di design |
| ArchDaily | https://www.archdaily.com | Rivista di architettura |
| Il Giornale dell'Architettura | https://ilgiornaledellarchitettura.com | Rivista di architettura |
| Artribune | https://www.artribune.com | Rivista di arte e cultura |
| Exibart | https://www.exibart.com | Rivista d'arte |
| Finestre sull'Arte | https://www.finestresullarte.info | Rivista d'arte |
| ArtsLife | https://artslife.com | Rivista di arte e mercato |
| ARTnews | https://www.artnews.com | Rivista d'arte |
| Hyperallergic | https://hyperallergic.com | Rivista d'arte |
| The Art Newspaper | https://www.theartnewspaper.com | Giornale dell'arte |
| Colossal | https://www.thisiscolossal.com | Arte e cultura visiva |
| PetaPixel | https://petapixel.com | Rivista di fotografia |
| Il Fotografo | https://www.ilfotografo.it | Rivista di fotografia |
| Fotografia Artistica | https://www.fotografiaartistica.it | Rivista di fotografia |
| Il Mattino | https://www.ilmattino.it | Quotidiano di Napoli |
| NapoliToday | https://www.napolitoday.it | Cronaca di Napoli e provincia |
| Il Roma | https://www.ilroma.net | Quotidiano di Napoli |
| Internapoli | https://www.internapoli.it | Cronaca di Napoli e area nord |
| Il Mediano | https://www.ilmediano.com | Area nord di Napoli |
| Metropolis | https://www.metropolisweb.it | Area vesuviana e stabiese |
| Vesuvio Live | https://www.vesuviolive.it | Area vesuviana e Napoli |
| Il Fatto Vesuviano | https://www.ilfattovesuviano.it | Area vesuviana |
| Il Golfo 24 | https://www.ilgolfo24.it | Ischia e Procida |
| Capri Press | https://www.capripress.com | Capri |
| Sorrento Press | https://www.sorrentopress.it | Penisola sorrentina |
| Positano News | https://www.positanonews.it | Penisola sorrentina e costiera |
| Il Napolista | https://www.ilnapolista.it | Il Napoli e il calcio |
