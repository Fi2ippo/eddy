"""Luoghi riconoscibili nei testi di Eddy, per le mappe delle storie (con quartieri e comuni della provincia di Napoli).

Ogni luogo: nomi (il primo è quello mostrato), codice numerico del paese (come in world-atlas),
latitudine, longitudine, zoom ('citta', 'regione', 'paese', 'continente').
I nomi si cercano nel testo originale con l'iniziale maiuscola; quelli marcati con '!' sono
ignorati a inizio frase (sono anche parole comuni o nomi di persona).
"""

# paesi: codice -> nomi italiani e alternativi
COUNTRIES = '''004 Afghanistan
008 Albania
012 Algeria
024 Angola
032 Argentina
051 Armenia
036 Australia
040 Austria
031 Azerbaigian|Azerbaijan
044 Bahamas
048 Bahrein|Bahrain
050 Bangladesh
112 Bielorussia|Belarus
056 Belgio|Belgium
068 Bolivia
070 Bosnia|Bosnia-Erzegovina|Bosnia ed Erzegovina
072 Botswana
076 Brasile|Brazil|Brasil
100 Bulgaria
854 Burkina Faso
108 Burundi
116 Cambogia|Cambodia
120 Camerun|Cameroon
124 Canada
148 Ciad|Chad
152 Cile|Chile
156 Cina|China
170 Colombia
178 Repubblica del Congo
188 Costa Rica
191 Croazia|Croatia
192 Cuba
196 Cipro|Cyprus
203 Repubblica Ceca|Cechia|Czechia|Czech Republic
384 Costa d'Avorio|Ivory Coast
180 Repubblica Democratica del Congo|Repubblica democratica del Congo|Rd Congo|Congo
208 Danimarca|Denmark
214 Repubblica Dominicana
218 Ecuador
818 Egitto|Egypt
222 El Salvador
232 Eritrea
233 Estonia
231 Etiopia|Ethiopia
242 Figi|Fiji
246 Finlandia|Finland
250 Francia|France
266 Gabon
270 Gambia
268 Georgia!
276 Germania|Germany|Deutschland
288 Ghana
300 Grecia|Greece
304 Groenlandia|Greenland
320 Guatemala
324 Guinea
332 Haiti|Haïti
340 Honduras
344 Hong Kong
348 Ungheria|Hungary
352 Islanda|Iceland
356 India
360 Indonesia
364 Iran
368 Iraq
372 Irlanda|Ireland
376 Israele|Israel
380 Italia|Italy
388 Giamaica|Jamaica
392 Giappone|Japan
400 Giordania|Jordan
398 Kazakistan|Kazakhstan
404 Kenya
Kosovo Kosovo
414 Kuwait
417 Kirghizistan|Kyrgyzstan
418 Laos
428 Lettonia|Latvia
422 Libano|Lebanon
430 Liberia
434 Libia|Libya
440 Lituania|Lithuania
442 Lussemburgo|Luxembourg
807 Macedonia del Nord|North Macedonia
450 Madagascar
454 Malawi
458 Malesia|Malaysia
466 Mali
470 Malta
478 Mauritania
484 Messico|Mexico
498 Moldavia|Moldova
496 Mongolia
499 Montenegro
504 Marocco|Morocco
508 Mozambico|Mozambique
104 Myanmar|Birmania
516 Namibia
524 Nepal
528 Paesi Bassi|Olanda|Netherlands
540 Nuova Caledonia
554 Nuova Zelanda|New Zealand
558 Nicaragua
562 Niger
566 Nigeria
408 Corea del Nord|North Korea
578 Norvegia|Norway
512 Oman
586 Pakistan
275 Palestina|Palestine|Territori palestinesi
591 Panama
598 Papua Nuova Guinea
600 Paraguay
604 Perù|Peru
608 Filippine|Philippines
616 Polonia|Poland
620 Portogallo|Portugal
630 Porto Rico|Puerto Rico
634 Qatar
642 Romania
643 Russia
646 Ruanda|Rwanda
682 Arabia Saudita|Saudi Arabia
686 Senegal
688 Serbia
694 Sierra Leone
702 Singapore
703 Slovacchia|Slovakia
705 Slovenia
706 Somalia
710 Sudafrica|South Africa
410 Corea del Sud|South Korea|Corea
724 Spagna|Spain|España
144 Sri Lanka
729 Sudan
728 Sud Sudan|South Sudan
752 Svezia|Sweden
756 Svizzera|Switzerland
760 Siria|Syria
158 Taiwan
762 Tagikistan|Tajikistan
834 Tanzania
764 Thailandia|Thailand
768 Togo
780 Trinidad e Tobago
788 Tunisia
792 Turchia|Turkey|Türkiye
795 Turkmenistan
800 Uganda
804 Ucraina|Ukraine
784 Emirati Arabi Uniti|Emirati|United Arab Emirates
826 Regno Unito|Gran Bretagna|United Kingdom|Britain
840 Stati Uniti|Stati Uniti d'America|United States|America!
858 Uruguay
860 Uzbekistan
336 Vaticano|Città del Vaticano|Santa Sede
862 Venezuela
704 Vietnam
887 Yemen
894 Zambia
716 Zimbabwe
010 Antartide|Antarctica
674 San Marino
492 Principato di Monaco'''

