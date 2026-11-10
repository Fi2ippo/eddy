#!/usr/bin/env python3
"""Compone il sito statico di Eddy (web app installabile, una sola pagina).

  python build_site.py OUT [BUILD_ID]

Scrive OUT/index.html (app, stile e mappe in un solo file), OUT/sw.js, OUT/manifest.webmanifest,
OUT/icons/, OUT/fonts/. I dati (OUT/data) e i loghi (OUT/logos) li aggiunge il workflow.
Se OUT/data c'è già, scrive anche una pagina da condividere per ogni storia (OUT/s/<id>/index.html) e OUT/404.html.
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
<meta name="theme-color" content="#FFFFFF">
<meta name="color-scheme" content="light">
<link rel="preload" href="fonts/schibsted-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
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
    'background_color': '#FFFFFF', 'theme_color': '#FFFFFF', 'categories': ['news'],
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
# carattere Schibsted Grotesk (licenza OFL, in site_src/fonts con il testo della licenza): servito dal sito stesso
shutil.copytree(os.path.join(SRC, 'fonts'), os.path.join(out, 'fonts'), dirs_exist_ok=True)
open(os.path.join(out, '.nojekyll'), 'w').close()
print('sito pronto in', out, '-', len(html) // 1024, 'KB')


# ---------- pagine da condividere: una per storia (OUT/s/<id>/index.html) ----------
# WhatsApp e gli altri leggono solo l'<head> della pagina (mai quello che sta dopo "#"): ogni storia ha la sua pagina con
# titolo, frase di una testata e foto originale della testata; chi la apre passa subito all'app (../../#s-<id>).
import html as H
import re
from urllib.parse import urlparse

SITE = os.environ.get('EDDY_URL', 'https://fi2ippo.github.io/eddy/').rstrip('/') + '/'
ID_OK = re.compile(r'^[a-z0-9][a-z0-9-]{0,150}$')
ATTR = re.compile(r'\s\(([^()]{2,80})\)\s*$')


def esc(x):
    return H.escape(str(x or ''), quote=True)


def cut(text, n):
    text = ' '.join(str(text or '').split())
    if len(text) <= n:
        return text
    t = text[:n - 1]
    if ' ' in t[n // 2:]:
        t = t[:t.rindex(' ')]
    return t.rstrip(' ,;:.') + '…'


def phrase(s, outlets):
    """Una frase di una testata con il suo nome: il primo passaggio del sommario o la prima frase di una testata."""
    if not s.get('sumOff'):
        paras = [p.strip() for p in str(s.get('summary') or '').split('\n\n') if p.strip()]
        if paras:
            p = paras[0]
            m = ATTR.search(p)
            body, attr = (p[:m.start()], ' (' + m.group(1) + ')') if m else (p, '')
            return cut(body, 200 - len(attr)) + attr
    srcs = [x for x in s.get('sources') or [] if str(x.get('s') or '').strip()]
    if not srcs:
        return ''
    dek = ' '.join(str(s.get('dek') or '').split())[:40]
    x = next((x for x in srcs if dek and ' '.join(x['s'].split()).startswith(dek)), srcs[0])
    attr = ' (' + outlets.get(x.get('o'), {}).get('name', x.get('o', '')) + (', tradotto' if x.get('l', 'it') != 'it' else '') + ')'
    return cut(x['s'], 200 - len(attr)) + attr


SHARE_CSS = """*{box-sizing:border-box}html,body{margin:0;background:#FFFFFF;color:#111216;font:400 16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:640px;margin:0 auto;padding:24px 16px 48px}.brand{margin:0 0 20px;font-size:19px;font-weight:800}.brand a{color:#111216;text-decoration:none}
h1{margin:0 0 16px;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:-.01em}figure{margin:0 0 16px}
img{display:block;width:100%;height:auto;border-radius:14px;background:#F4F5F7}figcaption,.small{font-size:13px;color:#6B6E76}figcaption{margin-top:6px}
h2{margin:28px 0 8px;font-size:15px;font-weight:800}ul{margin:0;padding:0;list-style:none}li{padding:10px 0;border-top:1px solid #E1E3E7}
li a{color:#111216;font-weight:700}.btn{display:flex;align-items:center;justify-content:center;min-height:54px;margin-top:28px;border-radius:999px;background:#111216;color:#FFFFFF;font-weight:800;text-decoration:none}"""


def share_page(s, outlets):
    sid = s['id']
    title = ' '.join(str(s.get('headline') or 'Eddy').split())
    srcs = s.get('sources') or []
    ids = list(dict.fromkeys(list(s.get('outletIds') or []) + [x.get('o') for x in srcs if x.get('o')]))
    n = max(1, len(ids))
    text = phrase(s, outlets)
    desc = (text + ' · ' if text else '') + f"{n} {'testata' if n == 1 else 'testate'}"
    img = s.get('img') or {}
    iu = str(img.get('u') or '')
    has_img = iu.startswith('https://') or iu.startswith('http://')
    url = SITE + 's/' + sid + '/'
    app = '../../#s-' + sid
    meta = [
        ('property', 'og:type', 'article'), ('property', 'og:site_name', 'Eddy'), ('property', 'og:locale', 'it_IT'),
        ('property', 'og:title', title), ('property', 'og:description', desc), ('property', 'og:url', url),
        ('property', 'og:image', iu if has_img else SITE + 'icons/icon-512.png'),
    ]
    if has_img and img.get('w') and img.get('h'):
        meta += [('property', 'og:image:width', str(img['w'])), ('property', 'og:image:height', str(img['h']))]
    meta += [('name', 'twitter:card', 'summary_large_image'), ('name', 'twitter:title', title), ('name', 'twitter:description', desc),
             ('name', 'twitter:image', iu if has_img else SITE + 'icons/icon-512.png')]
    head = ''.join(f'<meta {k}="{v}" content="{esc(c)}">\n' for k, v, c in meta)
    photo = ''
    if has_img:
        credit = outlets.get(img.get('o'), {}).get('name', '')
        photo = (f'<figure><img src="{esc(iu)}" alt="" referrerpolicy="no-referrer" loading="lazy">'
                 + (f'<figcaption>Foto: {esc(credit)}</figcaption>' if credit else '') + '</figure>\n')
    rows = []
    for x in srcs[:30]:
        if not str(x.get('u') or '').startswith(('https://', 'http://')):
            continue
        name = outlets.get(x.get('o'), {}).get('name', x.get('o', ''))
        rows.append(f'<li><a href="{esc(x["u"])}" rel="noopener nofollow">{esc(name)}</a><br><span class="small">{esc(x.get("t") or "")}</span></li>')
    return f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#FFFFFF">
<title>{esc(title)} · Eddy</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{esc(url)}">
<link rel="icon" type="image/png" sizes="48x48" href="../../icons/icon-48.png">
{head}<style>{SHARE_CSS}</style>
<script>if(!/bot|crawler|spider|facebookexternalhit|whatsapp|telegram|slack|discord|preview/i.test(navigator.userAgent))location.replace({json.dumps(app)});</script>
</head>
<body>
<main>
<p class="brand"><a href="../../">eddy</a></p>
<h1>{esc(title)}</h1>
{photo}{f'<p>{esc(text)}</p>' if text else ''}
<h2>Raccontata da</h2>
<ul>
{chr(10).join(rows)}
</ul>
<a class="btn" href="{esc(app)}">Apri in Eddy</a>
</main>
</body>
</html>
"""


def read_stories(name):
    try:
        return json.load(open(os.path.join(out, 'data', name), encoding='utf-8'))
    except (OSError, ValueError):
        return {}


feed = read_stories('feed.json')
outlets = feed.get('outlets') or {}
stories = {}
for st in (feed.get('stories') or []) + (read_stories('archive.json').get('stories') or []):
    if isinstance(st, dict) and ID_OK.match(str(st.get('id') or '')) and st['id'] not in stories:
        stories[st['id']] = st
sdir = os.path.join(out, 's')
shutil.rmtree(sdir, ignore_errors=True)
total = 0
for sid, st in stories.items():
    os.makedirs(os.path.join(sdir, sid), exist_ok=True)
    page_html = share_page(st, outlets)
    total += len(page_html.encode('utf-8'))
    open(os.path.join(sdir, sid, 'index.html'), 'w', encoding='utf-8').write(page_html)

# indirizzo che non esiste (più): /s/<id>/ di una storia uscita porta all'app, che avvisa "Questa notizia non è più su Eddy"
base = urlparse(SITE).path or '/'
NOT_FOUND = f"""<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#FFFFFF">
<title>Eddy</title>
<style>{SHARE_CSS}</style>
<script>(function(){{var m=location.pathname.match(/^(.*\\/)s\\/([a-z0-9-]+)\\/?(?:index\\.html)?$/);if(m)location.replace(m[1]+'#s-'+m[2]);}})();</script>
</head>
<body>
<main>
<p class="brand"><a href="{esc(base)}">eddy</a></p>
<h1>Pagina non trovata</h1>
<p>Questo indirizzo non è (più) su Eddy.</p>
<a class="btn" href="{esc(base)}">Apri Eddy</a>
</main>
</body>
</html>
"""
open(os.path.join(out, '404.html'), 'w', encoding='utf-8').write(NOT_FOUND)
print('pagine da condividere:', len(stories), '-', total // 1024, 'KB')
