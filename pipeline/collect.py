"""Raccolta delle notizie per Eddy, versione 4 (gira su GitHub Actions ogni quarto d'ora).

Uso: python collect.py sources.json STATE
STATE è la copia del ramo "dati" della raccolta precedente: viene aggiornata sul posto.

Per ogni testata di sources.json legge i feed; se non ne ricava nulla cerca i feed dichiarati
nella home page, e come ultima risorsa usa Google News limitato al dominio della testata.
Tiene le voci delle ultime HOURS ore (unendo quelle già viste nelle ore precedenti), verifica le foto
nuove senza conservarle (restano sui siti delle testate), scarica i loghi delle testate e scrive:
  items.json     voci {k,o,t,u,d,fs,a,s,img,ik,iw,ih,l,h,nd?,via?}
  status.json    esito per testata e per feed, ora di generazione
  outlets.json   anagrafica delle testate (nome, sigla, colore, lingua, sito, sezione)
  logos.json     loghi {o: {sha,w,h,bleed,bg,src,at}}; file in logos/<o>.png
  feedcache.json feed scoperti automaticamente
"""
import hashlib
import html
import io
import json
import os
import re
import sys
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import datetime, timedelta, timezone
from urllib.parse import quote_plus, urljoin, urlparse
from zoneinfo import ZoneInfo

import feedparser
import requests
import urllib3
from dateutil import parser as dparser
from PIL import Image, ImageOps, ImageStat

try:
    import cairosvg  # facoltativo: loghi in SVG
except Exception:  # noqa: BLE001
    cairosvg = None

HOURS = 36
PER_FEED = 25
PER_OUTLET = 45
MAX_ITEMS = 2000
MIN_PER_OUTLET = 12  # voci più recenti garantite a ogni testata (le riviste che pubblicano poco non vengono spinte fuori)
MAX_W = 960
LOGO = 192
LOGO_MAX_AGE_DAYS = 14
TRIES = 2          # tentativi massimi per trovare/verificare la foto di una voce (poi non si riprova a ogni giro)
FEED_BUDGET = 240  # secondi per leggere tutti i feed
PHOTO_BUDGET = 420  # secondo (dall'avvio) oltre il quale non si cercano più foto
LOGO_BUDGET = 480   # secondo oltre il quale non si cercano più loghi
T0 = time.monotonic()
STUCK = []  # testate non terminate nel tempo concesso
FAILED = []  # testate fermate da un errore del codice (non da un sito lento): se sono troppe il passo diventa rosso
HUNG = []   # fasi con richieste rimaste appese (si esce senza attenderle)
NOW = datetime.now(timezone.utc)
ROME = ZoneInfo('Europe/Rome')
REPO = os.environ.get('GITHUB_REPOSITORY', 'eddy')
CHROME = ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
          '(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36')
LANG_HDR = 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.5,es;q=0.5,de;q=0.5'
FEED_ACCEPT = 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.7'
PROFILES = [
    {'User-Agent': CHROME, 'Accept': FEED_ACCEPT, 'Accept-Language': LANG_HDR, 'Cache-Control': 'no-cache'},
    {'User-Agent': f'Mozilla/5.0 (compatible; EddyReader/3.0; +https://github.com/{REPO})', 'Accept': FEED_ACCEPT},
]
HTML_HDR = {'User-Agent': CHROME, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': LANG_HDR}
SESSION = requests.Session()
ADAPTER = requests.adapters.HTTPAdapter(pool_connections=64, pool_maxsize=64, max_retries=0)
SESSION.mount('https://', ADAPTER)
SESSION.mount('http://', ADAPTER)

TAG = re.compile(r'<[^>]+>')
IMG_IN_HTML = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.I)
OG = re.compile(r'<meta[^>]+(?:property|name)=["\'](?:og:image|twitter:image)(?::src|:url)?["\'][^>]*content=["\']([^"\']+)["\']', re.I)
OG2 = re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\'](?:og:image|twitter:image)(?::src|:url)?["\']', re.I)
LINK_TAG = re.compile(r'<link\b[^>]*>', re.I)
ATTR = re.compile(r'([a-zA-Z:-]+)\s*=\s*("([^"]*)"|\'([^\']*)\'|([^\s>]+))')
BAD_IMG = re.compile(r'(logo|placeholder|default[-_]?(image|img|thumb)|blank|spacer|avatar|sprite|pixel|1x1|favicon|gravatar)', re.I)
SKIP_URL = re.compile(r'\.(mp4|mp3|m3u8|m4a|webm|ogg|pdf)(\?|$)', re.I)


