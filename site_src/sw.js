/* Eddy: service worker. Guscio dell'app in cache, notizie dalla rete con copia di riserva, foto in cache limitata. */
const V = 'eddy-app-__BUILD__';
const DATA = 'eddy-data';
const LOGOS = 'eddy-logos';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './fonts/schibsted-grotesk-latin.woff2', './fonts/schibsted-grotesk-latin-ext.woff2'];

self.addEventListener('install', e => {
  // cache: 'reload' scavalca la cache HTTP del browser (10 minuti su GitHub Pages): il guscio nuovo è davvero nuovo
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('eddy-app-') && k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function bare(url) { const u = new URL(url); return u.origin + u.pathname; }

// ms: con una rete lenta (ma non assente) dopo ms millisecondi si mostra la copia salvata, subito,
// mentre la richiesta prosegue e aggiorna la cache per la prossima apertura.
async function networkFirst(req, cacheName, key, mark, ms, keep) {
  const c = await caches.open(cacheName);
  try {
    const got = fetch(req).then(r => { if (r && r.ok) c.put(key || req, r.clone()); return r; });
    if (ms) {
      const old = await c.match(key || req);
      if (old) {
        got.catch(() => {});
        if (keep) keep(got.catch(() => {}));  // il service worker resta vivo finché la cache non è aggiornata
        let timer;
        const slow = new Promise(res => { timer = setTimeout(() => res(null), ms); });
        const r = await Promise.race([got, slow]);
        clearTimeout(timer);
        if (r) return r;
        // copia vecchia, ma la rete risponde: l'app lo sa (X-Eddy-Stale) e ricontrolla dopo poco
        const h = new Headers(old.headers);
        h.set('X-Eddy-Stale', '1');
        return new Response(await old.blob(), {status: old.status, statusText: old.statusText, headers: h});
      }
    }
    return await got;
  } catch (err) {
    const hit = await c.match(key || req);
    if (!hit) throw err;
    if (!mark) return hit;
    const h = new Headers(hit.headers);
    h.set('X-Eddy-Offline', '1');
    return new Response(await hit.blob(), {status: hit.status, statusText: hit.statusText, headers: h});
  }
}
async function cacheFirst(req, cacheName, limit) {
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r && r.ok) {
    c.put(req, r.clone());
    if (limit) trim(c, limit);
  }
  return r;
}
async function trim(c, limit) {
  const keys = await c.keys();
  for (let i = 0; i < keys.length - limit; i++) await c.delete(keys[i]);
}
async function staleWhileRevalidate(req, cacheName) {
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) {
    if (u.pathname.endsWith('/version.json')) return;
    if (u.pathname.includes('/data/')) { e.respondWith(networkFirst(req, DATA, bare(req.url), true, u.searchParams.has('t') ? 0 : 5000, p => e.waitUntil(p))); return; }
    // pagine da condividere (s/<id>/) e 404: vanno sempre al server, mai salvate al posto dell'app
    if (req.mode === 'navigate' && /\/s\/[^/]+\/?(index\.html)?$/.test(u.pathname)) return;
    if (req.mode === 'navigate') {
      // la pagina si chiede sempre al server (risposta 304 se invariata), mai la copia vecchia della cache HTTP
      e.respondWith(networkFirst(new Request(req.url, {cache: 'no-cache', credentials: 'same-origin'}), V, './index.html').catch(() => caches.match('./index.html')));
      return;
    }
    if (u.pathname.includes('/logos/')) { e.respondWith(cacheFirst(req, LOGOS, 160)); return; }
    if (u.pathname.includes('/icons/') || u.pathname.includes('/fonts/')) { e.respondWith(cacheFirst(req, V)); return; }
    if (u.pathname.endsWith('.apk')) return;
    e.respondWith(staleWhileRevalidate(req, V));
    return;
  }
});
