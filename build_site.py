#!/usr/bin/env python3
"""Compone il sito statico di Eddy (web app installabile, una sola pagina).

  python build_site.py OUT [BUILD_ID]

Scrive OUT/index.html (app, stile e mappe in un solo file), OUT/sw.js, OUT/manifest.webmanifest,
OUT/icons/. I dati (OUT/data) e i loghi (OUT/logos) li aggiunge il workflow.
"""
import json
import os
import shutil
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'site_src')
out = sys.argv[1]
build = sys.argv[2] if len(sys.argv) > 2 else time.strftime('%Y%m%d%H%M')
os.makedirs(out, exist_ok=True)

page = open(os.path.join(SRC, 'page.html'), encoding='utf-8').read()
app = open(os.path.join(SRC, 'app.js'), encoding='utf-8').read()
geo = open(os.path.join(HERE, 'pipeline', 'world.json'), encoding='utf-8').read().strip()
assert '/*__GEO__*/null' in app and '/*__APP__*/' in page
cut = page.index('</style>') + len('</style>')
head_part, body_part = page[:cut], page[cut:]

DESC = "Le notizie del giorno raccontate da tutte le testate che ne parlano: italiane ed estere, tradotte, riunite in un'unica storia."
EXTRA_CSS = ""  # lo stile completo è in site_src/page.html

HEAD = f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#F2F4F1" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0B0F0E" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Eddy">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="format-detection" content="telephone=no">
<meta property="og:title" content="Eddy">
<meta property="og:description" content="{DESC}">
<meta property="og:image" content="icons/icon-512.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="48x48" href="icons/icon-48.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
"""
html = HEAD + head_part + '\n' + EXTRA_CSS + '\n</head>\n<body>' + body_part.replace('/*__APP__*/', app.replace('/*__GEO__*/null', geo)) + '\n</body>\n</html>\n'
import hashlib
build = hashlib.sha1((html + open(os.path.join(SRC, 'sw.js'), encoding='utf-8').read()).encode('utf-8')).hexdigest()[:10]
# l'app conosce la propria versione e la confronta con version.json per ricaricarsi da sola dopo una pubblicazione
assert html.count("'__EDDY_BUILD__'") == 1
html = html.replace("'__EDDY_BUILD__'", "'" + build + "'")
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(html)
sw = open(os.path.join(SRC, 'sw.js'), encoding='utf-8').read().replace('__BUILD__', build)
open(os.path.join(out, 'sw.js'), 'w', encoding='utf-8').write(sw)
json.dump({'b': build}, open(os.path.join(out, 'version.json'), 'w', encoding='utf-8'))

manifest = {
    'name': 'Eddy — le notizie a più voci', 'short_name': 'Eddy', 'description': DESC, 'lang': 'it', 'dir': 'ltr',
    'id': './', 'start_url': './#oggi', 'scope': './', 'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#F2F4F1', 'theme_color': '#F2F4F1', 'categories': ['news'],
    'icons': [
        {'src': 'icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
        {'src': 'icons/maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
    ],
    'shortcuts': [
        {'name': 'Per te', 'url': './#perte', 'icons': [{'src': 'icons/icon-96.png', 'sizes': '96x96'}]},
        {'name': 'Salvati', 'url': './#salvati', 'icons': [{'src': 'icons/icon-96.png', 'sizes': '96x96'}]},
    ],
}
json.dump(manifest, open(os.path.join(out, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
if os.path.isdir(os.path.join(SRC, 'icons')):
    shutil.copytree(os.path.join(SRC, 'icons'), os.path.join(out, 'icons'), dirs_exist_ok=True)
else:
    sys.path.insert(0, HERE)
    import make_icons
    make_icons.main(os.path.join(out, 'icons'))
open(os.path.join(out, '.nojekyll'), 'w').close()
print('sito pronto in', out, '-', len(html) // 1024, 'KB')