# ---------------------------------------------------------------- utilità
def clean(s, n=None):
    s = html.unescape(TAG.sub(' ', s or ''))
    s = re.sub(r'\s+', ' ', s).strip()
    return (s[:n].rsplit(' ', 1)[0] + '…') if n and len(s) > n else s


def iso(dt):
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def parse_iso(s):
    try:
        return datetime.strptime(s, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    except Exception:  # noqa: BLE001
        return None


def attrs(tag):
    out = {}
    for m in ATTR.finditer(tag):
        out[m.group(1).lower()] = html.unescape(m.group(3) if m.group(3) is not None else m.group(4) if m.group(4) is not None else m.group(5) or '')
    return out


def host(u):
    h = urlparse(u).netloc.lower()
    return h[4:] if h.startswith('www.') else h


def load_json(path, default):
    try:
        with open(path, encoding='utf-8') as fh:
            return json.load(fh)
    except Exception:  # noqa: BLE001
        return default


def dump_json(path, data, pretty=False):
    # scrittura atomica: se il giro viene interrotto resta il file precedente, mai uno troncato
    tmp = path + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as fh:
        if pretty:
            json.dump(data, fh, ensure_ascii=False, indent=1)
        else:
            json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
    os.replace(tmp, path)


# ---------------------------------------------------------------- date in più lingue
class Multi(dparser.parserinfo):
    MONTHS = [
        ('Jan', 'January', 'gen', 'gennaio', 'janv', 'janvier', 'ene', 'enero', 'jän', 'januar', 'jänner'),
        ('Feb', 'February', 'febbraio', 'fév', 'févr', 'février', 'fev', 'fevr', 'febrero', 'februar'),
        ('Mar', 'March', 'marzo', 'mars', 'mär', 'märz', 'maerz'),
        ('Apr', 'April', 'aprile', 'avr', 'avril', 'abr', 'abril'),
        ('May', 'mag', 'maggio', 'mai', 'mayo'),
        ('Jun', 'June', 'giu', 'giugno', 'juin', 'junio', 'juni'),
        ('Jul', 'July', 'lug', 'luglio', 'juil', 'juillet', 'julio', 'juli'),
        ('Aug', 'August', 'ago', 'agosto', 'août', 'aout'),
        ('Sep', 'Sept', 'September', 'set', 'settembre', 'septembre', 'septiembre', 'setiembre'),
        ('Oct', 'October', 'ott', 'ottobre', 'octobre', 'octubre', 'okt', 'oktober'),
        ('Nov', 'November', 'novembre', 'noviembre'),
        ('Dec', 'December', 'dic', 'dicembre', 'déc', 'décembre', 'diciembre', 'dez', 'dezember'),
    ]


PINFO = Multi()
TZS = {'CET': 3600, 'CEST': 7200, 'BST': 3600, 'GMT': 0, 'UTC': 0, 'UT': 0, 'Z': 0, 'EST': -18000, 'EDT': -14400,
       'CST': -21600, 'CDT': -18000, 'PST': -28800, 'PDT': -25200, 'IST': 19800, 'JST': 32400, 'AEST': 36000, 'AEDT': 39600}
LEAD_DAY = re.compile(r'^\s*[^\W\d_]{2,12}\.?,?\s+(?=\d)', re.U)


def parse_text_date(s, local):
    s = (s or '').strip()
    if not s:
        return None
    s2 = LEAD_DAY.sub('', s)
    s2 = re.sub(r'\b(ore|alle|à|a las|um)\b', ' ', s2, flags=re.I)
    try:
        dt = dparser.parse(s2, parserinfo=PINFO, tzinfos=TZS, fuzzy=True)
    except Exception:  # noqa: BLE001
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=local)
    return dt


HAS_TZ = re.compile(r'(\dZ|[+-]\d{2}:?\d{2}|\b(GMT|UTC|UT|[ECMP][SD]T|CES?T|BST|JST|IST|AES?D?T))\s*$', re.I)