# aggettivi e gentilizi (testo normalizzato, minuscolo): danno solo il paese, con peso basso
DEMONYMS = {
    '643': r'russ[oaie]|cremlino', '804': r'ucrain[oaie]', '376': r'israelian[oaie]', '275': r'palestines[ei]', '364': r'iranian[oaie]|teheran',
    '156': r'cines[ei]|pechino', '840': r'american[oaie]|statunitens[ei]|casa bianca|pentagono', '250': r'frances[ei]|eliseo', '276': r'tedesc[oaih]+',
    '826': r'britannic[oaih]+|ingles[ei]|downing street', '724': r'spagnol[oaie]', '392': r'giappones[ei]', '792': r'turc[oaih]+', '818': r'egizian[oaie]',
    '434': r'libic[oaih]+', '760': r'sirian[oaie]', '422': r'libanes[ei]', '356': r'indian[oaie]', '076': r'brasilian[oaie]', '032': r'argentin[oaie]',
    '862': r'venezuelan[oaie]', '484': r'messican[oaie]', '124': r'canades[ei]', '036': r'australian[oaie]', '616': r'polacc[oaih]+',
    '348': r'ungheres[ei]', '300': r'grec[oaih]+', '756': r'svizzer[oaie]', '528': r'olandes[ei]', '040': r'austriac[oaih]+', '752': r'svedes[ei]',
    '578': r'norveges[ei]', '208': r'danes[ei]', '246': r'finlandes[ei]', '372': r'irlandes[ei]', '620': r'portoghes[ei]', '642': r'rumen[oaie]',
    '688': r'serb[oaie]', '191': r'croat[oaie]', '682': r'saudit[aie]', '634': r'qatariot[oaie]', '408': r'nordcorean[oaie]', '410': r'sudcorean[oaie]',
    '158': r'taiwanes[ei]', '586': r'pakistan[oaie]', '004': r'afghan[oaie]?', '368': r'irachen[oaie]', '887': r'yemenit[aie]|houthi',
    '566': r'nigerian[oaie]', '710': r'sudafrican[oaie]', '231': r'etiop[ie]', '729': r'sudanes[ei]', '504': r'marocchin[oaie]',
    '788': r'tunisin[oaie]', '012': r'algerin[oaie]', '192': r'cuban[oaie]', '170': r'colombian[oaie]', '152': r'cilen[oaie]', '112': r'bieloruss[oaie]',
    '398': r'kazak[oaih]*', '268': r'georgian[oaie]', '031': r'azer[oaie]?|azerbaigian[oaie]', '051': r'armen[oaie]',
}

