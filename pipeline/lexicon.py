"""Lessico della redazione automatica di Eddy: parole vuote, temi, dossier, filtri.

Tutte le espressioni lavorano su testo normalizzato (minuscolo, senza accenti, apostrofi
sostituiti da spazi). I temi hanno termini italiani e, come riserva quando la traduzione
non è disponibile, inglesi, francesi, tedeschi e spagnoli.
"""
import re
from collections import Counter
import unicodedata


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode('ascii').lower()
    s = re.sub(r"[’'`´]", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


STOP = {
    'it': set('''a ad al allo ai agli all agl alla alle con col coi da dal dallo dai dagli dall dagl dalla dalle di del dello dei
degli dell degl della delle in nel nello nei negli nell negl nella nelle su sul sullo sui sugli sull sugl sulla sulle per tra fra
il lo la i gli le l un uno una un e ed o od ma se che chi cui non piu meno come dove quando perche anche ancora gia solo poi
oggi ieri domani dopo prima mentre senza sotto sopra verso contro fino ecco cosi tutto tutti tutta tutte ogni altro altri altra
altre questo questa questi queste quello quella quelli quelle suo sua suoi sue loro mio mia nostro nostra vostro essere e stato
stata stati state sono sara era erano ha hanno ho abbiamo avere aveva fa fanno fare fatto detto dice dicono puo possono deve
devono vuole vogliono viene vengono va vanno nuovo nuova nuovi nuove grande grandi primo prima secondo molto molti poco ci si
vi ne lui lei noi voi essi esse tra sui nel ad mai sempre ora qui li la cosa cose anni anno giorno giorni ore ora volta volte
dei degli sullo all alla ecco via due tre quattro cinque sei sette otto nove dieci mila milioni miliardi euro dollari per cento
italia italiano italiana italiani italiane news ultima ultime ultim notizia notizie video foto live diretta oggi'''.split()),
    'en': set('''a an the and or but if of to in on at by for with from as is are was were be been being has have had do does did
not no yes this that these those it its he she they them his her their we our you your i me my will would can could should may
might must shall into over after before about than then there here what which who whom whose when where why how all any each
more most other some such only own same so too very just also new says said say up out off down amid via vs year years day
days week time first two three one news live update updates video photos watch'''.split()),
    'fr': set('''le la les un une des du de d l et ou mais en dans sur sous pour par avec sans au aux ce cette ces qui que quoi
dont ou est sont ete etre a ont avait il elle ils elles on nous vous leur leurs son sa ses plus moins pas ne se s n y comme
apres avant selon entre deux trois nouveau nouvelle direct video'''.split()),
    'de': set('''der die das den dem des ein eine einer eines einem einen und oder aber in im an am auf aus bei mit nach von vor
zu zum zur fur ist sind war waren wird werden hat haben nicht kein keine sich er sie es wir ihr ihre sein seine als auch noch
nur so wie was wer wo wenn dass uber unter gegen durch neue neuer neues zwei drei jahr jahre live video'''.split()),
    'es': set('''el la los las un una unos unas de del al y o pero en con sin por para sobre entre tras desde hasta que quien
cual como donde cuando es son fue fueron ser esta estan ha han se su sus lo le les no mas menos muy ya nuevo nueva dos tres ano
anos directo video'''.split()),
    'nl': set('de het een en of maar in op aan met van voor naar bij uit is zijn was waren wordt worden heeft hebben niet geen ook nog als dat die wat wie'.split()),
    'pt': set('o a os as um uma de do da dos das e ou mas em no na nos nas com sem por para sobre que quem como onde quando e sao foi ser esta se seu sua nao mais'.split()),
}
ALLSTOP = set().union(*STOP.values())

# parole con la maiuscola che non sono nomi propri (inizio frase, titoli di rubrica, mesi)
CAPSTOP = set(norm(x) for x in '''Il Lo La I Gli Le L Un Uno Una E Ed O Ma Se Che Chi Cui Non Come Dove Quando Perché Anche Ecco Così
Oggi Ieri Domani Dopo Prima Mentre Ultim Ultima Ultime Ora Live Video Foto Diretta Breaking News Esclusivo Intervista Analisi
Commento Opinione Editoriale Lettere Podcast Newsletter Gallery Fotogallery Speciale Focus Report Dossier Inchiesta
Lunedì Martedì Mercoledì Giovedì Venerdì Sabato Domenica Gennaio Febbraio Marzo Aprile Maggio Giugno Luglio Agosto
Settembre Ottobre Novembre Dicembre The A An In On At For With From By Of To And Or But How Why What When Where Who
Is Are Was Were Will Can New Live Watch Opinion Analysis Review Exclusive Monday Tuesday Wednesday Thursday Friday
Saturday Sunday January February March April May June July August September October November December Le Les Des Du
Der Die Das Den Dem Ein Eine El Los Las Del Al Per Con Da Di Del Della Dei Degli Nel Nella Su Sul Sulla Tra Fra
Secondo Dopo Verso Contro Senza Sotto Sopra Tutti Tutto Questo Questa Quello Quella Nuovo Nuova Grande Primo Prima'''.split())

# ------------------------------------------------------------------ temi
# peso 3: termine quasi univoco; peso 2: forte; peso 1: indizio.
T = {}
T['italia'] = [
    (3, r'meloni|schlein|salvini|tajani|giorgetti|crosetto|piantedosi|nordio|valditara|lollobrigida|santanche|urso\b|pichetto|calderoli|casellati|abodi|musumeci|ciriani|fazzolari|donzelli|bignami|giuseppe conte|renzi|calenda|bonelli|fratoianni|vannacci|elly schlein'),
    (3, r'mattarella|quirinale|palazzo chigi|montecitorio|palazzo madama|consiglio dei ministri|fratelli d italia|forza italia|partito democratico|movimento 5 stelle|alleanza verdi|italia viva|lega di salvini|premierato|autonomia differenziata|separazione delle carriere'),
    (2, r'governo|premier|ministr[oa]|ministero|parlamento|camera dei deputati|\bsenato\b|senator|deputat|maggioranza|opposizion|decreto|\bddl\b|disegno di legge|emendament|legge di bilancio|manovra|referendum|elezioni regional|regionali|amministrative|consiglio regionale|governator|\bcorte dei conti\b|consulta\b|corte costituzionale|\bcsm\b'),
    (1, r'partit[oi]|politic|leader|segretari[oa]|centrodestra|centrosinistra|sinistra|destra|coalizion|voto|elettor|sondagg|fiducia|question time|prefett|sindac[oa]'),
]
T['mondo'] = [
    (3, r'trump|putin|zelensk|netanyahu|xi jinping|macron|merz\b|starmer|pedro sanchez|von der leyen|erdogan|narendra modi|lula\b|milei|orban|kim jong|khamenei|pezeshkian|mark carney|guterres|rutte\b|kallas|vance\b|rubio\b|hegseth|leavitt|lavrov|peskov|witkoff|kushner'),
    (3, r'casa bianca|white house|cremlino|kremlin|\bonu\b|nazioni unite|united nations|\bnato\b|unione europea|commissione europea|european union|european commission|eliseo|downing street|pentagono|pentagon|dipartimento di stato|state department|\bg7\b|\bg20\b|brics'),
    (2, r'ucrain|ukrain|russi|gaza|israel|hamas|hezbollah|libano|lebanon|iran\b|irania|siria|syria|iraq|yemen|houthi|cina\b|china|cinese|chinese|taiwan|giappon|japan|corea|korea|india\b|indian|pakistan|afghanistan|turchia|turkey|turkish|egitto|egypt|libia|libya|tunisia|sudan|congo|nigeria|etiopia|venezuela|messico|mexico|brasil|argentin|canada|australia|stati uniti|united states|america|washington|mosca|moscow|kiev|kyiv|pechino|beijing|teheran|tehran|gerusalemme|jerusalem|francia|france|french|germania|germany|german|regno unito|britain|british|londra|london|parigi|paris|berlino|berlin|spagna|spain|spanish|polonia|poland|ungheria|hungary|grecia|greece|serbia|kosovo|bielorussia|belarus|moldavia|georgia\b|armenia|azerbaigian|cisgiordania|west bank|bruxelles|brussels|palestin'),
    (2, r'guerra|war\b|conflitt|cessate il fuoco|ceasefire|tregua|negoziat|diplomazi|ambasciat|sanzion|sanctions|missil|missile|droni?\b|drones?\b|bombardament|attacco aereo|airstrike|raid\b|esercito|army|militar|military|truppe|troops|ostagg|hostage|profughi|refugee|colpo di stato|coup\b'),
    (1, r'presidente|elezioni|election|governo|government|primo ministro|prime minister|cancelliere|chancellor|parlament|vertice|summit|accordo|treaty|trattato|frontiera|border|confine'),
]
T['economia'] = [
    (3, r'\bpil\b|\bgdp\b|inflazion|inflation|\bbce\b|\becb\b|\bfed\b|federal reserve|spread\b|piazza affari|ftse|wall street|dow jones|nasdaq|s&p 500|in borsa|borse (europee|asiatiche|ue)|la borsa di|borsa di (milano|tokyo|londra|francoforte|parigi|new york)|stock market|\bistat\b|eurostat|\bfmi\b|\bimf\b|fondo monetario|tassi di interesse|interest rates?|\bbtp\b|titoli di stato'),
    (2, r'econom|mercat|markets?\b|aziend|impres|compan|industri|fatturat|ricavi|revenue|utile netto|utili|profit|perdite|bilanc|debito|debt|deficit|tasse|fiscal|fisco|irpef|\biva\b|\btax|pension|salari|stipend|wages?\b|lavorator|occupazion|disoccupazion|unemployment|\bjobs?\b|sindacat|trade union|sciopero|strike\b|banca|banche|\bbanks?\b|finanz|invest|dazi|tariff|export|import|commerci|trade\b|prezzi|prices|bollett|petrolio|\boil\b|\bgas\b|acquisizion|acquisition|fusione|merger|\bipo\b|startup|bonus|incentiv|consum|retail|vendite|sales\b|immobil|mutu[oi]|criptovalut|bitcoin|crypto|rendiment|\bopa\b|\bops\b|offerta pubblica|carburant|benzina|gasolio|price cap|caro prezzi|caro vita|caro energia'),
    (1, r'euro\b|dollar|miliard|milion|billion|million|crescita|growth|crisi|\bceo\b|amministratore delegato|manager|\bcda\b|piano industriale|stabiliment|fabbrica|plant\b|factory|supply chain|energia|energy'),
]
T['cronaca'] = [
    (3, r'terroris|omicidi|uccis|femminicid|assassin|accoltell|sparator|sparat|rapin|stupr|violenza sessuale|arrestat|arresto|carabinier|polizia|questura|guardia di finanza|procura|pubblico ministero|\bgip\b|indagat|inchiesta|indagin|processo|condann|sentenza|ergastolo|tribunale|cassazione|mafia|camorra|ndrangheta|cosca|spaccio|droga|narcotraffic|truffa|riciclaggio|corruzion|tangent|evasione fiscale|sequestr|scompars|cadavere|corpo senza vita'),
    (2, r'incidente|schianto|scontro frontale|travolt|investit|morto|morta|morti|feriti|ferito|ferita|vittim|incendi|rogo|esplosion|crollo|crollat|frana|alluvion|maltempo|nubifragi|esondaz|allerta meteo|terremoto|scossa|sisma|soccors|vigili del fuoco|annegat|dispers|aggression|aggredit|furto|ladri|baby gang|bullismo|carcere|detenut|evaso|fermat[oi]'),
    (1, r'vicenda|caso\b|famiglia|giovane|ragazz[oa]|anzian|bambin|madre|padre|figli[oa]|denunc|testimon|cronaca|quartiere|frazione'),
]
T['scienza'] = [
    (3, r'scienziat|scientist|ricercator|researchers?\b|astronom|astrofisic|telescopi|telescope|\bnasa\b|\besa\b|\binaf\b|\bcern\b|\binfn\b|spazio\b|space\b|spacecraft|sonda|probe\b|orbita|orbit|satellit|razzo|rocket|artemis|spacex|starship|astronaut|marte\b|mars\b|lunar|\bmoon\b|asteroid|comet|galass|galax|buco nero|black hole|esopianet|exoplanet|pianet|planet|supernova|universo|universe|cosmo\b|cosmic|dinosaur|fossil|paleontolog|archeolog|archaeolog|genoma|genome|\bdna\b|quantist|quantum|particell|particle|biolog|neuroscien|matematic|mathemat|nobel per la (fisica|chimica)'),
    (2, r'studio pubblicato|pubblicato su|pubblicata su|ricerca|research|scoperta|discovery|scopert|esperimento|experiment|laboratorio|laboratory|universita|university|cellul|molecol|proteina|protein|batteri|bacteria|ecosistem|oceano|ocean|vulcan|volcano|ghiacci|glacier|antartide|antarctic|artico|arctic|specie|species|evoluzion|evolution|fisica|physics|chimica|chemistry|luna\b'),
    (1, r'studio|study|dati|analisi|modello|teoria|theory|misur|osservazion|observation'),
]
T['salute'] = [
    (3, r'medic|ospedal|hospital|malatti|disease|tumor|tumour|cancro|cancer|oncolog|cardiac|cardiolog|cardiovascol|ictus|stroke|diabet|vaccin|virus|viral|antibiotic|pazient|patient|farmac|\bdrugs?\b|terapi|therap|chirurg|surgery|sanita|sanitari|healthcare|health|salute|\boms\b|world health organization|epidemi|pandemi|covid|influenza|morbillo|measles|alzheimer|demenza|dementia|parkinson|obesit|nutrizion|depressione|depression|salute mentale|mental health|\bssn\b|pronto soccorso|liste d attesa|\basl\b|\baifa\b|\bema\b|\bfda\b|trial clinic|clinical trial|sperimentazione clinica'),
    (2, r'cervell|brain|neuron|nervos|cuore|heart|sonno|sleep|ansia\b|anxiety|dieta|diet\b|infezion|infection|sintom|symptom|diagnos|trattament|treatment|prevenzion|screening|gravidanz|pregnan|neonat|invecchiament|aging|ageing|fumo|smoking|alcol|alcohol|attivita fisica|exercise'),
    (1, r'rischio|risk|benessere|wellbeing|corpo|body|sangue|blood'),
]
T['tech'] = [
    (3, r'intelligenza artificiale|artificial intelligence|openai|chatgpt|\bgpt|anthropic|claude\b|gemini|copilot|\bllm|chatbot|deepseek|mistral ai|nvidia|semicondutt|semiconductor|\bchips?\b|microchip|tsmc|smartphone|iphone|android|\bapps?\b|software|hardware|cyber|hacker|ransomware|malware|attacco informatico|cyberattack|data breach|violazione dei dati|cloud\b|data center|datacenter|algoritm|algorithm|robot|quantum computing|computer quantistic|silicon valley|big tech|meta platforms|facebook|instagram|whatsapp|tiktok|youtube|google|alphabet|apple\b|microsoft|amazon\b|\baws\b|samsung|huawei|xiaomi|musk|zuckerberg|altman|bezos|starlink|\b5g\b|\b6g\b|videogioc|videogame|video game|console|playstation|xbox|nintendo|blockchain'),
    (2, r'tecnolog|technolog|internet|online|social network|social media|piattaform|platform|dispositiv|device|computer|\bpc\b|laptop|tablet|schermo|display|dati personali|privacy|antitrust|\bdma\b|\bdsa\b|ai act|digital|fibra|banda larga|broadband'),
    (1, r'innovazion|innovation|utenti|users|account|password|rete\b|network|sito|web\b'),
]
T['clima'] = [
    (3, r'clima\b|climat|riscaldamento globale|global warming|cambiamento climatico|climate change|emission|\bco2\b|anidride carbonica|carbon dioxide|carbonio|carbon\b|gas serra|greenhouse|cop2\d|cop3\d|accordo di parigi|paris agreement|rinnovabil|renewable|fotovoltai|solar\b|eolic|wind power|wind farm|transizione energetica|energy transition|decarbonizz|net zero|siccita|drought|ondata di calore|heatwave|heat wave|caldo record|record heat|ghiacciai|glaciers|melting|innalzamento del mare|sea level|deforestaz|deforestation|biodiversit|estinzion|extinction|inquinament|pollution|smog|plastica|ambiental|environment'),
    (2, r'alluvion|flood|uragano|hurricane|tifone|typhoon|ciclone|cyclone|incendi boschiv|wildfire|maltempo|eventi estremi|extreme weather|temperatur|meteo|ambiente|energia pulita|clean energy|idrogeno verde|green hydrogen|energia nucleare|nuclear power|carbone|\bcoal\b|greenpeace|legambiente|\bwwf\b|solare'),
    (1, r'natura|nature|foreste|forest|acqua|water'),
]
T['cultura'] = [
    (3, r'libro|libri|\bbooks?\b|romanz|\bnovel\b|scrittor|writer|poet|poesi|letteratur|literature|casa editrice|museo|musei|museum|mostra\b|exhibition|\barte\b|artist|pittor|painter|scultur|sculpt|archeolog|patrimonio|heritage|unesco|biennale|premio strega|nobel per la letteratura|nobel per la pace|filosof|philosoph|historian|teatro|theatre|theater|opera lirica|balletto|ballet|biblioteca|library|scuola|scuole|school|studenti|students|insegnant|teachers|istruzione|education|maturita|pontefic|\bpope\b|vatican|vescov|bishop|religion|giubileo|leone xiv'),
    (2, r'cultur|culture|festival|premio|award|anniversario|anniversary|memoria|societa|society|giovani|youth|generazion|generation|famigli|family|donne|women|diritti|rights|lgbt|immigrazion|immigration|migranti|migrants|poverta|poverty|disuguaglian|inequality|volontariat|volunteer|universita|chiesa|church|fede\b|lingua'),
    (1, r'storia|history|tradizion|tradition|comunita|community'),
]
T['sport'] = [
    (3, r'calcio|football|soccer|serie a\b|serie b\b|champions league|europa league|conference league|premier league|\bliga\b|bundesliga|ligue 1|scudetto|\bgol\b|goal\b|allenator|\bcoach\b|mister\b|juventus|\bjuve\b|inter\b|\bmilan\b|atalanta|fiorentina|real madrid|barcellona|barcelona|manchester united|manchester city|chelsea|arsenal|bayern|\bpsg\b|azzurri|azzurre|mondiali|world cup|europei|uefa|fifa|\bvar\b|tennis|sinner|alcaraz|djokovic|musetti|paolini|\batp\b|\bwta\b|wimbledon|roland garros|australian open|davis cup|coppa davis|basket|\bnba\b|eurolega|pallavolo|volley|rugby|sei nazioni|ciclismo|cycling|giro d italia|tour de france|vuelta|pogacar|nuoto|swimming|atletica|athletics|olimpiad|olympic|paralimpi|paralympic|sci alpino|skiing|\bgolf\b|boxe|boxing|\bmma\b|\bufc\b|scherma|fencing|pallanuoto|sport\b|sportiv|stadio|stadium|tifos|ultras|calciomercato'),
    (2, r'partita|\bmatch\b|campionato|championship|classifica|standings|vittoria|victory|sconfitta|defeat|pareggio|finale|semifinale|torneo|tournament|squadra|giocator|player|atlet|athlete|medaglia|medal|record\b|titolo mondiale|maglia|trasferta|derby|\bgara\b|rigore|panchina'),
    (1, r'vince|vincono|perde|batte|beats|sfida|coppa|\bcup\b|punti|points'),
]
T['motori'] = [
    (3, r'yacht|superyacht|megayacht|motoryacht|nautica|nautico|nautici|nautiche|da diporto|cantiere navale|cantieri navali|cantiere nautico|cantieri nautici|salone nautico|boat show|motoscafo|gommone|gommoni|catamaran|barca a vela|barche a vela|barca a motore|barche a motore|sailing yacht|motor yacht|powerboat|ferretti|azimut|benetti|sanlorenzo|riva yacht|perini navi|baglietto|wally|sunseeker|princess yachts|beneteau|jeanneau|feadship|lurssen|america s cup|luna rossa|sailgp|vendee globe|regata|regate'),
    (3, r'\bauto\b|automobil|vettur|\bsuv\b|berlina|utilitaria|crossover|\bcars?\b|auto elettric|electric vehicle|\bevs?\b|auto ibrid|plug-in|colonnin|guida autonoma|self-driving|autonomous driving|robotaxi|formula 1|formula one|\bf1\b|gran premio|grand prix|\bgp\b|motogp|superbike|\bsbk\b|\bwec\b|le mans|indycar|nascar|pole position|ferrari|maranello|stellantis|\bfiat\b|alfa romeo|lancia ypsilon|maserati|lamborghini|ducati|aprilia|piaggio|vespa|tesla|\bbyd\b|volkswagen|\bvw\b|\baudi\b|\bbmw\b|mercedes|porsche|renault|peugeot|citroen|toyota|honda|nissan|hyundai|\bkia\b|\bford\b|general motors|volvo|\bjeep\b|dacia|skoda|cupra|polestar|rivian|verstappen|leclerc|lewis hamilton|lando norris|piastri|george russell|kimi antonelli|sainz|alonso|bagnaia|marquez|bezzecchi|bastianini|bulega|toprak|\bmoto\b|motocicl|motorcycle|scooter|codice della strada|patente|autostrad|motorway|casello|pedaggi|immatricolazion|concessionar'),
    (2, r'pilota|piloti|circuito|circuit|pit stop|gomme|tyres|tires|mondiale piloti|costruttori|constructors|batteria|battery|cavalli vapore|horsepower|velocita|speed|mobilita|mobility|parcheggi|parking|motore|motori|engine|elettrica|elettriche|ricarica|charging|qualifiche|qualifying|rally'),
    (1, r'modello|lancio|launch|versione|prova|test drive|review|benzina|gasolio|diesel|carburant|barca|barche|imbarcazion|scafo|\bboat|velist'),
]
T['spettacoli'] = [
    (3, r'\bfilm\b|cinema|movie|serie tv|tv series|netflix|disney\+|prime video|\bhbo\b|attor|\bactor|actress|attrice|regist[ai]\b|film director|hollywood|oscar|golden globe|emmy|festival di venezia|mostra del cinema|cannes|berlinale|box office|botteghino|cantant|singer|rapper|trapper|\bband\b|concert|album|canzon|\bsong\b|sanremo|eurovision|x factor|musica|\bmusic\b|discograf|spotify|grammy|televisione|programma tv|conduttor|presentatr|reality|grande fratello|ballando con le stelle|gossip|celebrity|\bvip\b|influencer|ferragni|royal family|famiglia reale|fumett|\bcomics?\b|manga'),
    (2, r'spettacol|\bshow\b|episodi|episode|trailer|debutto|premiere|red carpet|\bstar\b|divo|diva|\bfans?\b|biglietti|tickets|principe|principessa|prince\b|princess|\btv\b|\btour\b'),
    (1, r'evento|event|serata|ospite|guest|stagione|season'),
]
# sigle da sciogliere prima della normalizzazione (solo testo italiano, sensibile alle maiuscole)
EXPAND_IT = [
    (re.compile(r'\b(?:USA|Usa)\b'), 'Stati Uniti'), (re.compile(r'\bUS\b(?! Open)'), 'Stati Uniti'),
    (re.compile(r'\b(?:UE|Ue)\b'), 'Unione europea'), (re.compile(r'\b(?:IA|AI)\b'), 'intelligenza artificiale'),
    (re.compile(r'\b(?:PD|Pd)\b'), 'Partito democratico'), (re.compile(r'\b(?:M5S|M5s)\b'), 'Movimento 5 Stelle'),
    (re.compile(r'\b(?:FdI|Fdi|FDI)\b'), "Fratelli d'Italia"), (re.compile(r'\b(?:Avs|AVS)\b'), 'Alleanza Verdi'),
    (re.compile(r'\b(?:F1)\b'), 'Formula 1'), (re.compile(r'\b(?:Gp|GP)\b'), 'Gran Premio'),
    (re.compile(r'\bPapa\b'), 'pontefice'), (re.compile(r'\b(?:Ue|UE)\b'), 'Unione europea'),
]
EXPAND_ANY = [(re.compile(r'\b(?:EU)\b'), 'European Union'), (re.compile(r'\bA\.?I\.?(?=\s|$|[,.:;])'), 'artificial intelligence'),
              (re.compile(r'\bU\.S\.'), 'United States')]


# ------------------------------------------------------------------ Roma e provincia
# zone della città metropolitana (testo normalizzato: minuscole, senza accenti, apostrofi = spazio)
ZONE_LABEL = {'citta': 'Roma', 'castelli': 'Castelli Romani', 'litorale': 'Litorale', 'nord': 'Nord e lago di Bracciano', 'est': 'Tivoli e area est'}
ZONE_WORDS = {
    'citta': (
        'campidoglio|roma capitale|assemblea capitolina|giunta capitolina|sindaco di roma|comune di roma|municipio [ivx]{1,4}|municipio \\d{1,2}|'
        'trastevere|testaccio|garbatella|ostiense|san lorenzo|pigneto|centocelle|tor bella monaca|torpignattara|tor pignattara|quarticciolo|primavalle|'
        'monteverde|parioli|montesacro|monte sacro|talenti|tufello|san basilio|casal bruciato|pietralata|ponte mammolo|rebibbia|cinecitta|quadraro|tuscolano|'
        'eur|laurentino|spinaceto|torrino|magliana|corviale|portuense|trullo|boccea|balduina|monte mario|trionfale|prima porta|labaro|ottavia|torrevecchia|'
        'casalotti|tor vergata|torre angela|torre maura|giardinetti|borghesiana|ponte di nona|lunghezza|settecamini|bufalotta|fidene|nuovo salario|esquilino|'
        'aventino|nomentano|vigna clara|ponte milvio|tor di quinto|grottarossa|colosseo|fori imperiali|piazza venezia|stazione termini|villa borghese|gianicolo|'
        'tor sapienza|casilino|prenestino|alessandrino|quarto miglio|romanina|anagnina|tor tre teste|piazza di spagna|fontana di trevi|circo massimo|tiburtino|'
        'appio latino|san giovanni in laterano|piazza san giovanni|raccordo anulare|grande raccordo|gra|tangenziale est|metro a|metro b|metro c|'
        'metropolitana di roma|atac|ama roma|polizia locale di roma|vigili urbani di roma|policlinico umberto i|policlinico casilino|piazzale clodio|'
        'colli portuensi|collatino|quartiere africano|ponte galeria|casal de pazzi|val melaina|serpentara|appio claudio|gianicolense|bravetta|massimina|'
        'casetta mattei|tor marancia|cecchignola|vitinia|mostacciano|castel di leva|castel giubileo|settebagni|castel fusano|centro giano|madonnetta|'
        'dragoncello|villa gordiani|casal bertone|portonaccio|tor de schiavi|tor cervara|quartiere trieste|quartiere prati|rione monti|pinciano|'
        'villaggio olimpico|tor di valle|casal monastero|case rosse|castelverde|colle salario|vigne nuove|porta di roma|la rustica|torre spaccata|'
        'torrenova|osteria del curato|capannelle|appio pignatelli|casal morena|caffarella|tor de cenci|malafede|giardino di roma|ostia ponente|'
        'ostia levante|la giustiniana|olgiata|santa maria di galeria|isola farnese|saxa rubra|valle aurelia|borgo pio|campo de fiori|ghetto ebraico|'
        'centro storico di roma|periferia di roma|periferie romane|teatro valle|teatro argentina|teatro dell opera di roma|auditorium parco della musica|'
        'festa del cinema di roma|festa cinema roma|maxxi|palazzo delle esposizioni|biblioteche di roma'),
    'castelli': (
        'frascati|grottaferrata|marino|castel gandolfo|albano laziale|albano|ariccia|genzano|nemi|lanuvio|velletri|lariano|rocca di papa|rocca priora|'
        'monte porzio catone|monte compatri|montecompatri|colonna|ciampino|castelli romani|pavona|cecchina|frattocchie|santa maria delle mole|campoleone|'
        'lago albano|lago di nemi|artemisio|ospedale dei castelli|asl roma 6|nettunense|appia nuova|via dei laghi|tuscolana'),
    'litorale': (
        'ostia|lido di ostia|ostia antica|acilia|infernetto|casal palocco|dragona|fiumicino|fregene|focene|maccarese|passoscuro|torrimpietra|isola sacra|'
        'torvaianica|pomezia|santa palomba|ardea|tor san lorenzo|anzio|lavinio|nettuno|ladispoli|cerveteri|santa marinella|santa severa|civitavecchia|'
        'municipio x|litorale romano|litorale laziale|via del mare|pontina|asl roma 3|asl roma 4|allumiere|tolfa'),
    'nord': (
        'bracciano|anguillara|trevignano|manziana|canale monterano|oriolo romano|campagnano|formello|sacrofano|morlupo|rignano flaminio|'
        'castelnuovo di porto|riano|fiano romano|capena|sant oreste|cesano|la storta|lago di bracciano|cassia bis|braccianese|magliano romano|'
        'mazzano romano|nazzano|torrita tiberina|filacciano|ponzano romano|civitella san paolo|nerola|moricone|montelibretti|monteflavio|montorio romano'),
    'est': (
        'tivoli|guidonia|montecelio|setteville|villalba di guidonia|monterotondo|mentana|fonte nuova|tor lupara|palombara sabina|marcellina|subiaco|'
        'vicovaro|valle dell aniene|villa adriana|bagni di tivoli|colleferro|valmontone|palestrina|zagarolo|san cesareo|gallicano nel lazio|labico|artena|'
        'genazzano|olevano romano|castel madama|san polo dei cavalieri|sant angelo romano|asl roma 5|carpineto romano|segni|gavignano|montelanico|'
        'gorga|rocca di cave|capranica prenestina|cave|poli|casape|san gregorio da sassola|arsoli|agosta|anticoli corrado|cervara di roma|jenne|'
        'vallepietra|licenza|roviano|riofreddo|cineto romano|sambuci|saracinesco|ciciliano|pisoniano|bellegra|rocca santo stefano|roiate|affile|'
        'arcinazzo romano|percile|mandela|vivaro romano|vallinfreda|camerata nuova|marano equo|canterano|rocca canterano|cerreto laziale|gerano'),
}
ZONE_RX = {z: re.compile(r'\b(?:' + w + r')\b') for z, w in ZONE_WORDS.items()}
# segni certi di cronaca romana anche in una testata nazionale (niente nomi che sono anche cognomi, pianeti o parole comuni)
_AMBIGUI = {'marino', 'albano', 'colonna', 'nettuno', 'mentana', 'artena', 'romani', 'tuscolana', 'pontina', 'eur', 'gra', 'ostiense', 'trionfale',
            'riano', 'cesano', 'labico', 'fondi', 'lunghezza', 'ottavia', 'talenti', 'sora', 'segni', 'cave', 'poli', 'licenza', 'mandela', 'agosta',
            'gorga', 'gerano', 'tolfa',
            # eventi di richiamo nazionale: la copertura delle testate nazionali non è cronaca locale
            'festa del cinema di roma', 'festa cinema roma',
            # monumenti: compaiono anche nei documentari e nella storia antica, non sono cronaca locale
            'colosseo', 'fori imperiali', 'piazza venezia', 'villa borghese', 'gianicolo', 'piazza di spagna', 'fontana di trevi', 'circo massimo',
            'san giovanni in laterano', 'piazza san giovanni'}
_FORTI = [x for w in ZONE_WORDS.values() for x in w.split('|') if x not in _AMBIGUI]
_FORTI += ['regione lazio', 'consiglio regionale del lazio', 'citta metropolitana di roma', 'provincia di roma', 'asl roma \\d', 'questura di roma',
           'prefettura di roma']
ROMA_STRONG = re.compile(r'\b(?:' + '|'.join(sorted(_FORTI, key=len, reverse=True)) + r')\b')
ROMA_DATELINE = re.compile(r'^roma\b')
ROMA_ANY = re.compile(r'\broma\b|\blazio\b')
ZONE_ANY = re.compile(r'\b(?:' + '|'.join(ZONE_WORDS.values()) + r')\b')
# altre province del Lazio: fuori dalla sezione (niente parole comuni come «fondi», «cori», «piglio»)
OTHER_LAZIO = re.compile(r'\b(?:(?<!america )(?<!lingua )latina|aprilia|cisterna di latina|sermoneta|sezze|priverno|sonnino|pontinia|sabaudia|san felice circeo|circeo|'
                         r'terracina|monte san biagio|sperlonga|itri|formia|gaeta|minturno|ponza|ventotene|agro pontino|pontino|frosinone|ciociaria|cassino|anagni|'
                         r'alatri|ferentino|ceccano|veroli|fiuggi|isola del liri|arpino|pontecorvo|ceprano|paliano|roccasecca|viterbo|tuscia|civita castellana|'
                         r'tarquinia|montalto di castro|vetralla|ronciglione|sutri|nepi|bolsena|montefiascone|tuscania|rieti|reatino|reatina|fara in sabina|'
                         r'poggio mirteto|cittaducale|amatrice|leonessa)\b')

# sport: nella cronaca locale restano solo le piccole squadre del territorio
SPORT_CTX = re.compile(r'\b(?:calci[oa]\b|calciator|gol\b|partit[ae]\b|campionat|allenator|mister\b|serie [abcd]\b|eccellenza|prima categoria|'
                       r'seconda categoria|terza categoria|juniores|basket|pallacanestro|volley|pallavolo|rugby|tennis|atletica|maratona|giocator|classifica|'
                       r'trasferta|derby|scudetto|champions|calciomercato|tifos|ultras|nuoto|pallanuoto|ciclismo|playoff|play off|coppa\b)')
# solo nomi che non sono anche città (Napoli, Torino, Como... compaiono nella cronaca e nelle trasferte delle squadre minori)
BIG_SPORT = re.compile(r'\b(?:as roma|ss lazio|(?:la|alla|della|dalla|nella|sulla|per la|con la|contro la) (?:roma|lazio)\b(?! (?:city|calcio a 5|c5))|'
                       r'gialloross[oi]|biancocelest[ei]|trigoria|stadio olimpico|all olimpico|derby della capitale|derby capitolino|serie a\b|serie a1|'
                       r'superlega|champions|europa league|conference league|coppa italia|supercoppa|nazionale italiana|la nazionale|azzurri|olimpiadi|'
                       r'olimpiade|juventus|juve|inter|milan|atalanta|fiorentina|genoa|udinese|hellas|sinner|internazionali d italia|foro italico|atp|wta|'
                       r'formula 1|f1|motogp|giro d italia|sei nazioni|nba|eurolega)\b')


# segni che bastano da soli (la squadra, il campionato maggiore) e contesto da squadra per «Roma, ...» / «Lazio, ...» in apertura
TEAM_RX = re.compile(r'\b(?:as roma|ss lazio|(?:la|alla|della|dalla|nella|sulla|per la|con la|contro la) lazio\b|gialloross[oi]|biancocelest[ei]|'
                     r'derby della capitale|derby capitolino|serie a\b|serie a1|champions league|europa league|conference league|calciomercato|scudetto)')
TEAM_CTX = re.compile(r'\b(?:calci[oa]\b|calciator|gol\b|partit[ae]\b|campionat|allenator|mister\b|serie [abcd]\b|giocator|trasferta|derby|tifos|ultras|'
                      r'playoff|convocat)')
_TEAM_LEAD = re.compile(r'(?:roma|lazio)\b')


def big_sport(nt):
    if TEAM_RX.search(nt) or (SPORT_CTX.search(nt) and BIG_SPORT.search(nt)):
        return True
    return bool(_TEAM_LEAD.match(nt) and TEAM_CTX.search(nt))


# temi nazionali e globali: governo, politica estera, televisione nazionale
_NAT = [rx for w, rx in T['italia'] + T['mondo'] if w >= 3] + [T['mondo'][2][1]]
NATIONAL_RX = re.compile(r'\b(?:' + '|'.join(_NAT) + r'|governo\b|ministr[oaie]\b|ministero|parlamento|senato\b|camera dei deputati|manovra\b|'
                         r'legge di bilancio|premier\b|unione europea|commissione europea|rai ?[123]\b|canale 5|italia 1\b|rete 4|la7\b|tv8\b|verissimo|'
                         r'domenica in\b|porta a porta|ballando con le stelle|grande fratello|uomini e donne|x factor|sanremo|in tv\b|prima serata)')


def _national(nt):
    # i luoghi di Roma con nomi stranieri («piazza di Spagna») non fanno notizia nazionale
    return bool(NATIONAL_RX.search(ZONE_ANY.sub(' ', nt)))


def is_local_text(nt, mode='local'):
    """nt: titolo e sommario normalizzati. mode: 'pure' testata solo locale o rubrica Roma di una nazionale (basta che non parli
    d'altro); 'local' testata che rilancia anche agenzie nazionali (serve un luogo della provincia o «Roma»);
    'mixed' testata anche nazionale (servono segni certi)."""
    if big_sport(nt):
        return False
    if ROMA_STRONG.search(nt):
        return True
    if OTHER_LAZIO.search(nt) or _national(nt):
        return False
    if mode == 'mixed':
        return bool(ROMA_DATELINE.search(nt))
    if mode == 'pure':
        return True
    return bool(ZONE_ANY.search(nt) or ROMA_ANY.search(nt))


def story_local(headline, titles, n_loc, n_nat, foreign=False):
    """Storia di cronaca locale? headline/titles: testo normalizzato; n_loc/n_nat: testate locali e nazionali che la raccontano.
    Le voci locali hanno già passato is_local_text: qui conta chi altro ne parla."""
    txt = headline + ' . ' + titles
    if big_sport(txt):
        return False
    strong_h = bool(ROMA_STRONG.search(headline))
    if not n_nat:
        return n_loc > 0
    if not strong_h and (foreign or _national(headline)):
        return False
    if not n_loc:
        return strong_h and n_nat <= 3
    # con testate nazionali di mezzo il luogo deve stare nel titolo della storia, non solo in qualche voce
    if strong_h or ROMA_ANY.search(headline) or ZONE_ANY.search(headline):
        return True
    return n_loc >= n_nat


def zone_of(texts, default=None):
    """texts: [(testo normalizzato, peso)]. Zona con più riscontri; a parità vince quella della testata."""
    sc = Counter()
    for t, w in texts:
        for z, rx in ZONE_RX.items():
            n = len({m.group(0) for m in rx.finditer(t)})
            if n:
                sc[z] += w * n
    if default:
        sc[default] += 0.5
    return sc.most_common(1)[0][0] if sc else 'citta'


T['roma'] = [(3, '|'.join(sorted(_FORTI, key=len, reverse=True)))]

def expand(text, lang='it'):
    for rx, rep in (EXPAND_IT if lang == 'it' else EXPAND_ANY):
        text = rx.sub(rep, text)
    return text


TOPIC_RX = {t: [(w, re.compile(r'\b(?:' + rx + r')', re.I)) for w, rx in lst] for t, lst in T.items()}

# priorità di ripiego per temi equivalenti
TOPIC_ORDER = ['italia', 'mondo', 'economia', 'cronaca', 'roma', 'motori', 'sport', 'scienza', 'salute', 'tech', 'clima', 'cultura', 'spettacoli']

# testate specializzate: tema di partenza
OUTLET_TOPIC = {
    'gazzetta': 'sport', 'wired': 'tech', 'puntoinformatico': 'tech', 'lescienze': 'scienza', 'mediainaf': 'scienza',
    'quotidianosanita': 'salute', 'nature': 'scienza', 'science': 'scienza', 'newscientist': 'scienza', 'sciam': 'scienza',
    'sciencedaily': 'scienza', 'physorg': 'scienza', 'medicalxpress': 'salute', 'statnews': 'salute', 'bjsm': 'salute',
    'theconversation': 'scienza', 'nasa': 'scienza', 'esa': 'scienza', 'carbonbrief': 'clima', 'arstechnica': 'tech',
    'theverge': 'tech', 'techcrunch': 'tech', 'lavoce': 'economia', 'sole24ore': 'economia', 'ft': 'economia', 'wsj': 'economia',
    'economist': 'economia', 'politico': 'mondo', 'kyivindependent': 'mondo', 'timesofisrael': 'mondo',
}
MOTORSPORT = {'formulapassion', 'motorsport', 'gpone', 'therace'}
NAUTICA = {'barcheamotore', 'nautica', 'barchemagazine', 'farevela', 'mby', 'yachtingworld', 'powermotoryacht', 'megayachtnews', 'boatingindustry'}

# ------------------------------------------------------------------ dossier
# id: (titolo, tema, descrizione, espressione, punteggio minimo)
DOSSIERS = {
    'ucraina': ('Guerra in Ucraina', 'mondo', 'Fronte, diplomazia, sanzioni e aiuti: gli sviluppi del conflitto e dei tentativi di negoziato.',
                r'ucrain|ukrain|zelensk|kiev|kyiv|kharkiv|zaporizh|donbass|donbas|donetsk|luhansk|crimea|odessa|kherson|pokrovsk', 2),
    'medio-oriente': ('Israele, Gaza e Medio Oriente', 'mondo', 'La guerra a Gaza, la Cisgiordania, il Libano e la diplomazia della regione.',
                      r'gaza|israel|hamas|hezbollah|netanyahu|cisgiordania|west bank|libano|lebanon|idf\b|tsahal|ostaggi|hostages|flotilla', 2),
    'iran': ("Guerra con l'Iran e Stretto di Hormuz", 'mondo', "Il conflitto tra Stati Uniti e Iran, la chiusura di Hormuz e gli effetti su petrolio, energia e rotte commerciali.",
             r'iran|teheran|tehran|hormuz|khamenei|pasdaran|pezeshkian', 2),
    'usa-cina': ('Stati Uniti e Cina', 'mondo', 'Dazi, terre rare, tecnologia e diplomazia tra le due maggiori economie del mondo.',
                 r'(cina|china|pechino|beijing|xi jinping).{0,80}(usa|stati uniti|washington|trump|dazi|tariff)|(usa|stati uniti|washington|trump|dazi|tariff).{0,80}(cina|china|pechino|beijing|xi jinping)|terre rare|rare earth', 2),
    'usa-trump': ("L'America di Trump", 'mondo', "Casa Bianca, Congresso, tribunali e scelte dell'amministrazione Trump.",
                  r'trump|casa bianca|white house|congresso usa|us congress|corte suprema usa|supreme court|vance\b|rubio\b|hegseth|shutdown', 2),
    'manovra-2027': ('Conti pubblici e manovra 2027', 'economia', "Deficit, procedura d'infrazione europea e le scelte della prossima legge di bilancio.",
                     r'manovra|legge di bilancio|documento programmatico|\bdpb\b|deficit|procedura d infrazione|giorgetti|conti pubblici|patto di stabilita|irpef|flat tax|rottamazione|cuneo fiscale', 2),
    'governo': ('Governo e Parlamento', 'italia', 'Le scelte del governo Meloni, i voti in Parlamento e lo scontro tra maggioranza e opposizioni.',
                r'governo meloni|consiglio dei ministri|palazzo chigi|maggioranza|opposizion|premierato|separazione delle carriere|autonomia differenziata|decreto (legge|sicurezza|flussi)|fiducia al governo|camera dei deputati|senato', 2),
    'mercati': ('Mercati e banche centrali', 'economia', 'Borse, spread, tassi della Bce e della Fed, valute e materie prime.',
                r'borsa|borse|piazza affari|ftse|wall street|nasdaq|dow jones|spread|btp|\bbce\b|\becb\b|\bfed\b|tassi|interest rates|lagarde|powell|petrolio|brent|oro\b|gold price|bitcoin', 2),
    'lavoro': ('Lavoro, salari e pensioni', 'economia', 'Occupazione, contratti, scioperi, salari e riforme della previdenza.',
               r'sciopero|scioperi|sindacat|cgil|cisl|uil\b|contratto nazionale|salario minimo|salari|stipendi|pension|inps|occupazion|disoccupazion|licenziament|cassa integrazione|ex ilva|acciaierie', 2),
    'sicurezza-lavoro': ('Morti sul lavoro', 'cronaca', 'Gli infortuni mortali nei cantieri e nei luoghi di lavoro e le indagini che ne seguono.',
                         r'morti? sul lavoro|incidente sul lavoro|infortuni[oa]? sul lavoro|operai[oa]? mort|mort[oa] (nel|in un) cantiere|caduto da un ponteggio|schiacciato da|sicurezza sul lavoro', 2),
    'femminicidi': ('Violenza contro le donne', 'cronaca', 'Femminicidi, violenze e maltrattamenti: le inchieste e le risposte delle istituzioni.',
                    r'femminicid|uccisa dal (marito|compagno|ex)|violenza sulle donne|violenza di genere|codice rosso|maltrattament|stalking|braccialetto elettronico', 2),
    'migranti': ('Migranti e frontiere', 'italia', "Sbarchi, naufragi, centri in Albania e politiche migratorie italiane ed europee.",
                 r'migrant|sbarch|naufrag|lampedusa|centri in albania|\bcpr\b|richiedenti asilo|asylum|ong\b.{0,40}(nave|mare)|guardia costiera|frontex|decreto flussi|rimpatri', 2),
    'maltempo': ('Maltempo ed eventi estremi', 'clima', 'Allerte, alluvioni, frane e ondate di calore: gli eventi meteo estremi e i loro danni.',
                 r'maltempo|allerta (meteo|rossa|arancione|gialla)|alluvion|nubifragi|esondaz|frana|frane|bomba d acqua|grandinat|tromba d aria|ondata di calore|heatwave|uragano|hurricane|tifone|typhoon|ciclone|flood', 2),
    'clima': ('Crisi climatica', 'clima', 'Caldo estremo, ghiacci, limiti planetari e soluzioni tecnologiche: i dati che misurano il riscaldamento globale.',
              r'clima|climat|riscaldamento globale|global warming|emission|co2|gas serra|greenhouse|cop3\d|ghiacciai|glacier|siccita|drought|net zero|decarbonizz', 2),
    'spazio': ('Spazio ed esplorazione', 'scienza', 'Missioni, telescopi, pianeti lontani e la ricerca di vita oltre la Terra.',
               r'nasa|\besa\b|spazial|space|telescop|webb|hubble|marte|mars\b|luna\b|moon\b|lunar|asteroid|comet|galass|galax|pianet|planet|esopianet|astronaut|spacex|starship|artemis|razzo|rocket|orbita|orbit|satellit', 2),
    'ia': ('Intelligenza artificiale', 'tech', "Modelli, aziende, regole e impatti dell'intelligenza artificiale.",
           r'intelligenza artificiale|artificial intelligence|openai|chatgpt|anthropic|gemini|\bllm|chatbot|deepseek|ai act|nvidia', 2),
    'formula-1': ('Formula 1', 'motori', 'Gran premi, qualifiche, mercato piloti e sviluppo delle monoposto.',
                  r'formula 1|formula one|\bf1\b|gran premio|grand prix|verstappen|leclerc|hamilton|norris|piastri|russell|antonelli|red bull racing|mclaren|ferrari.{0,30}(gp|gara|qualifiche|monoposto)|vasseur', 2),
    'moto': ('MotoGP e Superbike', 'motori', 'Il motomondiale e le derivate di serie: gare, piloti e squadre.',
             r'motogp|moto ?gp|superbike|\bsbk\b|bagnaia|marquez|bezzecchi|bastianini|bulega|toprak|ducati.{0,40}(gara|gp|mondiale)|aprilia racing|motomondiale', 2),
    'auto-elettriche': ('Auto elettriche e transizione', 'motori', 'Vendite, incentivi, ricarica e strategie dei costruttori nel passaggio all elettrico.',
                        r'auto elettric|elettriche|electric vehicle|\bevs?\b|colonnin|ricarica|charging|tesla|byd|batteri[ae]|stop ai motori termici|ban 2035|incentivi auto|ecobonus', 2),
    'nautica': ('Nautica e yacht', 'motori', 'Cantieri, superyacht, saloni nautici, barche a vela e a motore, regate.',
                r'yacht|superyacht|megayacht|nautica|nautico|cantiere navale|cantieri navali|cantiere nautico|salone nautico|boat show|motoscafo|catamaran|barca a vela|barche a vela|barca a motore|barche a motore|ferretti|azimut|benetti|sanlorenzo|riva yacht|perini navi|baglietto|sunseeker|america s cup|luna rossa|sailgp|regata', 2),
    'stellantis': ('Stellantis e industria dell auto', 'motori', 'Produzione, stabilimenti, modelli e trattative del gruppo e dei suoi marchi in Italia.',
                   r'stellantis|mirafiori|cassino|melfi|pomigliano|termoli|filosa|elkann|fiat\b|alfa romeo|maserati|lancia ypsilon', 2),
    'serie-a': ('Serie A', 'sport', 'Partite, classifica, allenatori e mercato del campionato di calcio.',
                r'serie a\b|scudetto|juventus|\bjuve\b|inter\b|milan\b|napoli|atalanta|fiorentina|lazio|roma\b|bologna|torino|como\b|calciomercato|giornata di campionato', 3),
    'tennis': ('Tennis', 'sport', 'Sinner, Alcaraz e i tornei del circuito: risultati e classifiche.',
               r'tennis|sinner|alcaraz|djokovic|musetti|paolini|berrettini|cobolli|atp\b|wta\b|masters 1000|finals|coppa davis|davis cup', 2),
    'papa': ('Papa Leone e la Chiesa', 'cultura', 'Il pontificato di Leone XIV, il Vaticano e la vita della Chiesa.',
             r'pontefice leone|leone xiv|leo xiv|pope leo|pontefic|vaticano|vatican|santa sede|holy see|cardinal|conclave|sinodo', 2),
    'salute-pubblica': ('Sanità pubblica', 'salute', 'Ospedali, liste d attesa, medici e conti del Servizio sanitario.',
                        r'liste d attesa|pronto soccorso|servizio sanitario|\bssn\b|medici di famiglia|infermier|sanita pubblica|ospedali|asl\b|schillaci|fondo sanitario', 2),
    'onu-2026': ('Assemblea generale Onu 2026', 'mondo', 'Discorsi, incontri e scontri della settimana di alto livello delle Nazioni Unite a New York.',
                 r'assemblea generale|general assembly|unga\b|palazzo di vetro|guterres', 3),
    'scuola-stranieri': ('Scuola e tetto agli stranieri', 'italia', "La norma del governo sul limite di alunni stranieri per classe e lo scontro politico e istituzionale che l'accompagna.",
                         r'(tetto|limite|quota).{0,40}stranieri.{0,40}(class|scuol)|alunni stranieri|valditara.{0,60}stranieri', 2),
    'neuro-riabilitazione': ('Neuroscienze e riabilitazione', 'salute', 'Ricerca su cervello, nervi, protesi e recupero del movimento: dal laboratorio alla clinica.',
                             r'neuroscien|neurolog|midollo spinale|spinal cord|protesi|prosthe|riabilitazion|rehabilitation|ictus|stroke|interfaccia cervello|brain-computer|neuroprotes|paralisi|paralys', 2),
}
DOSSIER_RX = {k: re.compile(r'\b(?:' + v[3] + r')', re.I) for k, v in DOSSIERS.items()}

# ------------------------------------------------------------------ filtri
# date: non dicono nulla sul fatto (due titoli con «17 ottobre» non parlano della stessa cosa)
_MESI = ('gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|'
         'january|february|march|april|may|june|july|august|september|october|november|december|'
         'janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|decembre|'
         'enero|febrero|abril|mayo|junio|julio|septiembre|octubre|noviembre|diciembre|'
         'januar|februar|marz|juni|juli|oktober|dezember|jan|feb|apr|jun|jul|aug|sep|sept|oct|nov|dec')
_GIORNI = ('lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica|monday|tuesday|wednesday|thursday|friday|saturday|sunday|'
           'lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lunes|martes|miercoles|jueves|viernes|sabado|domingo|'
           'montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag')
DATE_RX = re.compile(r'\b(?:(?:%s)\s+)?(?:\d{1,2}(?:st|nd|rd|th|er|e|o)?\s+(?:de\s+)?(?:%s)\b(?:\s+(?:de\s+)?\d{4})?|(?:%s)\s+\d{1,2}(?:st|nd|rd|th)?\b(?:\s*,?\s*\d{4})?)' % (_GIORNI, _MESI, _MESI))
WEEKDAY_RX = re.compile(r'\b(?:%s)\b' % _GIORNI)
# titolo che è solo una data («Sabato 17 ottobre»): pagine riassuntive del giorno
JUNK_DATEONLY = re.compile(r'^(?:(?:%s),?\s+)?\d{1,2}\s+(?:%s)(?:\s+\d{4})?$' % (_GIORNI, _MESI))
# data in coda al titolo («Not sorry | October 17th 2026»)
DATE_TAIL = re.compile(r'\s*[|·•–—-]\s*(?:[A-Za-zÀ-ÿ]+,?\s+)?(?:\d{1,2}(?:st|nd|rd|th)?\s+)?(?:%s)\.?\s*(?:\d{1,2}(?:st|nd|rd|th)?)?,?\s*\d{4}\s*$' % _MESI, re.I)

JUNK_TITLE = re.compile(r'''^(rubrica\b|vendo |vendesi |cerco |pagine,|la rassegna|rassegna|bollettino|briefing|morning briefing|weekly|settimana in |le notizie della settimana|oroscopo|l oroscopo|horoscope|meteo\b|previsioni meteo|le previsioni del tempo|estrazioni? (del )?lotto|lotto e superenalotto|superenalotto|million day|10elotto|wordle|cruciverba|crossword|sudoku|quiz\b|newsletter|podcast\b|rassegna stampa|prima pagina di|le prime pagine|buongiorno|buonanotte|la giornata in \d|le notizie (di oggi|del giorno|principali)|morning (briefing|digest)|the morning|evening briefing|first thing|tg\d? (delle|ore)|gr\d? (delle|ore)|edizione delle|lettere al direttore|lettera al direttore|vignetta|il caffe di|il punto di|sondaggio del giorno)''', re.I)
JUNK_ANY = re.compile(r'''(ospiti di oggi|ospiti e interviste di oggi|stasera in tv|in tv stasera|guida tv|programmi tv (?:di|del|della) |le anticipazioni (?:del|di) \d|anticipazioni (?:della|delle) puntat|usat[ao] prezzo e caratteristiche|\(codice \d{5,}\)|\b(?:vendo|vendesi|cerco)\b.{0,60}\busat[oa]\b|\ba \d+(?:[.,]\d+)? ?(?:euro|€).{0,60}\b(?:affare|offerta|sconto|minimo storico|prezzo bomba)|\b(?:affare|offerta|sconto|minimo storico|prezzo bomba)\b.{0,40}\b\d+(?:[.,]\d+)? ?(?:euro|€)|% off\b|\bdeals?\b.{0,30}\$\d|support ars|supporto ars|rassegna stampa|bollettino delle (?:ultime )?notizie|edizione a stampa|print edition|daily brief(?:ing)?\b|\bfor sale\b|codice sconto|coupon|offert[ae] (amazon|del giorno|imperdibil|lampo)|in offerta|sconto del|scontat[oi] del|prime day|black friday|cyber monday|migliori .{0,40} da (comprare|acquistare)|best .{0,40} to buy|deals? of the day|\bdeal\b.{0,20}\$|sponsored|contenuto sponsorizzato|in collaborazione con|annunci? funebr|necrolog|abbonati|subscribe now|iscriviti alla newsletter|ricetta|recipe)''', re.I)
PREFIX_RX = re.compile(r'''^\s*(?:(?:live|diretta|video|foto|fotogallery|gallery|audio|podcast|esclusivo|esclusiva|exclusive|breaking|ultim ?ora|ultim'ora|ultima ora|news|update|aggiornamento|watch|listen|opinion|analysis|editoriale|commento|intervista|l intervista|il caso|il punto|focus|speciale|report|the big read)\s*[:|\-–—]\s*)+''', re.I)
SUFFIX_RX = re.compile(r'''\s*(?:[|\-–—•]\s*(?:video|foto|live|diretta|gallery|news|ultim'ora|ultima ora)\s*)+$''', re.I)