def entry_date(e, src):
    rome_local = src.get('rome_local')
    local = ROME if src.get('lang') in ('it', 'fr', 'de', 'es') else timezone.utc
    raw = next((str(e.get(k)).strip() for k in ('published', 'updated', 'dc_date', 'pubdate', 'date', 'created') if e.get(k)), '')
    st = e.get('published_parsed') or e.get('updated_parsed')
    dt = None
    if st and not rome_local and (HAS_TZ.search(raw) or not raw):
        dt = datetime(*st[:6], tzinfo=timezone.utc)
    if dt is None:
        dt = parse_text_date(raw, local)
        if dt is None and st:
            dt = datetime(*st[:6], tzinfo=timezone.utc)
        if dt is not None and rome_local:  # dichiara GMT ma pubblica l'ora italiana
            dt = dt.replace(tzinfo=None).replace(tzinfo=ROME)
    if dt is None:
        return None
    dt = dt.astimezone(timezone.utc)
    if dt > NOW + timedelta(minutes=20) and not rome_local:
        alt = dt.replace(tzinfo=None).replace(tzinfo=ROME).astimezone(timezone.utc)
        if alt > NOW + timedelta(minutes=20):
            # data nel futuro anche come ora italiana (es. feed con date di giorni dopo): si tratta come senza data,
            # cioè vale la prima volta che la vediamo (prima diventava "adesso" a ogni giro e restava sempre in cima)
            return None
        dt = alt
    return min(dt, NOW)


# ---------------------------------------------------------------- rete
def fetch(url, timeout=(6, 16), profiles=PROFILES):
    last, err = None, None
    for hdr in profiles:
        try:
            r = SESSION.get(url, headers=hdr, timeout=timeout)
            last = r
            if r.status_code in (401, 403, 406, 429, 451, 503) and hdr is not profiles[-1]:
                continue
            return r, None
        except Exception as ex:  # noqa: BLE001  # host irraggiungibile: inutile riprovare con altre intestazioni
            return None, str(ex)[:160]
    return last, err


def image_of(e):
    for key in ('media_content', 'media_thumbnail'):
        best, bw = None, -1
        for m in e.get(key) or []:
            u = m.get('url')
            if not u or SKIP_URL.search(u) or (m.get('medium') and m.get('medium') != 'image'):
                continue
            try:
                w = int(m.get('width') or 0)
            except ValueError:
                w = 0
            if w > bw:
                best, bw = u, w
        if best:
            return best
    for enc in e.get('enclosures') or []:
        if (enc.get('type') or '').startswith('image') and enc.get('href'):
            return enc['href']
    for lk in e.get('links') or []:
        if (lk.get('type') or '').startswith('image') and lk.get('href'):
            return lk['href']
    blobs = [e.get('summary') or ''] + [c.get('value', '') for c in e.get('content') or []]
    for b in blobs:
        m = IMG_IN_HTML.search(b)
        if m:
            return m.group(1)
    return None


# ---------------------------------------------------------------- feed
def read_feed(src, url, hint, seen_first):
    diag = {'o': src['o'], 'u': url, 'st': None, 'n': 0, 'k': 0}
    out = []
    r, err = fetch(url)
    if r is None:
        diag['err'] = err or 'nessuna risposta'
        return diag, out
    diag['st'] = r.status_code
    if r.status_code >= 400:
        diag['err'] = f'HTTP {r.status_code}'
        return diag, out
    p = feedparser.parse(r.content)
    diag['n'] = len(p.entries)
    if not p.entries:
        ctype = r.headers.get('content-type', '')
        diag['err'] = 'nessuna voce' + (f' ({ctype.split(";")[0]})' if ctype else '')
        return diag, out
    for i, e in enumerate(p.entries):
        link = (e.get('link') or '').strip()
        title = clean(e.get('title'))
        if not link or not title:
            continue
        link = urljoin(url, link)
        k = hashlib.sha1(link.encode()).hexdigest()[:12]
        d = entry_date(e, src)
        nd = False
        if d is None:
            if k in seen_first:
                d = seen_first[k]
            elif i < 10:  # senza data: solo le prime voci, datate alla prima volta che le vediamo
                d = NOW - timedelta(minutes=i)
            else:
                continue
            nd = True
        if NOW - d > timedelta(hours=HOURS):
            continue
        img = image_of(e)
        if img:
            img = urljoin(link, html.unescape(img).strip())
        it = {'k': k, 'o': src['o'], 't': title[:300], 'u': link, 'd': iso(d),
              'a': (clean(e.get('author')) or '')[:80] or None,
              's': clean(e.get('summary'), 260), 'img': img, 'l': src.get('lang', 'it')}
        if hint:
            it['h'] = hint
        if nd:
            it['nd'] = True
        out.append(it)
    out.sort(key=lambda x: x['d'], reverse=True)
    out = out[:PER_FEED]
    diag['k'] = len(out)
    if p.get('bozo') and not out:
        diag['err'] = 'feed malformato'
    return diag, out


