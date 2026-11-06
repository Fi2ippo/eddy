#!/usr/bin/env python3
"""Controlli rapidi del codice della redazione, senza rete: il workflow li esegue prima di pubblicare.

  python selftest.py

Se uno fallisce il giro si ferma e resta online la versione precedente del sito.
"""
import os
import sys
import tempfile
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.environ.setdefault('EDDY_NOW', '2026-10-18T12:00:00Z')

import lexicon as L  # noqa: E402
import editor as E  # noqa: E402

FAIL = []


def check(name, cond):
    if not cond:
        FAIL.append(name)


# cronaca locale di Napoli e provincia
loc = lambda t, m='pure': L.is_local_text(L.norm(t), m)  # noqa: E731
check('locale: Pozzuoli', loc('Bradisismo, nuova scossa a Pozzuoli: verifiche nelle scuole'))
check('locale: Casoria', loc('Casoria, auto in fiamme nella notte in via Nazionale', 'local'))
check('locale: Vomero', loc('Vomero, chiusa la funicolare di Chiaia per un guasto', 'local'))
check('nazionale: governo', not loc('Tetto al gas, Pichetto Fratin: taglierà le bollette', 'local'))
check('estero', not loc('Francia, 855 fermi dopo i disordini a Parigi', 'local'))
check('sport di vertice: il Napoli', not loc('Il Napoli a Torino: Conte cerca punti pesanti'))
check('altra provincia: Salerno', not loc('Dramma a Battipaglia, travolge un bracciante e fugge', 'local'))
check('testata mista senza segni certi', not loc('Meloni alla Niaf: il Columbus Day resta', 'mixed'))
check('storia locale con testate nazionali', L.story_local(L.norm('Omicidio-suicidio a Napoli, anziano spara alla moglie'), '', 3, 8))
check('storia nazionale con una voce locale', not L.story_local(L.norm('Attentato a Ranucci, Lavitola resta in carcere'), '', 1, 4))
check('zona: Ischia nelle isole', L.zone_of([(L.norm('Ischia, frana a Casamicciola'), 3)]) == 'isole')

# design, architettura, arte
from collections import Counter  # noqa: E402


def top_topic(t):
    sc = Counter()
    for tp, rules in L.TOPIC_RX.items():
        for w, rx in rules:
            sc[tp] += w * len({m.group(0) for m in rx.finditer(L.norm(t))})
    return sc.most_common(1)[0][0] if sc and max(sc.values()) > 0 else None


check('tema: design', top_topic('Salone del Mobile, le novità del design italiano') == 'design')
check('tema: architettura', top_topic('Renzo Piano progetta il nuovo padiglione della Biennale di Architettura') == 'architettura')
check('tema: arte', top_topic('Caravaggio ritrovato, la mostra al museo di Capodimonte') == 'arte')
check('«désigner» in francese non è design', top_topic('Le congrès du parti devant désigner son successeur') != 'design')
check('Casa Bianca non è architettura', top_topic('Trump alla Casa Bianca incontra Zelensky') == 'mondo')

# indirizzi e voci
outlets = {'ansa': {'name': 'ANSA', 'lang': 'it', 'sec': 'it'}}
base = {'o': 'ansa', 't': 'Titolo abbastanza lungo per passare i filtri della redazione', 's': '', 'd': '2026-10-18T10:00:00Z', 'l': 'it'}
items = [dict(base, k='a', u='https://www.ansa.it/sito/notizie/a.html'), dict(base, k='b', u='javascript:alert(1)//x', t=base['t'] + ' due'),
         dict(base, k='c', u='httpx://www.ansa.it/b.html', t=base['t'] + ' tre'), dict(base, k='d', u='https:///senza-dominio', t=base['t'] + ' quattro')]
got = {it['k'] for it in E.prepare(items, outlets)}
check('solo http e https con dominio', got == {'a'})

# agenzie e riprese
srcs = [{'o': 'ansa', 't': 'Sciopero generale il 20 novembre, la Cgil conferma la data', 'k': '1'},
        {'o': 'tgcom24', 't': 'Sciopero generale il 20 novembre, la Cgil conferma la data', 'k': '2'},
        {'o': 'corriere', 't': 'Landini: «Sarà una giornata di lotta»', 'k': '3', 'a': 'LaPresse / CorriereTv'},
        {'o': 'repubblica', 't': 'Il governo convoca i sindacati dopo l annuncio', 'k': '4'}]
E.mark_agencies(srcs, {})
check('agenzia', srcs[0].get('ag') == 'ansa')
check('ripresa del titolo d agenzia', srcs[1].get('ag') == 'ansa')
check('firma d agenzia', srcs[2].get('ag') == 'lapresse')
check('testata indipendente', 'ag' not in srcs[3])
check('nomi e numeri', E.informative('Milano, Piantedosi risponde a Sala: 17 arrestati') >= {'piantedosi', 'sala', '17'})

# segni «++» delle ultim'ora
check('via i ++', E.clean_title('++ Omicidio a Napoli, arrestato il vicino ++', {}) == 'Omicidio a Napoli, arrestato il vicino')
check('++ attaccati', E.clean_title('++Ucraina: attacco su Kiev++', {}) == 'Ucraina: attacco su Kiev')
check('C++ resta', E.clean_title('Microsoft aggiorna C++ e Notepad++', {}) == 'Microsoft aggiorna C++ e Notepad++')
check('sintesi senza ++', E.noplus('Primo ++ urgente ++ (ANSA)\n\nSecondo', False) == 'Primo urgente (ANSA)\n\nSecondo')

# segnalazioni
with tempfile.TemporaryDirectory() as d:
    open(os.path.join(d, 'segnalazioni.json'), 'w').write('{"voci":[{"k":"fonte","u":"https://x.it/a","s":"20261018-x"},{"k":"sintesi","s":"20261018-y"}]}')
    bad, off = E.load_reports(d)
    check('segnalazioni', bad == {'https://x.it/a'} and off == {'20261018-y'})

if FAIL:
    print('CONTROLLI NON SUPERATI:', ', '.join(FAIL))
    sys.exit(1)
print('controlli superati', datetime.now(timezone.utc).strftime('%H:%M'))