# città e luoghi: nomi;codice paese;lat;lon;zoom
PLACES = '''Roma|Rome;380;41.902;12.496;citta
Milano|Milan;380;45.464;9.19;citta
Napoli|Naples;380;40.852;14.268;citta
Torino|Turin;380;45.07;7.687;citta
Palermo;380;38.116;13.361;citta
Genova|Genoa;380;44.407;8.934;citta
Bologna;380;44.494;11.343;citta
Firenze|Florence;380;43.77;11.255;citta
Bari;380;41.117;16.872;citta
Catania;380;37.502;15.087;citta
Venezia|Venice;380;45.44;12.333;citta
Verona;380;45.438;10.992;citta
Messina;380;38.193;15.554;citta
Padova|Padua;380;45.406;11.877;citta
Trieste;380;45.65;13.777;citta
Brescia;380;45.541;10.211;citta
Taranto;380;40.464;17.247;citta
Prato;380;43.88;11.097;citta
Parma;380;44.801;10.328;citta
Modena;380;44.647;10.925;citta
Reggio Calabria;380;38.111;15.647;citta
Reggio Emilia;380;44.698;10.631;citta
Perugia;380;43.111;12.389;citta
Ravenna;380;44.418;12.204;citta
Livorno;380;43.548;10.311;citta
Cagliari;380;39.224;9.122;citta
Foggia;380;41.462;15.545;citta
Rimini;380;44.06;12.566;citta
Salerno;380;40.68;14.766;citta
Ferrara;380;44.838;11.62;citta
Sassari;380;40.726;8.56;citta
Latina;380;41.467;12.904;citta
Monza;380;45.584;9.274;citta
Siracusa|Syracuse;380;37.075;15.286;citta
Pescara;380;42.461;14.214;citta
Bergamo;380;45.698;9.677;citta
Forlì;380;44.222;12.041;citta
Trento;380;46.07;11.121;citta
Vicenza;380;45.548;11.546;citta
Terni;380;42.561;12.645;citta
Bolzano|Bozen;380;46.498;11.355;citta
Novara;380;45.446;8.622;citta
Piacenza;380;45.052;9.693;citta
Ancona;380;43.616;13.519;citta
Andria;380;41.227;16.296;citta
Arezzo;380;43.463;11.88;citta
Udine;380;46.063;13.235;citta
Cesena;380;44.139;12.243;citta
Lecce;380;40.352;18.17;citta
Pesaro;380;43.91;12.913;citta
Barletta;380;41.32;16.281;citta
Alessandria;380;44.912;8.615;citta
La Spezia;380;44.102;9.824;citta
Pistoia;380;43.933;10.917;citta
Pisa;380;43.716;10.401;citta
Lucca;380;43.843;10.507;citta
Brindisi;380;40.632;17.936;citta
Treviso;380;45.666;12.243;citta
Como;380;45.81;9.085;citta
Busto Arsizio;380;45.611;8.851;citta
Grosseto;380;42.763;11.112;citta
Varese;380;45.82;8.825;citta
Sesto San Giovanni;380;45.533;9.234;citta
Pozzuoli;380;40.823;14.122;citta
Caserta;380;41.074;14.332;citta
Asti;380;44.9;8.207;citta
Ragusa;380;36.926;14.725;citta
Cremona;380;45.133;10.023;citta
Carrara;380;44.079;10.098;citta
Trapani;380;38.017;12.537;citta
Potenza!;380;40.64;15.806;citta
Catanzaro;380;38.91;16.587;citta
Cosenza;380;39.298;16.254;citta
Crotone;380;39.081;17.127;citta
Vibo Valentia;380;38.676;16.1;citta
Matera;380;40.666;16.604;citta
Benevento;380;41.13;14.782;citta
Avellino;380;40.914;14.793;citta
Campobasso;380;41.56;14.663;citta
Isernia;380;41.594;14.233;citta
Chieti;380;42.351;14.168;citta
Teramo;380;42.659;13.704;citta
L'Aquila;380;42.35;13.4;citta
Frosinone;380;41.64;13.343;citta
Rieti;380;42.404;12.857;citta
Viterbo;380;42.42;12.108;citta
Siena;380;43.318;11.331;citta
Macerata;380;43.3;13.453;citta
Ascoli Piceno|Ascoli;380;42.854;13.575;citta
Fermo!;380;43.16;13.718;citta
Urbino;380;43.726;12.636;citta
Imperia;380;43.889;8.039;citta
Savona;380;44.308;8.481;citta
Sanremo;380;43.817;7.776;citta
Aosta;380;45.735;7.313;citta
Cuneo;380;44.384;7.542;citta
Biella;380;45.566;8.054;citta
Vercelli;380;45.323;8.42;citta
Verbania;380;45.921;8.551;citta
Pavia;380;45.186;9.155;citta
Lodi!;380;45.314;9.503;citta
Lecco;380;45.853;9.39;citta
Sondrio;380;46.17;9.871;citta
Mantova|Mantua;380;45.156;10.791;citta
Rovigo;380;45.071;11.79;citta
Belluno;380;46.14;12.217;citta
Pordenone;380;45.956;12.66;citta
Gorizia;380;45.94;13.621;citta
Imola;380;44.353;11.715;citta
Agrigento;380;37.311;13.577;citta
Caltanissetta;380;37.49;14.062;citta
Enna;380;37.567;14.279;citta
Gela;380;37.066;14.25;citta
Marsala;380;37.799;12.437;citta
Taormina;380;37.852;15.288;citta
Nuoro;380;40.321;9.33;citta
Oristano;380;39.906;8.588;citta
Olbia;380;40.923;9.498;citta
Lampedusa;380;35.508;12.6;citta
Capri;380;40.551;14.242;citta
Ischia;380;40.731;13.906;citta
Pompei|Pompeii;380;40.749;14.485;citta
Amalfi;380;40.634;14.603;citta
Assisi;380;43.071;12.617;citta
Cortina d'Ampezzo|Cortina;380;46.537;12.135;citta
Fiumicino;380;41.773;12.239;citta
Frascati;380;41.808;12.68;citta
Grottaferrata;380;41.788;12.672;citta
Castel Gandolfo;380;41.747;12.65;citta
Albano Laziale;380;41.729;12.659;citta
Ariccia;380;41.721;12.672;citta
Genzano di Roma|Genzano;380;41.706;12.692;citta
Nemi;380;41.721;12.716;citta
Lanuvio;380;41.674;12.698;citta
Velletri;380;41.687;12.778;citta
Lariano;380;41.727;12.835;citta
Rocca di Papa;380;41.761;12.709;citta
Rocca Priora;380;41.792;12.762;citta
Monte Porzio Catone;380;41.816;12.714;citta
Monte Compatri|Montecompatri;380;41.808;12.738;citta
Ciampino;380;41.8;12.601;citta
Castelli Romani;380;41.75;12.7;regione
Ostia|Lido di Ostia;380;41.732;12.278;citta
Acilia;380;41.787;12.367;citta
Fregene;380;41.857;12.2;citta
Pomezia;380;41.669;12.502;citta
Torvaianica;380;41.623;12.462;citta
Ardea;380;41.612;12.54;citta
Anzio;380;41.447;12.628;citta
Ladispoli;380;41.954;12.075;citta
Cerveteri;380;41.993;12.097;citta
Santa Marinella;380;42.034;11.852;citta
Tivoli;380;41.963;12.798;citta
Guidonia|Guidonia Montecelio;380;41.999;12.723;citta
Monterotondo;380;42.053;12.617;citta
Fonte Nuova;380;42.003;12.621;citta
Palombara Sabina;380;42.069;12.767;citta
Subiaco;380;41.925;13.095;citta
Bracciano;380;42.103;12.176;citta
Anguillara Sabazia|Anguillara;380;42.087;12.27;citta
Trevignano Romano|Trevignano;380;42.155;12.248;citta
Colleferro;380;41.73;13.003;citta
Valmontone;380;41.776;12.917;citta
Palestrina;380;41.838;12.89;citta
Zagarolo;380;41.839;12.832;citta
Fiano Romano;380;42.165;12.596;citta
Civitavecchia;380;42.093;11.796;citta
Caivano;380;40.957;14.306;citta
Scampia;380;40.89;14.239;citta
Ercolano;380;40.806;14.348;citta
San Giorgio a Cremano;380;40.83;14.334;citta
Torre del Greco;380;40.786;14.368;citta
Torre Annunziata;380;40.753;14.452;citta
Castellammare di Stabia;380;40.701;14.487;citta
Gragnano;380;40.689;14.519;citta
Boscoreale;380;40.774;14.476;citta
Ottaviano;380;40.851;14.48;citta
San Giuseppe Vesuviano;380;40.836;14.505;citta
Somma Vesuviana;380;40.871;14.437;citta
Sant'Anastasia;380;40.868;14.402;citta
Cercola;380;40.858;14.357;citta
Volla;380;40.88;14.341;citta
Terzigno;380;40.809;14.493;citta
Pollena Trocchia;380;40.853;14.381;citta
Vesuvio|Vesuvius;380;40.821;14.426;citta
Bacoli;380;40.797;14.078;citta
Monte di Procida;380;40.797;14.05;citta
Quarto Flegreo;380;40.879;14.142;citta
Campi Flegrei|Phlegraean Fields;380;40.827;14.139;citta
Giugliano in Campania|Giugliano;380;40.928;14.195;citta
Afragola;380;40.922;14.309;citta
Casoria;380;40.907;14.293;citta
Acerra;380;40.946;14.372;citta
Casalnuovo di Napoli|Casalnuovo;380;40.91;14.351;citta
Pomigliano d'Arco|Pomigliano;380;40.909;14.383;citta
Marano di Napoli;380;40.899;14.188;citta
Melito di Napoli;380;40.922;14.231;citta
Mugnano di Napoli;380;40.909;14.208;citta
Arzano;380;40.912;14.266;citta
Frattamaggiore;380;40.941;14.274;citta
Sant'Antimo;380;40.942;14.235;citta
Villaricca;380;40.92;14.193;citta
Qualiano;380;40.92;14.153;citta
Nola;380;40.926;14.528;citta
Marigliano;380;40.925;14.457;citta
Sorrento;380;40.626;14.376;citta
Vico Equense;380;40.663;14.427;citta
Massa Lubrense;380;40.611;14.344;citta
Piano di Sorrento;380;40.633;14.411;citta
Procida;380;40.762;14.024;citta
Anacapri;380;40.555;14.214;citta
Casamicciola Terme|Casamicciola;380;40.746;13.909;citta
Forio;380;40.738;13.857;citta
Lacco Ameno;380;40.751;13.887;citta
Fuorigrotta;380;40.825;14.193;citta
Bagnoli;380;40.806;14.163;citta
Vomero;380;40.846;14.232;citta
Posillipo;380;40.811;14.205;citta
Secondigliano;380;40.898;14.258;citta
Ponticelli;380;40.858;14.331;citta
San Giovanni a Teduccio;380;40.837;14.306;citta
Soccavo;380;40.846;14.194;citta
Chiaia;380;40.836;14.236;citta
Lamezia Terme;380;38.97;16.31;citta
Mugello;380;43.997;11.371;citta
Misano;380;43.962;12.684;citta
Piemonte;380;45.05;7.92;regione
Valle d'Aosta;380;45.74;7.42;regione
Lombardia;380;45.58;9.77;regione
Trentino|Trentino-Alto Adige;380;46.43;11.17;regione
Alto Adige|Südtirol;380;46.7;11.4;regione
Veneto;380;45.65;11.85;regione
Friuli|Friuli Venezia Giulia|Friuli-Venezia Giulia;380;46.1;13.1;regione
Liguria;380;44.3;8.7;regione
Emilia-Romagna|Emilia Romagna|Romagna;380;44.53;11.0;regione
Toscana|Tuscany;380;43.35;11.0;regione
Umbria;380;42.95;12.5;regione
Marche!;380;43.35;13.15;regione
Lazio;380;41.98;12.77;regione
Abruzzo;380;42.23;13.85;regione
Molise;380;41.68;14.6;regione
Campania;380;40.9;14.8;regione
Puglia|Apulia;380;41.0;16.6;regione
Basilicata;380;40.5;16.1;regione
Calabria;380;39.0;16.4;regione
Sicilia|Sicily;380;37.6;14.1;regione
Sardegna|Sardinia;380;40.1;9.0;regione
Stretto di Messina;380;38.25;15.63;regione
Etna;380;37.751;14.994;regione
Vesuvio;380;40.821;14.426;regione
Campi Flegrei;380;40.827;14.139;regione
Dolomiti;380;46.41;11.84;regione
Pianura Padana;380;45.2;10.5;regione
Londra|London;826;51.507;-0.128;citta
Parigi|Paris;250;48.857;2.352;citta
Berlino|Berlin;276;52.52;13.405;citta
Madrid;724;40.417;-3.704;citta
Barcellona|Barcelona;724;41.385;2.173;citta
Lisbona|Lisbon|Lisboa;620;38.722;-9.139;citta
Bruxelles|Brussels;056;50.85;4.35;citta
Amsterdam;528;52.37;4.895;citta
L'Aia|The Hague|Den Haag;528;52.08;4.3;citta
Vienna|Wien;040;48.208;16.372;citta
Ginevra|Geneva|Genève;756;46.204;6.143;citta
Zurigo|Zurich|Zürich;756;47.37;8.54;citta
Berna|Bern;756;46.948;7.447;citta
Strasburgo|Strasbourg;250;48.573;7.752;citta
Lione|Lyon;250;45.764;4.836;citta
Marsiglia|Marseille;250;43.296;5.37;citta
Nizza|Nice!;250;43.7;7.27;citta
Monaco di Baviera|Munich|München;276;48.137;11.575;citta
Francoforte|Frankfurt;276;50.11;8.682;citta
Amburgo|Hamburg;276;53.551;9.994;citta
Colonia|Cologne|Köln;276;50.938;6.96;citta
Stoccarda|Stuttgart;276;48.776;9.183;citta
Varsavia|Warsaw|Warszawa;616;52.23;21.01;citta
Cracovia|Kraków|Krakow;616;50.065;19.945;citta
Praga|Prague|Praha;203;50.076;14.438;citta
Budapest;348;47.498;19.04;citta
Bucarest|Bucharest;642;44.427;26.103;citta
Sofia!;100;42.698;23.322;citta
Atene|Athens;300;37.984;23.728;citta
Belgrado|Belgrade;688;44.787;20.457;citta
Zagabria|Zagreb;191;45.815;15.982;citta
Lubiana|Ljubljana;705;46.057;14.506;citta
Sarajevo;070;43.856;18.413;citta
Tirana;008;41.328;19.819;citta
Skopje;807;41.998;21.425;citta
Pristina;Kosovo;42.663;21.165;citta
Chisinau|Chișinău;498;47.011;28.863;citta
Kiev|Kyiv|Kiew;804;50.45;30.523;citta
Kharkiv|Kharkov|Charkiw;804;49.993;36.231;citta
Odessa|Odesa;804;46.482;30.723;citta
Leopoli|Lviv;804;49.84;24.03;citta
Zaporizhzhia|Zaporizhia|Zaporižžja|Zaporiggia;804;47.838;35.139;citta
Kherson|Cherson;804;46.635;32.617;citta
Dnipro;804;48.465;35.046;citta
Pokrovsk;804;48.282;37.176;citta
Donetsk;804;48.016;37.803;citta
Mosca|Moscow|Moskau|Moscou;643;55.756;37.617;citta
San Pietroburgo|Saint Petersburg|St Petersburg|St. Petersburg;643;59.939;30.316;citta
Minsk;112;53.904;27.562;citta
Vilnius;440;54.687;25.28;citta
Riga;428;56.95;24.105;citta
Tallinn;233;59.437;24.754;citta
Helsinki;246;60.17;24.938;citta
Stoccolma|Stockholm;752;59.329;18.069;citta
Oslo;578;59.914;10.752;citta
Copenaghen|Copenhagen|København;208;55.676;12.568;citta
Dublino|Dublin;372;53.35;-6.26;citta
Edimburgo|Edinburgh;826;55.953;-3.189;citta
Manchester;826;53.483;-2.244;citta
Liverpool;826;53.408;-2.992;citta
Birmingham;826;52.486;-1.89;citta
Belfast;826;54.597;-5.93;citta
Reykjavik|Reykjavík;352;64.147;-21.942;citta
Istanbul;792;41.008;28.978;citta
Ankara;792;39.934;32.86;citta
Nicosia;196;35.185;33.382;citta
La Valletta|Valletta;470;35.899;14.514;citta
Gerusalemme|Jerusalem;376;31.778;35.235;citta
Tel Aviv;376;32.085;34.782;citta
Gaza|Striscia di Gaza|Gaza Strip|Gaza City;275;31.42;34.35;regione
Rafah;275;31.297;34.245;citta
Khan Younis|Khan Yunis;275;31.346;34.306;citta
Ramallah;275;31.902;35.206;citta
Cisgiordania|West Bank;275;31.95;35.3;regione
Beirut;422;33.894;35.502;citta
Damasco|Damascus;760;33.513;36.292;citta
Aleppo;760;36.202;37.134;citta
Amman;400;31.954;35.911;citta
Baghdad;368;33.315;44.366;citta
Teheran|Tehran;364;35.689;51.389;citta
Stretto di Hormuz|Hormuz;364;26.57;56.25;regione
Riad|Riyadh|Ryad;682;24.713;46.675;citta
Gedda|Jeddah;682;21.485;39.193;citta
Doha;634;25.286;51.533;citta
Dubai;784;25.205;55.271;citta
Abu Dhabi;784;24.454;54.377;citta
Mascate|Muscat;512;23.588;58.383;citta
Sana'a|Sanaa;887;15.369;44.191;citta
Il Cairo|Cairo;818;30.044;31.236;citta
Tripoli;434;32.887;13.191;citta
Bengasi|Benghazi;434;32.119;20.087;citta
Tunisi|Tunis;788;36.806;10.181;citta
Algeri|Algiers;012;36.754;3.059;citta
Rabat;504;34.02;-6.841;citta
Casablanca;504;33.573;-7.59;citta
Khartoum|Khartum;729;15.5;32.56;citta
Darfur;729;13.5;24.0;regione
Addis Abeba|Addis Ababa;231;9.03;38.74;citta
Nairobi;404;-1.292;36.822;citta
Kinshasa;180;-4.441;15.266;citta
Goma;180;-1.679;29.228;citta
Lagos;566;6.524;3.379;citta
Abuja;566;9.076;7.399;citta
Johannesburg;710;-26.204;28.047;citta
Città del Capo|Cape Town;710;-33.925;18.424;citta
Pretoria;710;-25.747;28.229;citta
Dakar;686;14.716;-17.467;citta
Bamako;466;12.639;-8.003;citta
Niamey;562;13.512;2.112;citta
Mogadiscio|Mogadishu;706;2.047;45.318;citta
Accra;288;5.603;-0.187;citta
Luanda;024;-8.839;13.289;citta
Maputo;508;-25.969;32.573;citta
Pechino|Beijing|Peking;156;39.904;116.407;citta
Shanghai;156;31.23;121.474;citta
Shenzhen;156;22.543;114.058;citta
Wuhan;156;30.593;114.305;citta
Tibet;156;31.0;89.0;regione
Xinjiang;156;41.0;85.0;regione
Hong Kong;344;22.32;114.17;citta
Taipei;158;25.033;121.565;citta
Tokyo|Tokio;392;35.676;139.65;citta
Osaka;392;34.694;135.502;citta
Hiroshima;392;34.385;132.455;citta
Seul|Seoul;410;37.566;126.978;citta
Pyongyang;408;39.039;125.762;citta
Nuova Delhi|New Delhi|Delhi;356;28.614;77.209;citta
Mumbai|Bombay;356;19.076;72.878;citta
Kashmir;356;34.08;74.8;regione
Islamabad;586;33.684;73.048;citta
Karachi;586;24.861;67.01;citta
Lahore;586;31.52;74.358;citta
Kabul;004;34.555;69.207;citta
Dacca|Dhaka;050;23.811;90.413;citta
Bangkok;764;13.756;100.502;citta
Hanoi;704;21.028;105.854;citta
Giacarta|Jakarta;360;-6.208;106.846;citta
Bali;360;-8.34;115.092;regione
Manila;608;14.6;120.984;citta
Kuala Lumpur;458;3.139;101.687;citta
Yangon|Rangoon;104;16.84;96.173;citta
Kathmandu;524;27.717;85.324;citta
Astana;398;51.169;71.449;citta
Baku;031;40.409;49.867;citta
Tbilisi;268;41.716;44.783;citta
Erevan|Yerevan;051;40.179;44.499;citta
Washington!;840;38.897;-77.037;citta
New York;840;40.713;-74.006;citta
Los Angeles;840;34.052;-118.244;citta
San Francisco;840;37.775;-122.419;citta
Chicago;840;41.878;-87.63;citta
Miami;840;25.762;-80.192;citta
Houston;840;29.76;-95.37;citta
Dallas;840;32.777;-96.797;citta
Boston;840;42.36;-71.059;citta
Filadelfia|Philadelphia;840;39.953;-75.165;citta
Atlanta;840;33.749;-84.388;citta
Seattle;840;47.606;-122.332;citta
Las Vegas;840;36.17;-115.14;citta
Detroit;840;42.331;-83.046;citta
Minneapolis;840;44.978;-93.265;citta
Austin;840;30.267;-97.743;citta
Denver;840;39.739;-104.99;citta
New Orleans;840;29.951;-90.072;citta
Phoenix;840;33.448;-112.074;citta
Portland;840;45.515;-122.679;citta
Cape Canaveral;840;28.392;-80.605;citta
Silicon Valley;840;37.387;-122.057;regione
California;840;36.78;-119.42;regione
Texas;840;31.0;-100.0;regione
Florida;840;27.994;-81.76;regione
Alaska;840;64.2;-149.5;regione
Hawaii;840;20.8;-156.3;regione
Ottawa;124;45.421;-75.697;citta
Toronto;124;43.653;-79.383;citta
Montreal|Montréal;124;45.502;-73.567;citta
Vancouver;124;49.283;-123.121;citta
Città del Messico|Mexico City;484;19.433;-99.133;citta
L'Avana|Havana|La Habana;192;23.114;-82.367;citta
Caracas;862;10.488;-66.879;citta
Bogotà|Bogotá|Bogota;170;4.711;-74.072;citta
Lima!;604;-12.046;-77.043;citta
Quito;218;-0.18;-78.468;citta
Santiago del Cile|Santiago de Chile;152;-33.449;-70.669;citta
Buenos Aires;032;-34.604;-58.382;citta
Brasilia|Brasília;076;-15.794;-47.882;citta
San Paolo|São Paulo|Sao Paulo;076;-23.551;-46.633;citta
Rio de Janeiro;076;-22.907;-43.173;citta
Montevideo;858;-34.901;-56.165;citta
La Paz;068;-16.5;-68.15;citta
Asunción|Asuncion;600;-25.264;-57.576;citta
Port-au-Prince;332;18.594;-72.307;citta
Sydney;036;-33.869;151.209;citta
Melbourne;036;-37.814;144.963;citta
Canberra;036;-35.281;149.13;citta
Auckland;554;-36.849;174.763;citta
Wellington;554;-41.287;174.776;citta
Crimea;804;45.0;34.1;regione
Donbass|Donbas;804;48.0;37.8;regione
Kursk;643;51.73;36.19;citta
Belgorod;643;50.6;36.6;citta
Kaliningrad;643;54.71;20.51;citta
Baviera|Bavaria|Bayern!;276;48.79;11.5;regione
Catalogna|Catalonia|Catalunya;724;41.59;1.52;regione
Andalusia|Andalucía;724;37.54;-4.73;regione
Valencia;724;39.47;-0.376;citta
Siviglia|Seville|Sevilla;724;37.389;-5.984;citta
Bilbao;724;43.263;-2.935;citta
Canarie|Canary Islands;724;28.29;-16.63;regione
Baleari|Maiorca|Mallorca;724;39.57;2.65;regione
Scozia|Scotland;826;56.49;-4.2;regione
Galles|Wales;826;52.13;-3.78;regione
Irlanda del Nord|Northern Ireland;826;54.6;-6.7;regione
Inghilterra|England;826;52.36;-1.17;regione
Corsica;250;42.04;9.01;regione
Normandia|Normandy;250;49.18;-0.37;regione
Costa Azzurra;250;43.6;7.1;regione
Mediterraneo|Mediterranean;380;36.0;16.0;continente
Mar Nero|Black Sea;804;43.4;34.0;continente
Mar Rosso|Red Sea;887;20.0;38.5;continente
Sahel;466;15.0;0.0;continente
Artico|Arctic;304;78.0;-40.0;continente
Le Mans;250;47.956;0.207;citta
Monza!;380;45.62;9.29;citta
Silverstone;826;52.072;-1.017;citta
Spa-Francorchamps|Spa;056;50.437;5.971;citta
Imola;380;44.344;11.717;citta
Maranello;380;44.526;10.866;citta
Mirafiori;380;45.03;7.63;citta
Wolfsburg;276;52.423;10.787;citta
Davos;756;46.802;9.836;citta
Ginevra, Cern|Cern|CERN;756;46.234;6.053;citta
Kourou;250;5.236;-52.769;citta
Baikonur;398;45.965;63.305;citta'''


def _parse():
    countries = {}
    for line in COUNTRIES.split('\n'):
        cc, names = line.split(' ', 1)
        countries[cc] = names.split('|')
    places = []
    for line in PLACES.split('\n'):
        names, cc, lat, lon, zoom = line.split(';')
        places.append({'names': names.split('|'), 'cc': cc, 'lat': float(lat), 'lon': float(lon), 'zoom': zoom})
    return countries, places


COUNTRY_NAMES, PLACE_LIST = _parse()