def discover(src, tried):
    """Feed dichiarati nella home page (link rel=alternate) più alcuni percorsi comuni."""
    site = src['site'].rstrip('/') + '/'
    found = []
    r, _ = fetch(site, timeout=(6, 14), profiles=[HTML_HDR])
    if r is None:
        return []
    if r.status_code < 400:
        text = r.text[:600_000]
        for tag in LINK_TAG.findall(text):
            a = attrs(tag)
            if 'alternate' in (a.get('rel') or '').lower() and re.search(r'(rss|atom)\+xml', a.get('type') or '', re.I) and a.get('href'):
                found.append(urljoin(site, a['href']))
    for p in ('feed/', 'rss.xml', 'rss/', 'feed', 'feed.xml'):
        found.append(urljoin(site, p))
    seen, out = set(tried), []
    for u in found:
        if u not in seen and 'comments' not in u:
            seen.add(u)
            out.append(u)
    return out[:9]


GN_LOC = {'it': ('it', 'IT', 'IT:it'), 'en': ('en-US', 'US', 'US:en'), 'fr': ('fr', 'FR', 'FR:fr'),
          'es': ('es', 'ES', 'ES:es'), 'de': ('de', 'DE', 'DE:de')}


def google_news(src, seen_first):
    dom = src.get('gn') if isinstance(src.get('gn'), str) else host(src['site'])
    hl, gl, ceid = GN_LOC.get(src.get('lang', 'it'), GN_LOC['en'])
    q = 'site:' + dom + (' ' + src['gnq'] if src.get('gnq') else '') + ' when:2d'
    url = f'https://news.google.com/rss/search?q={quote_plus(q)}&hl={hl}&gl={gl}&ceid={ceid}'
    diag, items = read_feed(src, url, None, seen_first)
    diag['via'] = 'gn'
    for it in items:
        it['via'] = 'gn'
        it['img'] = None
        it['s'] = ''
        it['t'] = re.sub(r'\s+[-–—|]\s+[^-–—|]{2,60}$', '', it['t']).strip() or it['t']
    return diag, items


def process_outlet(src, seen_first, cache):
    diags, items, entries = [], [], 0
    feeds = [(f['u'], f.get('h')) for f in src.get('feeds', [])]
    cached = cache.get(src['o'], {}).get('u')
    if cached and cached not in [u for u, _ in feeds]:
        feeds.insert(0, (cached, None))
    tried = []
    for u, h in feeds:
        if late(FEED_BUDGET):  # tempo finito: si tiene quello che c'è già, il resto al prossimo giro
            diags.append({'o': src['o'], 'u': u, 'st': None, 'n': 0, 'k': 0, 'err': 'tempo scaduto'})
            continue
        tried.append(u)
        d, got = read_feed(src, u, h, seen_first)
        diags.append(d)
        entries += d['n']
        items.extend(got)
    newcache = None
    if entries == 0 and not late(FEED_BUDGET):
        for u in discover(src, tried):
            if late(FEED_BUDGET):
                break
            d, got = read_feed(src, u, None, seen_first)
            d['via'] = 'scoperto'
            diags.append(d)
            if d['n']:
                items.extend(got)
                newcache = u
                break
    if not items and src.get('gn', True) and not late(FEED_BUDGET):
        d, got = google_news(src, seen_first)
        diags.append(d)
        items.extend(got)
    by_k = {}
    for it in items:
        cur = by_k.get(it['k'])
        if cur is None:
            by_k[it['k']] = it
        elif it.get('h') and not cur.get('h'):
            cur['h'] = it['h']
    uniq = sorted(by_k.values(), key=lambda x: x['d'], reverse=True)
    return src, uniq[:PER_OUTLET], diags, newcache


# ---------------------------------------------------------------- foto
def late(limit):
    return time.monotonic() - T0 > limit


def run_pool(fn, args, workers, limit):
    """Esegue fn su ogni elemento di args in parallelo, senza aspettare oltre `limit` secondi dall'avvio.
    Le richieste rimaste appese vengono lasciate indietro (HUNG) e il programma esce senza attenderle."""
    args = list(args)
    if not args:
        return
    ex = ThreadPoolExecutor(max_workers=workers)
    futs = [ex.submit(fn, a) for a in args]
    _, pending = wait(futs, timeout=max(1, limit - (time.monotonic() - T0)))
    ex.shutdown(wait=False, cancel_futures=True)
    if pending:
        HUNG.append(fn.__name__)


