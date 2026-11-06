#!/usr/bin/env python3
"""Segnalazioni dall'app: legge le issue aperte «[Eddy] …» del repository e le trasforma in correzioni per la redazione.

  python reports.py STATE

Ogni issue creata dal pulsante «Segnala» contiene una riga  eddy:{"k": "fonte"|"sintesi", "s": ID_STORIA, "u": URL_ARTICOLO}
Valgono solo le issue aperte dal proprietario del repository (o da chi ha accesso in scrittura): chiunque può aprire
issue su un repository pubblico. Le segnalazioni accettate finiscono in STATE/segnalazioni.json e l'issue viene chiusa
con un commento. Senza GH_TOKEN, senza rete o con le issue disattivate lo script non fa nulla e non blocca il giro.
"""
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

STATE = sys.argv[1]
REPO = os.environ.get('GITHUB_REPOSITORY', '')
TOKEN = os.environ.get('GH_TOKEN', '')
API = os.environ.get('GITHUB_API_URL', 'https://api.github.com')
OWNER = REPO.split('/')[0].lower() if '/' in REPO else ''
TRUSTED = {'OWNER', 'MEMBER', 'COLLABORATOR'}
LINE = re.compile(r'^eddy:(\{.*\})\s*$', re.M)
KEEP_DAYS = 30
PATH = os.path.join(STATE, 'segnalazioni.json')


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/vnd.github+json',
                                          'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'eddy-redazione'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or 'null')


def parse(issue):
    m = LINE.search(issue.get('body') or '')
    if not m:
        return None
    try:
        d = json.loads(m.group(1))
    except ValueError:
        return None
    k, s, u = d.get('k'), str(d.get('s') or '')[:160], str(d.get('u') or '')[:600]
    if k not in ('fonte', 'sintesi') or not re.fullmatch(r'[\w.-]{6,160}', s):
        return None
    if k == 'fonte' and not re.match(r'https?://[^\s/]+/', u):
        return None
    return {'k': k, 's': s, 'u': u if k == 'fonte' else '', 'n': issue['number'], 'at': issue.get('created_at') or ''}


def main():
    data = {'voci': []}
    try:
        data = json.load(open(PATH, encoding='utf-8')) or data
    except (OSError, ValueError):
        pass
    # le segnalazioni vecchie decadono: le storie di più di un mese non sono più nel feed
    cut = (datetime.now(timezone.utc) - timedelta(days=KEEP_DAYS)).strftime('%Y-%m-%dT%H:%M:%SZ')
    data['voci'] = [v for v in data.get('voci', []) if (v.get('at') or cut) >= cut]
    if not (TOKEN and REPO):
        print('segnalazioni: niente token o repository, salto')
    else:
        try:
            issues = call('GET', f'/repos/{REPO}/issues?state=open&per_page=50&sort=created&direction=asc') or []
        except Exception as e:  # issue disattivate, permessi, rete: il giro continua
            print('segnalazioni non lette:', e)
            issues = []
        seen = {v['n'] for v in data['voci']}
        for it in issues:
            if it.get('pull_request') or not (it.get('title') or '').startswith('[Eddy]'):
                continue
            who = ((it.get('user') or {}).get('login') or '').lower()
            if it.get('author_association') not in TRUSTED and who != OWNER:
                continue
            v = parse(it)
            msg = 'Segnalazione non leggibile: manca la riga eddy:{…} creata dall\'app.'
            if v and v['n'] in seen:
                msg = 'Segnalazione già registrata.'
            elif v:
                data['voci'].append(v)
                seen.add(v['n'])
                msg = ('Ricevuta: dal prossimo aggiornamento l\'articolo non viene più raggruppato in questa storia.' if v['k'] == 'fonte'
                       else 'Ricevuta: la sintesi automatica di questa storia è ritirata; restano i titoli originali delle testate.')
            try:
                call('POST', f'/repos/{REPO}/issues/{it["number"]}/comments', {'body': msg})
                call('PATCH', f'/repos/{REPO}/issues/{it["number"]}', {'state': 'closed', 'state_reason': 'completed'})
            except Exception as e:
                print('issue non chiusa:', it['number'], e)
    data['voci'] = data['voci'][-500:]
    tmp = PATH + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)
    os.replace(tmp, PATH)
    print('segnalazioni attive:', len(data['voci']))


if __name__ == '__main__':
    main()
