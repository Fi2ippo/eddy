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