def og_image(item):
    """Cerca la foto nella pagina dell'articolo (og:image).

    Si conta solo l'esito definitivo (pagina letta): errori di rete, 403/429/5xx e tempo scaduto non consumano
    i tentativi, così una foto non va persa per un guasto momentaneo e le pagine già lette non si rileggono a ogni giro."""
    if late(PHOTO_BUDGET):
        return item
    try:
        with SESSION.get(item['u'], headers=HTML_HDR, timeout=(10, 10), stream=True) as r:
            if r.status_code >= 500 or r.status_code in (403, 408, 429):
                return item
            chunk = r.raw.read(350_000, decode_content=True).decode('utf-8', 'ignore')
        item['og'] = item.get('og', 0) + 1
        m = OG.search(chunk) or OG2.search(chunk)
        if m:
            item['img'] = urljoin(item['u'], html.unescape(m.group(1)).strip())
    except Exception:  # noqa: BLE001
        pass
    return item


def fetch_image(item):
    """Scarica la foto solo per verificarla (dimensioni, proporzioni, non segnaposto); non la salva."""
    if late(PHOTO_BUDGET):
        return item
    try:
        pu = urlparse(item['u'])
        ref = f'{pu.scheme}://{pu.netloc}/'
        with SESSION.get(item['img'], timeout=(10, 15), stream=True, headers={
                'User-Agent': CHROME, 'Referer': ref, 'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'}) as r:
            if r.status_code in (404, 410):  # foto sparita: esito definitivo
                item['ig'] = TRIES
                return item
            r.raise_for_status()
            data = r.raw.read(15 * 1024 * 1024, decode_content=True)
        im = ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
        if im.mode not in ('RGB', 'L'):
            im = im.convert('RGBA')
            bg = Image.new('RGB', im.size, (238, 240, 238))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        im = im.convert('RGB')
        w, h = im.size
        if w < 300 or h < 160 or not (0.5 <= w / h <= 3.2):
            item['ig'] = item.get('ig', 0) + 1
            return item
        if ImageStat.Stat(im.convert('L').resize((48, 48))).stddev[0] < 3.5:  # tinta unita: segnaposto
            item['ig'] = item.get('ig', 0) + 1
            return item
        item['ik'], item['iw'], item['ih'] = True, w, h
    except (requests.RequestException, urllib3.exceptions.HTTPError, OSError):  # rete: non conta, si riprova al prossimo giro
        pass
    except Exception:  # noqa: BLE001  # file che non è un'immagine leggibile: esito definitivo
        item['ig'] = item.get('ig', 0) + 1
    return item


# ---------------------------------------------------------------- loghi
def icon_candidates(site):
    base = site.rstrip('/') + '/'
    cands = []
    r, _ = fetch(base, timeout=(6, 14), profiles=[HTML_HDR])
    if r is not None and r.status_code < 400:
        text = r.text[:600_000]
        base = r.url if r.url else base
        manifest = None
        for tag in LINK_TAG.findall(text):
            a = attrs(tag)
            rel = (a.get('rel') or '').lower()
            href = a.get('href')
            if not href:
                continue
            if 'manifest' in rel:
                manifest = urljoin(base, href)
                continue
            if 'icon' not in rel or 'mask-icon' in rel:
                continue
            size = 0
            m = re.search(r'(\d+)x\d+', a.get('sizes') or '')
            if m:
                size = int(m.group(1))
            elif 'apple-touch' in rel:
                size = 180
            elif (a.get('type') or '').endswith('svg') or href.lower().split('?')[0].endswith('.svg'):
                size = 150
            pri = 3 if 'apple-touch' in rel else 2
            cands.append((pri, size, urljoin(base, href)))
        if manifest:
            try:
                mj = SESSION.get(manifest, headers=HTML_HDR, timeout=12).json()
                for ic in mj.get('icons') or []:
                    m = re.search(r'(\d+)x\d+', ic.get('sizes') or '')
                    size = int(m.group(1)) if m else 0
                    if ic.get('src') and 'maskable' not in (ic.get('purpose') or ''):
                        cands.append((3, min(size, 512), urljoin(manifest, ic['src'])))
            except Exception:  # noqa: BLE001
                pass
    cands.sort(key=lambda c: (-(c[1] >= 120), -c[0], -c[1]))
    urls = [c[2] for c in cands]
    root = f'{urlparse(base).scheme}://{urlparse(base).netloc}/'
    urls += [root + 'apple-touch-icon.png', root + 'apple-touch-icon-precomposed.png',
             f'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url={quote_plus(root)}&size=256',
             f'https://www.google.com/s2/favicons?domain={urlparse(root).netloc}&sz=256',
             root + 'favicon.ico']
    out, seen = [], set()
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def open_icon(data, url):
    head = data[:600].lstrip().lower()
    if head.startswith(b'<svg') or head.startswith(b'<?xml') and b'<svg' in data[:2000].lower():
        if not cairosvg:
            return None
        data = cairosvg.svg2png(bytestring=data, output_width=LOGO, output_height=LOGO)
    im = Image.open(io.BytesIO(data))
    if getattr(im, 'format', '') == 'ICO':
        try:
            sizes = sorted(im.ico.sizes(), key=lambda s: s[0] * s[1])
            im.size = sizes[-1]
        except Exception:  # noqa: BLE001
            pass
    im.load()
    return im.convert('RGBA')


def normalize_logo(im):
    bbox = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    side = max(w, h)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - w) // 2, (side - h) // 2))
    im = sq.resize((LOGO, LOGO), Image.LANCZOS) if side != LOGO else sq
    px = im.load()
    corners = [px[2, 2], px[LOGO - 3, 2], px[2, LOGO - 3], px[LOGO - 3, LOGO - 3]]
    bleed = all(c[3] > 245 for c in corners) and w > 0.9 * h and h > 0.9 * w
    if bleed:
        r = sum(c[0] for c in corners) // 4
        g = sum(c[1] for c in corners) // 4
        b = sum(c[2] for c in corners) // 4
        bg = '#%02X%02X%02X' % (r, g, b)
    else:
        rgb = Image.new('RGB', im.size, (0, 0, 0))
        rgb.paste(im, mask=im.getchannel('A'))
        mask = im.getchannel('A').point(lambda a: 255 if a > 128 else 0)
        stat = ImageStat.Stat(rgb.convert('L'), mask)
        lum = stat.mean[0] if stat.count and stat.count[0] else 0
        bg = '#1D2522' if lum > 215 else '#FFFFFF'
    return im, bleed, bg


def fetch_logo(src, logodir):
    best = None
    for u in icon_candidates(src['site']):
        try:
            r = SESSION.get(u, headers={'User-Agent': CHROME, 'Accept': 'image/avif,image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8'}, timeout=15)
            if r.status_code >= 400 or len(r.content) < 100 or len(r.content) > 3_000_000:
                continue
            im = open_icon(r.content, u)
            if im is None:
                continue
            size = min(im.size)
            if size < 32:
                continue
            if best is None or size > best[0]:
                best = (size, im, u)
            if size >= 120:
                break
        except Exception:  # noqa: BLE001
            continue
    if not best or best[0] < 48:
        return None
    im, bleed, bg = normalize_logo(best[1])
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    data = buf.getvalue()
    with open(os.path.join(logodir, src['o'] + '.png'), 'wb') as fh:
        fh.write(data)
    return {'sha': hashlib.sha1(data).hexdigest()[:12], 'w': LOGO, 'h': LOGO, 'bleed': bleed, 'bg': bg,
            'src': best[2][:300], 'orig': best[0], 'at': iso(NOW)}


# ---------------------------------------------------------------- principale
def main():
    sources_path, state = sys.argv[1], sys.argv[2]
    logodir = os.path.join(state, 'logos')
    os.makedirs(logodir, exist_ok=True)
    import shutil
    shutil.rmtree(os.path.join(state, 'img'), ignore_errors=True)  # versione 3: foto copiate, non più usate
    sources = load_json(sources_path, [])
    prev = load_json(os.path.join(state, 'items.json'), [])
    cache = load_json(os.path.join(state, 'feedcache.json'), {})
    logos = load_json(os.path.join(state, 'logos.json'), {})
    prev_by_k = {p['k']: p for p in prev if isinstance(p, dict) and p.get('k')}
    seen_first = {}
    for p in prev_by_k.values():
        dt = parse_iso(p.get('fs') or p.get('d') or '')
        if dt:
            seen_first[p['k']] = dt

    # Margini di tempo: il passo del workflow ha 12 minuti e, se scade, non resta salvato nulla.
    # Le testate troppo lente vengono lasciate indietro e le fasi facoltative (foto, loghi) si fermano prima,
    # così lo stato viene sempre scritto.
    # process_outlet smette da sé di aprire nuove richieste oltre FEED_BUDGET e restituisce quello che ha già;
    # chi resta appeso dentro una singola richiesta viene lasciato indietro dopo un breve supplemento.
    results = []
    ex = ThreadPoolExecutor(max_workers=16)
    futs = [(s, ex.submit(process_outlet, s, seen_first, cache)) for s in sources]
    done, _ = wait([f for _, f in futs], timeout=max(1, FEED_BUDGET + 40 - (time.monotonic() - T0)))
    ex.shutdown(wait=False, cancel_futures=True)
    for src, fut in futs:
        if fut in done and not fut.cancelled() and fut.exception() is None:
            _, items, diags, newcache = fut.result()
        else:  # testata appesa o in errore: restano le voci già viste nelle ore precedenti
            if fut in done and fut.exception() is not None:  # un difetto del codice, non una testata lenta: va segnalato
                exc = fut.exception()
                err = repr(exc)[:160]
                FAILED.append(src['o'])
                print(f"::warning::{src['o']}: errore nel codice di raccolta: {err}")
                traceback.print_exception(type(exc), exc, exc.__traceback__)
            else:
                err = 'tempo scaduto'
                STUCK.append(src['o'])
            items, diags, newcache = [], [{'o': src['o'], 'u': '-', 'st': None, 'n': 0, 'k': 0, 'err': err}], None
        results.append((src, items, diags))
        if newcache:
            cache[src['o']] = {'u': newcache, 'at': iso(NOW)}

    fresh = {}
    status_outlets, feed_diags = {}, []
    for src, items, diags in results:
        feed_diags.extend(diags)
        errs = [f"{d['u']}: {d['err']}" for d in diags if d.get('err')]
        via = sorted({d['via'] for d in diags if d.get('via') and d.get('k')})
        status_outlets[src['o']] = {'items': len(items), 'errors': errs[:6], 'via': via}
        for it in items:
            it['fs'] = iso(seen_first.get(it['k'], NOW))
            old = prev_by_k.get(it['k'])
            if old and old.get('ik') and old.get('img') and (old.get('img') == it.get('img') or not it.get('img')) and old.get('iv') == 4:
                it['ik'], it['iw'], it['ih'], it['iv'] = True, old.get('iw'), old.get('ih'), 4
                it['img'] = old['img']
            if old and old.get('og'):  # tentativi già fatti sulla pagina dell'articolo
                it['og'] = old['og']
            if old and old.get('ig') and not old.get('ik') and (old.get('img') == it.get('img') or not it.get('img')):
                # foto già scartata (troppo piccola, segnaposto, sparita): resta scartata, non si riscarica
                it['ig'] = old['ig']
                it['img'] = old.get('img')
            if old and old.get('nd') and it.get('nd'):
                it['d'] = old['d']
            fresh.setdefault(it['k'], it)

    # voci viste nelle ore precedenti e non più nei feed: restano finché sono nella finestra
    for k, p in prev_by_k.items():
        if k in fresh:
            continue
        d = parse_iso(p.get('d') or '')
        if d and NOW - d <= timedelta(hours=HOURS):
            p.setdefault('fs', p.get('d'))
            if p.get('ik') and p.get('iv') != 4:
                p['ik'] = False
            fresh[k] = p

    # richieste di rimozione: indirizzi esatti o domini in data/blocklist.json non si raccolgono più
    block = set(load_json(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'blocklist.json'), []))
    if block:
        def blocked(u):
            h = host(u)
            return u in block or any(h == b or h.endswith('.' + b) for b in block if '/' not in b)
        fresh = {k: v for k, v in fresh.items() if not blocked(v.get('u') or '')}
    by_time = sorted(fresh.values(), key=lambda x: x['d'], reverse=True)
    kept, per_o = [], {}
    for it in by_time:  # prima le voci garantite a ogni testata, poi il resto per orario
        if per_o.get(it['o'], 0) < MIN_PER_OUTLET:
            per_o[it['o']] = per_o.get(it['o'], 0) + 1
            kept.append(it)
    ids = {id(it) for it in kept}
    kept += [it for it in by_time if id(it) not in ids][:max(0, MAX_ITEMS - len(kept))]
    items = sorted(kept, key=lambda x: x['d'], reverse=True)[:max(MAX_ITEMS, len(kept))]

    # foto generiche: stessa immagine per molte voci della stessa testata
    count = {}
    for it in items:
        if it.get('img'):
            count[(it['o'], it['img'])] = count.get((it['o'], it['img']), 0) + 1
    for it in items:
        if it.get('img') and (count.get((it['o'], it['img']), 0) >= 3 or BAD_IMG.search(it['img'])) and not it.get('ik'):
            it['img'] = None

    outlets = {s['o']: {k: s[k] for k in ('name', 'short', 'color', 'kind', 'lang', 'site', 'sec', 'zona', 'mista', 'rilancia') if k in s} for s in sources}

    def save():
        dump_json(os.path.join(state, 'items.json'), items)
        dump_json(os.path.join(state, 'outlets.json'), outlets, pretty=True)
        dump_json(os.path.join(state, 'logos.json'), logos, pretty=True)
        dump_json(os.path.join(state, 'feedcache.json'), cache, pretty=True)
        dump_json(os.path.join(state, 'status.json'), {
            'generatedAt': iso(NOW), 'version': 4, 'hours': HOURS, 'items': len(items),
            'withImage': sum(1 for i in items if i['ik']), 'new': sum(1 for i in items if i['k'] not in prev_by_k),
            'logos': len(logos), 'outlets': status_outlets, 'feeds': feed_diags}, pretty=True)

    # prima copia dello stato: se foto o loghi dovessero bloccarsi, le notizie raccolte non vanno perse
    for it in items:
        it.setdefault('ik', False)
    save()

    need_og = [it for it in items if not it.get('img') and not it.get('ik') and it.get('via') != 'gn'
               and it.get('og', 0) < TRIES][:320]
    run_pool(og_image, need_og, 16, PHOTO_BUDGET + 30)
    count = {}
    for it in items:
        if it.get('img') and not it.get('ik'):
            count[(it['o'], it['img'])] = count.get((it['o'], it['img']), 0) + 1
    for it in need_og:
        if it.get('img') and (BAD_IMG.search(it['img']) or count.get((it['o'], it['img']), 0) >= 3):
            it['img'] = None
    todo = [it for it in items if it.get('img') and not it.get('ik') and it.get('ig', 0) < TRIES][:500]
    run_pool(fetch_image, todo, 16, PHOTO_BUDGET + 30)
    for it in items:
        it.setdefault('ik', False)
        if it['ik']:
            it['iv'] = 4

    # loghi: rinnovati ogni LOGO_MAX_AGE_DAYS giorni, conservati se il nuovo tentativo fallisce
    def need_logo(src):
        cur = logos.get(src['o'])
        if not cur or not os.path.exists(os.path.join(logodir, src['o'] + '.png')):
            return True
        at = parse_iso(cur.get('at') or '')
        return not at or NOW - at > timedelta(days=LOGO_MAX_AGE_DAYS)
    found = {}

    def get_logo(src):
        if not late(LOGO_BUDGET):
            try:
                info = fetch_logo(src, logodir)
            except Exception as exc:  # noqa: BLE001  # un logo che non si elabora non deve fermare la raccolta
                print(f"  logo {src['o']}: {exc!r}"[:200])
                return
            if info:
                found[src['o']] = info

    # Regola di Eddy: niente loghi scaricati e ospitati; nell'app le testate hanno bollini con le iniziali.
    # (need_logo e get_logo restano per un eventuale uso futuro con loghi a licenza libera)
    if os.environ.get('EDDY_LOGOS') == '1':
        run_pool(get_logo, [s for s in sources if need_logo(s)], 12, LOGO_BUDGET + 30)
    else:
        logos.clear()
        shutil.rmtree(logodir, ignore_errors=True)
        os.makedirs(logodir, exist_ok=True)
    logos.update(found)
    known = {s['o'] for s in sources}
    for o in list(logos):
        if o not in known:
            logos.pop(o)
            p = os.path.join(logodir, o + '.png')
            if os.path.exists(p):
                os.remove(p)

    save()
    ok = sum(1 for v in status_outlets.values() if v['items'])
    print(f"{len(items)} voci ({sum(1 for i in items if i['k'] not in prev_by_k)} nuove), "
          f"{sum(1 for i in items if i['ik'])} con foto, {ok}/{len(sources)} testate, {len(logos)} loghi")
    for o, v in sorted(status_outlets.items()):
        if not v['items'] or v['via']:
            print(f"  {o}: {v['items']} voci {' '.join(v['via'])} {'; '.join(v['errors'][:2])}")
    print(f"tempo: {time.monotonic() - T0:.0f}s" + (f", testate lasciate indietro: {', '.join(STUCK)}" if STUCK else '')
          + (f", richieste appese in: {', '.join(HUNG)}" if HUNG else ''))
    if STUCK:
        print(f"::warning::{len(STUCK)} testate non hanno risposto in tempo: restano le voci già viste")
    if FAILED and len(FAILED) > max(3, len(sources) // 4):
        print(f"::error::raccolta fermata da errori del codice in {len(FAILED)} testate su {len(sources)}: {', '.join(FAILED[:8])}")
        return 1  # lo stato è già scritto; il passo diventa rosso e «Esito del giro» lo segnala
    return 0


def leave(code):
    # con richieste rimaste appese Python aspetterebbe i loro thread fino allo scadere del passo: si esce subito
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(code)


if __name__ == '__main__':
    try:
        code = main()
    except BaseException:
        if STUCK or HUNG:
            traceback.print_exc()
            leave(1)
        raise
    if STUCK or HUNG:
        leave(code)  # lo stato è già scritto
    sys.exit(code)
