(function(){
'use strict';

/* ---------- costanti ---------- */
const TOPICS = [
  {id:'roma',      name:'Roma',       long:'Roma e provincia',    c:'#9B2242'},
  {id:'italia',    name:'Politica',   long:'Politica italiana',   c:'#D0553A'},
  {id:'mondo',     name:'Mondo',      long:'Esteri e geopolitica',c:'#2F6FD0'},
  {id:'economia',  name:'Economia',   long:'Economia e lavoro',   c:'#B7861C'},
  {id:'cronaca',   name:'Cronaca',    long:'Cronaca',             c:'#7A5AC7'},
  {id:'scienza',   name:'Scienza',    long:'Scienza e scoperte',  c:'#0E9F8E'},
  {id:'salute',    name:'Salute',     long:'Salute e medicina',   c:'#D94F86'},
  {id:'tech',      name:'Tecnologia', long:'Tecnologia e IA',     c:'#4B5BD6'},
  {id:'clima',     name:'Clima',      long:'Clima e ambiente',    c:'#3E9B4F'},
  {id:'cultura',   name:'Cultura',    long:'Cultura e società',   c:'#A0692F'},
  {id:'sport',     name:'Sport',      long:'Sport',               c:'#E07B1F'},
  {id:'motori',    name:'Motori',     long:'Motori e nautica',    c:'#C8283E'},
  {id:'spettacoli',name:'Spettacoli', long:'Spettacoli e costume',c:'#B04BB8'}
];
const TMAP = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const TICON = {
  roma:'<path d="M3.5 20.5h17"/><path d="M4.5 20.5V10c0-2.5 3.4-4.5 7.5-4.5s7.5 2 7.5 4.5v10.5"/><path d="M4.5 13.5h15M8 20.5v-3.2a1.5 1.5 0 0 1 3 0v3.2M13 20.5v-3.2a1.5 1.5 0 0 1 3 0v3.2M8 10.2v.6M12 9.8v.6M16 10.2v.6"/>',
  italia:'<path d="M3 20h18M4.5 17h15M6 10v7M10 10v7M14 10v7M18 10v7M3 10h18L12 4z"/>',
  mondo:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
  economia:'<path d="M3 17l5.5-5.5 4 4L21 7"/><path d="M15 7h6v6"/>',
  cronaca:'<path d="M6 19v-6a6 6 0 0 1 12 0v6"/><path d="M4 19h16v2H4zM12 2v2.5M4.2 5.2l1.8 1.8M19.8 5.2L18 7"/>',
  scienza:'<circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(-60 12 12)"/>',
  salute:'<path d="M12 20.5S3.5 15.2 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8c0 6-8.5 11.3-8.5 11.3z"/><path d="M6.5 12h3l1.5-2.5 2 5 1.5-2.5h3"/>',
  tech:'<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx=".5"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
  clima:'<path d="M5 20c0-9 5.5-15 15-15 0 9.5-6 15-14 15"/><path d="M5 20c3-4.5 6.5-7.5 10-9"/>',
  cultura:'<path d="M4 19.5V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13"/><path d="M8.5 7.5h6"/>',
  sport:'<circle cx="12" cy="12" r="9"/><path d="M12 7.2l4.2 3-1.6 4.9H9.4L7.8 10.2z"/><path d="M12 3v4.2M16.2 10.2l4.4-1.4M14.6 15.1l2.7 3.8M9.4 15.1l-2.7 3.8M7.8 10.2L3.4 8.8"/>',
  motori:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.3"/><path d="M3.2 10.8c2.9-.9 5.8-1.3 8.8-1.3s5.9.4 8.8 1.3M9.8 12.4l-3.4 7.1M14.2 12.4l3.4 7.1"/>',
  spettacoli:'<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3.5 9L6 4h12.5L21 9"/><path d="M9 4.2L7.5 9M14.5 4.2L13 9"/>'
};
const PALETTE = ['#1F4E79','#8B2E2E','#2E6B4F','#6B3FA0','#9A5B13','#0F6A7A','#A33E6B','#3D4A5C','#5C6B1F','#7A2E5C','#24527A','#8A4B2A'];
const TABS = ['oggi','perte','esplora','salvati','profilo'];
const ICON = {
  save:'<svg class="i" viewBox="0 0 24 24"><path d="M7 4h10v16l-5-3.6L7 20z"/></svg>',
  back:'<svg class="i" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  listen:'<svg class="i" viewBox="0 0 24 24"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4" height="6" rx="1.5"/><rect x="16.5" y="14" width="4" height="6" rx="1.5"/></svg>',
  play:'<svg class="f" viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>',
  pause:'<svg class="f" viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  ext:'<svg class="i" viewBox="0 0 24 24"><path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/></svg>',
  send:'<svg class="i" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
  copy:'<svg class="i" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/></svg>',
  search:'<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
  close:'<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check:'<svg class="i" viewBox="0 0 24 24" style="stroke-width:3"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  swipe:'<svg class="i" viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="3"/><path d="M12 8v8M9 11l3-3 3 3"/></svg>',
  plus:'<svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  grid:'<svg class="i" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
  refresh:'<svg class="i" viewBox="0 0 24 24"><path d="M19.5 12a7.5 7.5 0 0 1-12.9 5.2M4.5 12a7.5 7.5 0 0 1 12.9-5.2"/><path d="M17.8 3.4v3.6h-3.6M6.2 20.6V17h3.6"/></svg>',
  globe:'<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/></svg>',
  mute:'<svg class="i" viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  share:'<svg class="i" viewBox="0 0 24 24"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/></svg>',
  translate:'<svg class="i" viewBox="0 0 24 24"><path d="M3.5 5.5h9M8 3.5v2M5.5 5.5c.8 3.4 3 6 6 7.5M10.5 5.5c-.8 3.6-3 6.6-6.5 8.2"/><path d="M12.5 20.5l4-9.5 4 9.5M14 17h5"/></svg>'
};
const LANGN = {it:'italiano', en:'inglese', fr:'francese', de:'tedesco', es:'spagnolo', pt:'portoghese', nl:'olandese'};
const LANGF = {en:"dall'inglese", fr:'dal francese', de:'dal tedesco', es:'dallo spagnolo', pt:'dal portoghese', nl:"dall'olandese"};
const ZONES = [['citta', 'Roma'], ['castelli', 'Castelli Romani'], ['litorale', 'Litorale'], ['nord', 'Nord e lago di Bracciano'], ['est', 'Tivoli e area est']];
const ZMAP = Object.fromEntries(ZONES);
const PIN = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>';
const SECS = [['roma', 'Roma e provincia'], ['it', 'Italiane'], ['mondo', 'Dal mondo'], ['scienza', 'Scienza, salute e tecnologia'], ['motori', 'Motori e nautica']];
function ticon(id, cls){ return `<svg class="i ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${TICON[id] || TICON.mondo}</svg>`; }

/* ---------- utilità ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
const TZ = 'Europe/Rome';
const fmtDay = new Intl.DateTimeFormat('it-IT', {weekday:'long', day:'numeric', month:'long', timeZone:TZ});
const fmtHM = new Intl.DateTimeFormat('it-IT', {hour:'2-digit', minute:'2-digit', timeZone:TZ});
const fmtDM = new Intl.DateTimeFormat('it-IT', {day:'numeric', month:'short', timeZone:TZ});
const fmtDMHM = new Intl.DateTimeFormat('it-IT', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', timeZone:TZ});
const fmtKey = new Intl.DateTimeFormat('it-IT', {day:'2-digit', month:'2-digit', year:'numeric', timeZone:TZ});
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
function ts(v){ const t = Date.parse(v); return isNaN(t) ? 0 : t; }
function ago(v){
  const t = ts(v); if (!t) return '';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'ora';
  if (m < 60) return m + ' min fa';
  const h = Math.round(m / 60);
  if (h < 24) return h + ' h fa';
  if (fmtKey.format(new Date(t)) === fmtKey.format(new Date(Date.now() - 86400000))) return 'ieri ' + fmtHM.format(new Date(t));
  return fmtDM.format(new Date(t));
}
function hoursAgo(v){ const t = ts(v); return t ? Math.max(0, (Date.now() - t) / 3600000) : 999; }
function greeting(){ const h = Number(new Intl.DateTimeFormat('it-IT', {hour:'numeric', hour12:false, timeZone:TZ}).format(new Date())); return h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'; }
const LS = {
  get(k){ try { const v = localStorage.getItem('eddy:' + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem('eddy:' + k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- copertine generative ---------- */
function hexRgb(h){ h = String(h || '#888888').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) || 0); }
function rgbHsl(rgb){
  const [r, g, b] = rgb.map(x => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s * 100, l * 100];
}
const hsl = (h, s, l) => `hsl(${Math.round(((h % 360) + 360) % 360)} ${Math.round(Math.max(0, Math.min(100, s)))}% ${Math.round(Math.max(0, Math.min(100, l)))}%)`;
function rng(seed){ let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return (x % 100000) / 100000; }; }
let ARTN = 0;
function art(s, kind){
  const topic = s.topic || 'mondo';
  const t = TMAP[topic] || TOPICS[1];
  const [h, sat] = rgbHsl(hexRgb(t.c));
  const r = rng(hash((s.id || '') + (s.headline || '')));
  const W = kind === 'tall' ? 100 : kind === 'wide' ? 180 : kind === 'band' ? 240 : 100;
  const H = kind === 'tall' ? 125 : kind === 'wide' ? 110 : kind === 'band' ? 90 : 100;
  const hs = r() * 40 - 20;
  const c1 = hsl(h + hs, sat * .85, 20), c2 = hsl(h + hs + 32, sat * .95, 40), c3 = hsl(h + hs - 22, sat, 58), c4 = hsl(h + hs + 150, 72, 68), lt = hsl(h + hs, 55, 90);
  const id = 'ga' + (++ARTN);
  const f = n => n.toFixed(1);
  let sh = '';
  const pat = Math.floor(r() * 6);
  if (pat === 0) {
    const cx = W * (.15 + r() * .7), cy = H * (.15 + r() * .6);
    for (let i = 5; i >= 0; i--) sh += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(10 + i * (W / 9))}" fill="${i % 2 ? c2 : c3}" opacity="${f(.25 + (5 - i) * .1)}"/>`;
    sh += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(W / 18)}" fill="${c4}"/>`;
  } else if (pat === 1) {
    const a = -35 + r() * 70;
    sh += `<g transform="rotate(${f(a)} ${W / 2} ${H / 2})">`;
    for (let x = -W; x < W * 2; x += 20) sh += `<rect x="${x}" y="${-H}" width="${f(6 + r() * 7)}" height="${H * 3}" fill="${r() > .75 ? c4 : c3}" opacity="${f(.25 + r() * .35)}"/>`;
    sh += `</g><circle cx="${f(W * (.25 + r() * .5))}" cy="${f(H * (.3 + r() * .4))}" r="${f(H * .3)}" fill="${c1}" opacity=".55"/>`;
  } else if (pat === 2) {
    sh += `<circle cx="${f(W * .3)}" cy="${f(H * .55)}" r="${f(H * .42)}" fill="${c3}" opacity=".9"/>`;
    sh += `<rect x="${f(W * .48)}" y="${f(H * .12)}" width="${f(W * .36)}" height="${f(H * .5)}" fill="${lt}" opacity=".22" transform="rotate(${f(r() * 30 - 15)} ${f(W * .66)} ${f(H * .37)})"/>`;
    sh += `<path d="M${f(W * .55)} ${H} a${f(W * .22)} ${f(W * .22)} 0 0 1 ${f(W * .44)} 0z" fill="${c4}"/>`;
    sh += `<circle cx="${f(W * .78)}" cy="${f(H * .22)}" r="${f(H * .07)}" fill="${c4}"/>`;
  } else if (pat === 3) {
    for (let y = 6; y < H; y += 9) for (let x = 6; x < W; x += 9) sh += `<circle cx="${x}" cy="${y}" r="1.2" fill="${lt}" opacity=".28"/>`;
    sh += `<circle cx="${f(W * (.55 + r() * .3))}" cy="${f(H * (.35 + r() * .3))}" r="${f(H * .36)}" fill="${c3}" opacity=".85"/>`;
    sh += `<circle cx="${f(W * (.15 + r() * .2))}" cy="${f(H * .78)}" r="${f(H * .12)}" fill="${c4}"/>`;
  } else if (pat === 4) {
    for (let i = 0; i < 6; i++) {
      const y = H * (.2 + i * .14), a = 6 + r() * 10, ph = r() * W;
      sh += `<path d="M-10 ${f(y)} Q ${f(ph * .5)} ${f(y - a)} ${f(W * .5)} ${f(y)} T ${f(W + 10)} ${f(y)}" fill="none" stroke="${i % 3 === 0 ? c4 : i % 2 ? c3 : lt}" stroke-width="${f(3 + r() * 5)}" opacity="${f(.35 + r() * .45)}" stroke-linecap="round"/>`;
    }
  } else {
    const T = W / 4; const cols = [c3, c4, lt, c2];
    for (let yy = 0; yy < H; yy += T) for (let xx = 0; xx < W; xx += T) {
      const o = Math.floor(r() * 4), c = cols[Math.floor(r() * 4)], op = f(.3 + r() * .55);
      const cx = o === 0 || o === 3 ? xx : xx + T, cy = o < 2 ? yy : yy + T;
      const d = o === 0 ? `h${f(T)} a${f(T)} ${f(T)} 0 0 1 ${f(-T)} ${f(T)}z` : o === 1 ? `v${f(T)} a${f(T)} ${f(T)} 0 0 1 ${f(-T)} ${f(-T)}z` : o === 2 ? `h${f(-T)} a${f(T)} ${f(T)} 0 0 1 ${f(T)} ${f(-T)}z` : `v${f(-T)} a${f(T)} ${f(T)} 0 0 1 ${f(T)} ${f(T)}z`;
      sh += `<path d="M${f(cx)} ${f(cy)} ${d}" fill="${c}" opacity="${op}"/>`;
    }
  }
  const isz = kind === 'thumb' ? W * .42 : kind === 'tall' ? W * .26 : H * .34;
  const ix = kind === 'thumb' ? (W - isz) / 2 : kind === 'tall' ? W - isz - 8 : W - isz - 12;
  const iy = kind === 'thumb' ? (H - isz) / 2 : kind === 'tall' ? H * .3 : 12;
  const icon = `<g transform="translate(${f(ix)} ${f(iy)}) scale(${(isz / 24).toFixed(3)})" fill="none" stroke="${lt}" stroke-width="${kind === 'thumb' ? 1.6 : 1.3}" stroke-linecap="round" stroke-linejoin="round" opacity=".92">${TICON[topic] || ''}</g>`;
  return `<svg class="art" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>${sh}${icon}</svg>`;
}


/* ---------- mappe reali (Natural Earth, semplificato) ---------- */
const GEO = /*__GEO__*/null;
let GEOD = null;
function geo(){
  if (GEOD) return GEOD;
  GEOD = {list:[], byId:{}};
  if (!GEO) return GEOD;
  const q = GEO.q;
  for (const id in GEO.c) {
    const rings = []; let bb = [1e9, 1e9, -1e9, -1e9], main = null, mainA = -1;
    for (const enc of GEO.c[id]) {
      let x = 0, y = 0; const pts = []; let rb = [1e9, 1e9, -1e9, -1e9], a = 0;
      for (let i = 0; i < enc.length; i += 2) {
        x += enc[i]; y += enc[i + 1]; const lon = x / q, lat = y / q; pts.push(lon, lat);
        if (lon < rb[0]) rb[0] = lon; if (lat < rb[1]) rb[1] = lat; if (lon > rb[2]) rb[2] = lon; if (lat > rb[3]) rb[3] = lat;
      }
      for (let i = 0; i + 3 < pts.length; i += 2) a += pts[i] * pts[i + 3] - pts[i + 2] * pts[i + 1];
      a = Math.abs(a / 2);
      if (a > mainA) { mainA = a; main = rb.slice(); }
      bb = [Math.min(bb[0], rb[0]), Math.min(bb[1], rb[1]), Math.max(bb[2], rb[2]), Math.max(bb[3], rb[3])];
      rings.push({pts, bb:rb});
    }
    const c = {id, rings, bb, main};
    GEOD.list.push(c); GEOD.byId[id] = c;
  }
  return GEOD;
}
const MY = lat => { const l = Math.max(-80, Math.min(84, lat)) * Math.PI / 180; return Math.log(Math.tan(Math.PI / 4 + l / 2)) * 180 / Math.PI; };
const IMY = y => (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI;
function dims(kind){ return kind === 'tall' ? [100, 125] : kind === 'wide' ? [180, 110] : kind === 'band' ? [240, 90] : [100, 100]; }
const MAPC = new Map();
function mapSvg(pl, kind){
  const [W, H] = dims(kind);
  const key = [pl.lat, pl.lon, pl.cc, pl.zoom, pl.name, kind].join('|');
  let body = MAPC.get(key);
  if (!body) {
    const G = geo(); const c = G.byId[String(pl.cc || '')];
    let z = pl.zoom || 'paese';
    if (kind === 'thumb' && z === 'citta' && c) z = 'paese';
    let span, cx = pl.lon, cy = MY(pl.lat);
    if (z === 'citta') span = kind === 'tall' ? 8 : 4.2;
    else if (z === 'regione') span = 15;
    else if (z === 'continente') span = 55;
    else if (c && c.main) {
      const b = c.main; const bw = (b[2] - b[0]) * 1.45, bh = (MY(b[3]) - MY(b[1])) * 1.45;
      span = Math.min(70, Math.max(6, bw, bh * W / H));
      cx = (b[0] + b[2]) / 2; cy = (MY(b[1]) + MY(b[3])) / 2;
      if (Math.abs(pl.lon - cx) > span * .42 || Math.abs(MY(pl.lat) - cy) > span * H / W * .42) { cx = pl.lon; cy = MY(pl.lat); }
    } else span = 12;
    if (kind === 'tall') { cx = z === 'paese' ? cx : pl.lon; cy = MY(pl.lat) - .18 * H * span / W; }
    const sc = W / span, x0 = cx - span / 2, yTop = cy + (H / sc) / 2, yBot = cy - (H / sc) / 2;
    const latTop = IMY(yTop), latBot = IMY(yBot), mg = span * .08;
    const P = (lon, lat) => [(lon - x0) * sc, (yTop - MY(lat)) * sc];
    let land = '', hl = '';
    for (const ct of G.list) {
      const b = ct.bb;
      if (b[2] < x0 - mg || b[0] > x0 + span + mg || b[3] < latBot - mg || b[1] > latTop + mg) continue;
      let d = '';
      for (const r of ct.rings) {
        const rb = r.bb;
        if (rb[2] < x0 - mg || rb[0] > x0 + span + mg || rb[3] < latBot - mg || rb[1] > latTop + mg) continue;
        let lx = 1e9, ly = 1e9, seg = '';
        for (let i = 0; i < r.pts.length; i += 2) {
          const [px, py] = P(r.pts[i], r.pts[i + 1]);
          if (Math.abs(px - lx) + Math.abs(py - ly) < .45 && i + 2 < r.pts.length) continue;
          seg += (seg ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1); lx = px; ly = py;
        }
        if (seg) d += seg + 'Z';
      }
      if (!d) continue;
      if (ct.id === String(pl.cc)) hl += d; else land += d;
    }
    const [px, py] = P(pl.lon, pl.lat);
    const pr = kind === 'tall' ? 2.4 : kind === 'wide' ? 3.4 : kind === 'band' ? 4 : 3.6;
    const fs = kind === 'wide' ? 7.4 : kind === 'band' ? 9 : 0;
    let grid = '';
    const step = span > 40 ? 10 : span > 12 ? 5 : 1;
    for (let lo = Math.ceil(x0 / step) * step; lo < x0 + span; lo += step) grid += `M${((lo - x0) * sc).toFixed(1)} 0V${H}`;
    for (let la = Math.ceil(latBot / step) * step; la < latTop; la += step) { const yy = ((yTop - MY(la)) * sc).toFixed(1); grid += `M0 ${yy}H${W}`; }
    let label = '';
    if (fs && pl.name) {
      const right = px < W * .62;
      label = `<text x="${(px + (right ? pr * 2.2 : -pr * 2.2)).toFixed(1)}" y="${(py + fs * .35).toFixed(1)}" font-size="${fs}" stroke-width="${(fs * .38).toFixed(1)}" text-anchor="${right ? 'start' : 'end'}">${esc(pl.name)}</text>`;
    }
    body = `<rect class="msea" width="${W}" height="${H}"/><path class="mgr" d="${grid}" stroke-width="${(W / 360).toFixed(2)}"/><path class="mland" d="${land}" stroke-width="${(W / 380).toFixed(2)}"/><path class="mhl" d="${hl}" stroke-width="${(W / 300).toFixed(2)}"/><circle class="mhalo" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(pr * 2.6).toFixed(1)}"/><circle class="mpt" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr}" stroke-width="${(pr * .38).toFixed(2)}"/>${label}`;
    MAPC.set(key, body);
  }
  return `<svg class="art map" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${body}</svg>`;
}
function whenText(v){ const t = ts(v); if (!t) return ''; const d = new Date(t); return fmtKey.format(d) === fmtKey.format(new Date()) ? 'alle ' + fmtHM.format(d) : fmtKey.format(d) === fmtKey.format(new Date(Date.now() - 86400000)) ? 'ieri alle ' + fmtHM.format(d) : 'il ' + fmtDMHM.format(d); }
function freshAt(){ const m = S.meta || {}; return m.collectedAt || m.runAt; }
function staleMin(){ const t = ts(freshAt()); return t ? Math.round((Date.now() - t) / 60000) : 0; }
function lateLimit(){ const h = new Date().getUTCHours(); return h >= 4 && h <= 21 ? 40 : 80; }
function hasImg(s){ return !!(s && s.img && s.img.u); }
// Regola di Eddy: la foto si mostra direttamente dal sito della testata (niente copie né servizi intermedi),
// con referrerpolicy="no-referrer" e il credito "Foto: <testata>".
function imgUrl(img){
  return img && img.u ? img.u : '';
}
function logoUrl(l){ return /^(https?:|\/|logos\/|data:)/.test(l) ? l : '/_blob/' + l; }
function hasPlace(s){ return s && s.place && typeof s.place.lat === 'number' && typeof s.place.lon === 'number'; }
function fallbackVisual(s, kind){ return hasPlace(s) ? mapSvg(s.place, kind) : art(s, kind); }
function visual(s, kind){
  if (hasImg(s)) return `<span class="vis"><img class="ph" src="${esc(imgUrl(s.img, kind))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-sid="${esc(s.id)}" data-kind="${kind}"></span>`;
  return fallbackVisual(s, kind);
}
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.classList.contains('olg')) {
    BADLOGO.add(t.dataset.lid);
    const m = t.parentNode; t.remove();
    if (m) { m.classList.remove('haslogo', 'bleed'); m.textContent = m.dataset.t || ''; }
    return;
  }
  if (!t || t.tagName !== 'IMG' || !t.classList.contains('ph')) return;
  const s = getStory(t.dataset.sid) || {id:t.dataset.sid, topic:'mondo'};
  const holder = t.parentNode;
  const cov = holder && holder.closest && holder.closest('.scover'); if (cov) { const cr = cov.querySelector('.credit'); if (cr) cr.remove(); }
  t.remove();
  if (holder) holder.insertAdjacentHTML('beforeend', fallbackVisual(Object.assign({}, s, {img:null}), t.dataset.kind || 'thumb'));
}, true);

/* ---------- stato ---------- */
const defaultPrefs = () => ({topics:[], follow:[], mute:[], dossiers:[], onboarded:false, size:'m', rate:1});
const S = {
  dbState:'pending', dbErr:null, db:null, uid:null, sample:null, firstName:'',
  stories:[], byId:new Map(), outlets:{}, dossiers:{}, meta:null,
  prefs:defaultPrefs(), prefsReady:false,
  saved:{}, history:[],
  tab:'oggi', topic:'tutti', outletF:null, explore:null, query:'', savedSeg:'salvati',
  story:null, storyCtx:[], ctx:[], onbStep:0, onbShown:false, flow:null,
  req:null, run:null, canEdit:null, lastSeen:0, rfPrev:'idle', rfbHidden:0, rfReady:0
};

/* ---------- testate ---------- */
function outlet(id){
  const o = S.outlets[id];
  if (o) return o;
  const name = String(id || '?').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {id, name, short:name.slice(0, 2), color:PALETTE[hash(id) % PALETTE.length], kind:'', lang:'it'};
}
const BADLOGO = new Set();
function mono(id, cls){
  const o = outlet(id);
  const c = esc(o.color || PALETTE[hash(id) % PALETTE.length]);
  const txt = esc(o.short || o.name.slice(0, 2));
  if (o.logo && !BADLOGO.has(o.logo)) return `<span class="mono haslogo ${o.logoBleed ? 'bleed' : ''} ${cls || ''}" style="--c:${c};--lb:${esc(o.logoBg || '#FFFFFF')}" title="${esc(o.name)}" aria-hidden="true" data-t="${txt}"><img class="olg" src="${esc(logoUrl(o.logo))}" alt="" decoding="async" data-lid="${esc(o.logo)}"></span>`;
  return `<span class="mono ${cls || ''}" style="--c:${c}" title="${esc(o.name)}" aria-hidden="true">${txt}</span>`;
}
function langOf(x){ return (x && x.l) || outlet(x && x.o).lang || 'it'; }
function secOf(o){ return o.sec || (o.lang && o.lang !== 'it' ? 'mondo' : 'it'); }
function hasTopic(s, t){ return s.topic === t || (t !== 'roma' && Array.isArray(s.alt) && s.alt.includes(t)); }
/* traduzioni dei titoli esteri: dalla redazione (campo ti) o, per le storie più vecchie, tradotte qui e tenute in cache */
const TR = new Map(Object.entries(LS.get('tr') || {}));
function trKey(t){ return hash(t).toString(36) + String(t).length; }
function titleIt(x){
  if (langOf(x) === 'it') return null;
  return x.ti || TR.get(trKey(x.t)) || null;
}
function saveTR(){ const e = Array.from(TR.entries()); LS.set('tr', Object.fromEntries(e.slice(-900))); }
function srcOf(s){ const muted = new Set(S.prefs.mute); const hid = HID[s.id] && HID[s.id].u; return (s.sources || []).filter(x => x && x.o && !muted.has(x.o) && !(hid && hid.includes(x.u))); }
function outletsOf(s){ const seen = new Set(), ids = []; for (const x of srcOf(s)) if (!seen.has(x.o)) { seen.add(x.o); ids.push(x.o); } return ids; }
function visible(list){ return list.filter(s => outletsOf(s).length > 0); }
function vnames(s, n){
  const ids = outletsOf(s); const names = ids.slice(0, n || 2).map(id => esc(outlet(id).name)); const more = ids.length - names.length;
  return `${names.join(', ')}${more > 0 ? ` <em>+${more}</em>` : ''}`;
}
function stack(s, max){ return `<span class="stack">${outletsOf(s).slice(0, max || 4).map(id => mono(id)).join('')}</span>`; }

/* ---------- ordinamenti ---------- */
function score(s){ return (s.rank || 40) - hoursAgo(s.updatedAt) * 1.6 + Math.min(outletsOf(s).length, 6) * 3; }
function personalScore(s){
  const p = S.prefs; let sc = score(s);
  if (p.topics.some(t => hasTopic(s, t))) sc += p.topics.includes(s.topic) ? 28 : 20;
  if (s.dossier && p.dossiers.includes(s.dossier)) sc += 24;
  if (outletsOf(s).some(o => p.follow.includes(o))) sc += 14;
  return sc;
}
function matchesMe(s){
  const p = S.prefs;
  return p.topics.some(t => hasTopic(s, t)) || (s.dossier && p.dossiers.includes(s.dossier)) || outletsOf(s).some(o => p.follow.includes(o));
}
function oggiLists(){
  let list = visible(S.stories);
  if (S.outletF) list = list.filter(s => outletsOf(s).includes(S.outletF));
  if (S.topic !== 'tutti') list = list.filter(s => hasTopic(s, S.topic));
  else if (!S.outletF) list = list.filter(s => s.topic !== 'roma' || s.top);
  if (S.topic === 'roma' && S.zona) list = list.filter(s => (s.zona || 'citta') === S.zona);
  const filtered = !!S.outletF || S.topic !== 'tutti';
  const top = filtered ? [] : list.filter(s => s.top).sort((a, b) => (b.rank || 0) - (a.rank || 0)).slice(0, 9);
  const topIds = new Set(top.map(s => s.id));
  const rest = list.filter(s => !topIds.has(s.id)).sort(filtered ? (a, b) => score(b) - score(a) : (a, b) => ts(b.updatedAt) - ts(a.updatedAt));
  return {top, rest, all:top.concat(rest)};
}
function perTeList(){ return visible(S.stories).filter(matchesMe).sort((a, b) => personalScore(b) - personalScore(a)); }

/* ---------- persistenza per-utente, protetta dall'eco delle proprie scritture ---------- */
const SESSION = Math.random().toString(36).slice(2, 9);
let revN = 0;
const myRevs = new Set();
const P = {};
function pstate(name){ return P[name] || (P[name] = {timer:0, inflight:0, dirty:false, chain:Promise.resolve()}); }
function payload(name){ return name === 'prefs' ? S.prefs : name === 'saved' ? {items:S.saved} : {items:S.history}; }
function persist(name, delay){
  const st = pstate(name);
  st.dirty = true;
  LS.set(name, payload(name));
  clearTimeout(st.timer);
  st.timer = setTimeout(() => {
    st.timer = 0;
    if (!S.db || !S.uid) { st.dirty = false; return; }
    let ref; try { ref = S.db.doc('data/users/' + S.uid + '/' + name); } catch (e) { st.dirty = false; return; }
    const rev = SESSION + ':' + (++revN);
    myRevs.add(rev);
    const body = JSON.parse(JSON.stringify(payload(name)));
    body._rev = rev;
    st.inflight++;
    st.chain = st.chain.then(() => ref.set(body)).catch(err => {
      if (err && err.code === 'quota_exceeded') toast('Spazio dati esaurito: rimuovi qualche notizia salvata.');
    }).then(() => { st.inflight--; if (!st.inflight && !st.timer) st.dirty = false; });
  }, delay == null ? 400 : delay);
}
function applyUserDoc(name, snapDoc){
  if (!snapDoc || !snapDoc.exists) return false;
  if (snapDoc.metadata && snapDoc.metadata.hasPendingWrites) return false;
  const st = pstate(name);
  if (st.dirty) return false;
  const d = Object.assign({}, snapDoc.data() || {});
  if (d._rev && myRevs.has(d._rev)) return false;
  delete d._rev;
  if (name === 'prefs') {
    const p = Object.assign(defaultPrefs(), d);
    ['topics', 'follow', 'mute', 'dossiers'].forEach(k => { if (!Array.isArray(p[k])) p[k] = []; });
    S.prefs = p; applyReaderSize();
  }
  else if (name === 'saved') S.saved = Object.assign({}, d.items || {});
  else if (name === 'history') S.history = Array.isArray(d.items) ? d.items.slice() : [];
  LS.set(name, payload(name));
  return true;
}

/* ---------- render ---------- */
let raf = 0, collecting = false, CTX = [];
function scheduleRender(){ if (raf) return; raf = requestAnimationFrame(() => { raf = 0; render(); }); }
function pushCtx(id){ if (collecting && !CTX.includes(id)) CTX.push(id); }

function render(animate){
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === S.tab ? 'page' : 'false'));
  renderEdPill();
  const v = $('#view');
  const carScroll = $('#car') ? $('#car').scrollLeft : 0;
  const railScroll = $('.orail') ? $('.orail').scrollLeft : 0;
  const chipScroll = $('#view .rail') ? $('#view .rail').scrollLeft : 0;
  collecting = true; CTX = [];
  let html = '';
  if (S.tab === 'oggi') html = viewOggi();
  else if (S.tab === 'perte') html = viewPerTe();
  else if (S.tab === 'esplora') html = viewEsplora();
  else if (S.tab === 'salvati') html = viewSalvati();
  else html = viewProfilo();
  collecting = false; S.ctx = CTX;
  v.innerHTML = html;
  if (animate) { v.classList.remove('fade'); void v.offsetWidth; v.classList.add('fade'); }
  const car = $('#car'); if (car) { car.scrollLeft = carScroll; car.addEventListener('scroll', onCarScroll, {passive:true}); onCarScroll(); }
  if (!animate) { const or = $('.orail'); if (or) or.scrollLeft = railScroll; const cr = $('#view .rail'); if (cr) cr.scrollLeft = chipScroll; }
  if (S.tab === 'esplora' && !S.explore) { const inp = $('#q'); if (inp) inp.value = S.query; }
  if (S.story && !$('#sheet').hidden) renderSheet(true);
  observeMore();
  railEnds();
}
function onCarScroll(){
  const car = $('#car'); const dots = document.querySelectorAll('#dots i'); if (!car || !dots.length) return;
  const first = car.firstElementChild; const w = first ? first.getBoundingClientRect().width + 12 : 1;
  const i = Math.min(dots.length - 1, Math.round(car.scrollLeft / w));
  dots.forEach((d, j) => d.classList.toggle('on', j === i));
}
function renderEdPill(){
  updateRefreshUI();
  const pill = $('#edPill');
  if (!pill || !S.meta || !S.meta.runAt) return;
  $('#edPillTxt').textContent = 'Aggiornato ' + whenText(freshAt()) + (staleMin() > lateLimit() ? ' · in ritardo' : '');
  pill.classList.toggle('late', staleMin() > lateLimit());
}
function skeleton(n, hero){
  let h = hero ? '<div class="skhero" aria-hidden="true"></div>' : '';
  for (let i = 0; i < n; i++) h += '<div class="sk" aria-hidden="true"><i style="width:45%"></i><i class="h" style="width:95%"></i><i class="h" style="width:70%"></i><i style="width:55%"></i><b></b></div>';
  return h;
}
function feedState(hero){
  if (S.dbState === 'pending') return skeleton(4, hero);
  if (S.dbState === 'offline') return `<div class="state"><h3>Sei offline</h3><p>Non c'è ancora una copia delle notizie su questo dispositivo. Appena torna la connessione Eddy scarica l'ultima edizione.</p><button class="btn" data-act="refresh" style="margin-top:14px">Riprova</button></div>`;
  if (S.dbState === 'error') return `<div class="state"><h3>Notizie non raggiungibili</h3><p>Il sito di Eddy non ha risposto (${esc(S.dbErr || 'errore')}). Riprova tra poco.</p><button class="btn" data-act="refresh" style="margin-top:14px">Riprova</button></div>`;
  return '';
}
const PAPER = '<svg class="i" viewBox="2.5 3.5 18.5 18" aria-hidden="true"><path d="M7 4.5h11.5A1.5 1.5 0 0 1 20 6v12.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V9.5H7"/><path d="M7 4.5v14a2 2 0 0 1-2 2"/><path d="M10.5 8h6v3.6h-6zM10.5 14.6h6M10.5 17.4h4"/></svg>';
function coverage(n, id){
  const w = n === 1 ? 'testata' : 'testate';
  const inner = `${PAPER}<b>${n}</b><small>${w}</small>`;
  return id ? `<button type="button" class="cov" data-act="srcs" data-id="${esc(id)}" aria-label="Riportata da ${n} ${w}: vedi chi la racconta">${inner}</button>` : `<span class="cov">${inner}</span>`;
}
function isSaved(id){ return !!S.saved[id]; }
function isNew(s){ const a = ts(s.addedAt); return !!a && a > S.lastSeen && Date.now() - a < 36 * 3600000; }
function saveBtn(s){ const on = isSaved(s.id); return `<button class="savebtn" data-act="save" data-id="${esc(s.id)}" aria-pressed="${on}" aria-label="${on ? 'Rimuovi dai salvati' : 'Salva'}">${ICON.save}</button>`; }
function topicTag(s){ const t = TMAP[s.topic] || {name:s.topic || '', c:'#888'}; const nm = s.topic === 'roma' && s.zona && s.zona !== 'citta' ? ZMAP[s.zona] || t.name : t.name; return `<span class="topic" style="--tc:${t.c}">${ticon(s.topic)}${esc(nm)}</span>`; }
function row(s){
  pushCtx(s.id);
  return `<article class="row press" data-act="open" data-id="${esc(s.id)}" tabindex="0" aria-label="${esc(s.headline)}">
    <div class="voices">${stack(s)}<span class="vnames">${vnames(s)}</span>${isNew(s) ? '<span class="nb">Nuova</span>' : isDev(s) ? `<span class="nb dev" title="${esc(s.dev.t)}">${s.dev.k === 'rettifica' ? 'Rettifica' : 'Nuovi elementi'}</span>` : ''}<span class="time">${esc(ago(s.updatedAt))}</span></div>
    <h3 class="hl">${esc(s.headline)}</h3>
    <div class="thumb">${visual(s, 'thumb')}</div>
    <div class="foot">${topicTag(s)}${coverage(outletsOf(s).length, s.id)}<span class="sp"></span>${saveBtn(s)}</div>
  </article>`;
}
const PAGE = 30;
const PAGED = {};
S.pages = {};
function paged(key, list){
  PAGED[key] = list;
  const n = Math.min(list.length, Math.max(PAGE, S.pages[key] || 0));
  const rest = list.length - n;
  return `<div class="feed" data-pkey="${esc(key)}">${list.slice(0, n).map(row).join('')}</div>${rest > 0 ? moreBtn(key, rest) : ''}`;
}
function moreBtn(key, rest){ return `<button class="more" data-act="more" data-pkey="${esc(key)}">Mostra altre ${rest} ${rest === 1 ? 'storia' : 'storie'}</button>`; }
function showMore(key){
  const list = PAGED[key]; if (!list) return;
  const feed = document.querySelector(`.feed[data-pkey="${CSS.escape(key)}"]`); if (!feed) return;
  const n0 = feed.children.length, n1 = Math.min(list.length, n0 + PAGE);
  if (n1 <= n0) return;
  S.pages[key] = n1;
  const was = collecting; collecting = true; CTX = S.ctx || [];
  feed.insertAdjacentHTML('beforeend', list.slice(n0, n1).map(row).join(''));
  S.ctx = CTX; collecting = was;
  const btn = document.querySelector(`.more[data-pkey="${CSS.escape(key)}"]`);
  const rest = list.length - n1;
  if (btn) { if (rest > 0) btn.textContent = `Mostra altre ${rest} ${rest === 1 ? 'storia' : 'storie'}`; else btn.remove(); }
}
let moreObs = null;
function observeMore(){
  if (!('IntersectionObserver' in window)) return;
  if (!moreObs) moreObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) showMore(e.target.dataset.pkey); }), {rootMargin:'700px 0px'});
  moreObs.disconnect();
  document.querySelectorAll('.more[data-pkey]').forEach(b => moreObs.observe(b));
}
function feature(s, flag){
  pushCtx(s.id);
  return `<article class="feature press" data-act="open" data-id="${esc(s.id)}" tabindex="0" aria-label="${esc(s.headline)}">
    <div class="cover">${visual(s, 'wide')}<span class="vpill">${stack(s, 5)}<span>${vnames(s, 2)}</span></span></div>
    ${flag ? `<span class="flag">${esc(flag)}</span>` : ''}
    <h3 class="hl">${esc(s.headline)}</h3>
    ${s.dek ? `<p class="dek">${esc(s.dek)}</p>` : ''}
    <div class="foot">${topicTag(s)}${coverage(outletsOf(s).length, s.id)}<span>${esc(ago(s.updatedAt))}</span><span class="sp"></span>${saveBtn(s)}</div>
  </article>`;
}
function hero(s){
  pushCtx(s.id);
  const t = TMAP[s.topic] || {name:'', c:'#888'};
  const nm = s.topic === 'roma' && s.zona && s.zona !== 'citta' ? ZMAP[s.zona] || t.name : t.name;
  const n = outletsOf(s).length;
  return `<article class="hero press" data-act="open" data-id="${esc(s.id)}" tabindex="0" aria-label="${esc(s.headline)}">
    <div class="hv"><div class="hph">${visual(s, 'wide')}</div><span class="hk" style="--tc:${t.c}">${ticon(s.topic)}${esc(nm)}</span><span class="hcount">${n} ${n === 1 ? 'testata' : 'testate'}</span></div>
    <div class="hin"><div class="hsrc">${stack(s, 4)}<span>${vnames(s, 2)}</span></div>
      <h3>${esc(s.headline)}</h3><span class="hmeta">Aggiornata ${esc(ago(s.updatedAt))}</span></div>
  </article>`;
}
/* ---------- fonti: chi le riprende, confronto, cronologia, segnalazioni ---------- */
const AGN = {ansa:'ANSA', agi:'AGI', adnkronos:'Adnkronos', lapresse:'LaPresse', askanews:'Askanews', italpress:'Italpress', dire:'Dire', reuters:'Reuters', afp:'AFP', ap:'AP', dpa:'dpa', efe:'EFE'};
let HID = LS.get('hid') || {}, SUMOFF = LS.get('sumoff') || {};
(function(){
  // le correzioni locali durano due settimane: intanto la redazione applica le segnalazioni inviate
  const cut = Date.now() - 14 * 86400000; let ch = false;
  for (const k of Object.keys(HID)) if (!HID[k] || !Array.isArray(HID[k].u) || (HID[k].t || 0) < cut) { delete HID[k]; ch = true; }
  for (const k of Object.keys(SUMOFF)) if ((SUMOFF[k] || 0) < cut) { delete SUMOFF[k]; ch = true; }
  if (ch) { LS.set('hid', HID); LS.set('sumoff', SUMOFF); }
})();
function isDev(s){ const t = s.dev && ts(s.dev.at); return !!t && t > S.lastSeen && Date.now() - t < 24 * 3600000; }
function goSources(id){
  if (S.story !== id) openStory(id);
  const go = () => {
    const sh = $('#sheet'), b = $('#srcBlk'); if (!sh || !b) return;
    const y = b.getBoundingClientRect().top - sh.getBoundingClientRect().top + sh.scrollTop - 70;
    sh.scrollTo({top:Math.max(0, y), behavior:'smooth'});
  };
  requestAnimationFrame(() => requestAnimationFrame(go));
}
function agName(a){ return AGN[a] || (S.outlets[a] ? outlet(a).name : String(a || '').toUpperCase()); }
function agencyLine(srcs){
  const ag = new Map();
  srcs.forEach(x => { if (!x.ag) return; if (!ag.has(x.ag)) ag.set(x.ag, new Set()); if (x.ag !== x.o) ag.get(x.ag).add(x.o); });
  if (!ag.size) return '';
  const parts = [...ag.entries()].map(([a, set]) => `<b>${esc(agName(a))}</b>${set.size ? ` <span>ripreso da ${[...set].map(o => esc(outlet(o).name)).join(', ')}</span>` : ''}`);
  const reprint = srcs.some(x => x.ag && x.ag !== x.o);
  return `<div class="agl"><span class="agk">Lanci d'agenzia</span><p>${parts.join(' · ')}</p>${reprint ? '<p class="note">Più testate possono riprendere lo stesso lancio: il numero dice quanto se ne parla, non quante fonti indipendenti ci sono.</p>' : ''}</div>`;
}

/* confronto dei titoli: cosa ripetono tutti, cosa compare solo in alcune testate, come impostano il titolo */
const CSTOP = new Set(('alla alle allo agli dagli dalla dalle dallo degli della delle dello dopo ecco essere fino hanno lungo mentre nella nelle nello negli ' +
  'oggi ieri domani ancora anche come dove quando quale quali questo questa questi queste quello quella sono stato stata stati state sulla sulle sullo ' +
  'sugli tutti tutto tutte verso cosa nuovo nuova nuovi nuove dice dicono secondo dopo contro perche senza circa ogni altri altre altro primo prima ' +
  'with from that this have their after over into about will would were they what when where which more than been says said video foto live diretta ultime notizie news').split(' '));
function wordsOf(t){ return String(t || '').split(/[^\p{L}\p{N}]+/u).filter(Boolean); }
function stemOf(w){ const n = norm(w); return n.length > 6 ? n.slice(0, 6) : n; }
function detailsOf(t){
  const out = [];
  (String(t).match(/«[^»]{6,140}»|“[^”]{6,140}”|"[^"]{6,140}"/g) || []).forEach(q => out.push({k:'q', s:q}));
  (String(t).match(/\b\d[\d.,]*(?:\s?(?:%|mila|milioni|miliardi|euro|dollari|anni|morti|feriti|arresti|arrestati|fermati|fermi|persone|vittime|km|chilometri|metri|gradi))?/gi) || []).forEach(n => {
    const v = n.trim(); if (/^\d{4}$/.test(v) && +v > 1900 && +v < 2100) return; if (v.length >= 2) out.push({k:'n', s:v});
  });
  const ws = wordsOf(t);
  for (let i = 1; i < ws.length; i++) {
    if (!/^\p{Lu}[\p{Ll}'’-]{2,}/u.test(ws[i]) || CSTOP.has(norm(ws[i]))) continue;
    const name = [ws[i]]; while (i + 1 < ws.length && /^\p{Lu}/u.test(ws[i + 1])) name.push(ws[++i]);
    out.push({k:'p', s:name.join(' ')});
  }
  return out;
}
function compareBlock(srcs){
  const by = new Map();
  srcs.forEach(x => { const t = titleIt(x) || x.t; if (!t) return; if (!by.has(x.o)) by.set(x.o, []); by.get(x.o).push({t, x}); });
  const N = by.size; if (N < 3) return '';
  const nt = new Map(); by.forEach((arr, o) => nt.set(o, norm(arr.map(a => a.t).join(' . ')).replace(/[«»“”"]/g, '')));
  const cnt = new Map(), surf = new Map();
  by.forEach(arr => {
    const seen = new Set();
    arr.forEach(({t}) => wordsOf(t).forEach(w => {
      const n = norm(w); if (n.length < 4 || CSTOP.has(n) || QSTOP.has(n) || /^\d+$/.test(n)) return;
      const st = stemOf(w); if (seen.has(st)) return; seen.add(st);
      cnt.set(st, (cnt.get(st) || 0) + 1); if (!surf.has(st)) surf.set(st, w.toLowerCase());
    }));
  });
  const need = Math.max(2, Math.ceil(N * 0.5));
  const common = [...cnt.entries()].filter(([, c]) => c >= need).sort((a, b) => b[1] - a[1]).slice(0, 7);
  const commonSt = new Set(common.map(([st]) => st));
  const lim = N >= 8 ? 2 : 1;
  const det = new Map();
  by.forEach((arr, o) => arr.forEach(({t, x}) => detailsOf(t).forEach(d => {
    const key = norm(d.s).replace(/[«»“”"]/g, '').trim(); if (key.length < 2) return;
    if (d.k === 'p' && commonSt.has(stemOf(d.s.split(' ')[0]))) return;
    if (!det.has(key)) det.set(key, {d, key, os:new Map()});
    const e = det.get(key); if (!e.os.has(o)) e.os.set(o, x);
  })));
  const uniq = [];
  // una citazione che ripete con altre parole il messaggio comune non è un dettaglio esclusivo
  const shared = d => { const st = wordsOf(d.s).map(stemOf).filter(w => w.length > 3 && !CSTOP.has(w)); return st.length ? st.filter(w => (cnt.get(w) || 0) >= need).length / st.length : 1; };
  det.forEach(e => {
    const holders = [...nt.values()].filter(txt => txt.includes(e.key)).length;
    if (holders < 1 || holders > lim) return;
    if (e.d.k === 'q' && shared(e.d) >= 0.4) return;
    uniq.push(e);
  });
  const ord = {q:0, n:1, p:2};
  uniq.sort((a, b) => ord[a.d.k] - ord[b.d.k] || a.key.length - b.key.length);
  const shownU = []; const used = new Set();
  for (const e of uniq) { if (shownU.length >= 6) break; if ([...used].some(u => u.includes(e.key) || e.key.includes(u))) continue; used.add(e.key); shownU.push(e); }
  const quote = [...by.entries()].filter(([, arr]) => arr.some(a => /[«“"]/.test(a.t))).map(([o]) => o);
  const ask = [...by.entries()].filter(([, arr]) => arr.some(a => /\?\s*["»”]?\s*$/.test(a.t))).map(([o]) => o);
  const frame = [];
  const names = list => list.map(o => esc(outlet(o).name)).join(', ');
  const rest = list => [...by.keys()].filter(o => !list.includes(o));
  // si nomina la parte più piccola: chi fa la scelta, o chi non la fa se sono quasi tutti
  if (quote.length && quote.length < N) frame.push(quote.length * 2 <= N ? `<b>Aprono con una dichiarazione</b> ${names(quote)}` : `<b>Aprono con una dichiarazione</b> ${quote.length} su ${N}; non lo fanno ${names(rest(quote))}`);
  if (ask.length && ask.length < N) frame.push(ask.length * 2 <= N ? `<b>In forma di domanda</b> ${names(ask)}` : `<b>In forma di domanda</b> ${ask.length} su ${N}; in forma affermativa ${names(rest(ask))}`);
  if (!common.length && !shownU.length && !frame.length) return '';
  return `<div class="blk cmp"><h3>Confronto tra le testate</h3>
    ${common.length ? `<div class="cmpg"><small>In comune nei titoli</small><div class="cmpc">${common.map(([st, c]) => `<span>${esc(surf.get(st))}<em>${c}/${N}</em></span>`).join('')}</div></div>` : ''}
    ${shownU.length ? `<div class="cmpg"><small>Solo in alcune testate</small><ul class="cmpu">${shownU.map(e => `<li><span class="cw">${esc(e.d.s)}</span><span class="co">${[...e.os.entries()].map(([o, x]) => `<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(outlet(o).name)}</a>`).join(', ')}</span></li>`).join('')}</ul></div>` : ''}
    ${frame.length ? `<div class="cmpg"><small>Come impostano il titolo</small>${frame.map(f => `<p>${f}</p>`).join('')}</div>` : ''}
    <p class="note">Confronto automatico dei titoli di ${N} testate: mostra cosa ripetono quasi tutti e cosa compare solo in alcune, non stabilisce chi ha ragione.</p>
  </div>`;
}

/* cronologia: prima notizia, articoli con nomi o numeri nuovi, rettifiche, ultimo aggiornamento */
const RETTX = /\b(rettific|smentit|smentisc|precisazion|correzion|retract|correction|denies|denied)/;
function timelineBlock(srcs){
  if (srcs.length < 3) return '';
  const t0 = ts(srcs[0].d), t1 = ts(srcs[srcs.length - 1].d); if (!t0 || !t1 || t1 - t0 < 90 * 60000) return '';
  const seenW = new Set(), seenI = new Set(), ev = [];
  srcs.forEach((x, i) => {
    const t = titleIt(x) || x.t;
    const ws = new Set(wordsOf(t).map(stemOf).filter(w => w.length > 3 && !CSTOP.has(w)));
    const inf = new Set(detailsOf(t).filter(d => d.k !== 'q').map(d => norm(d.s)));
    let kind = 'rip';
    if (!i) kind = 'first';
    else if (RETTX.test(norm(t))) kind = 'rett';
    else if ([...inf].some(w => !seenI.has(w)) && [...ws].filter(w => !seenW.has(w)).length >= 3) kind = 'new';
    ws.forEach(w => seenW.add(w)); inf.forEach(w => seenI.add(w));
    ev.push({x, t, kind});
  });
  let shown = ev.filter(e => e.kind !== 'rip');
  if (shown.length > 8) shown = [shown[0]].concat(shown.slice(-7));
  const last = ev[ev.length - 1];
  if (shown[shown.length - 1] !== last) shown.push(Object.assign({}, last, {kind:'last'}));
  if (shown.length < 2) return '';
  const nrip = ev.length - shown.length;
  const LBL = {first:'Prima notizia', new:'Nuovi elementi', rett:'Rettifica o smentita', last:'Ultimo aggiornamento'};
  return `<div class="blk tl"><h3>Come si è sviluppata</h3><ol class="tline">${shown.map(e => `<li class="${e.kind}"><div class="tlh"><time>${esc(fmtDMHM.format(new Date(e.x.d)))}</time><span class="tk">${LBL[e.kind]}</span></div><a href="${esc(e.x.u)}" target="_blank" rel="noopener"><b>${esc(outlet(e.x.o).name)}</b> ${esc(e.t)}</a></li>`).join('')}</ol>
    <p class="note">Ricostruita dai titoli delle testate in ordine di pubblicazione${nrip > 0 ? `; altri ${nrip} ${nrip === 1 ? 'articolo riprende' : 'articoli riprendono'} quanto già noto` : ''}. «Nuovi elementi» indica un titolo con nomi o numeri che i precedenti non avevano.</p></div>`;
}

/* sintesi: ogni passaggio con la sua fonte, le citazioni in evidenza */
function fmtPara(p){
  let h = esc(p), cite = '';
  const m = h.match(/\s\(([^()]{2,80})\)\s*$/); if (m) { cite = m[1]; h = h.slice(0, m.index); }
  h = h.replace(/«([^»]{3,300})»/g, '<span class="qt">«$1»</span>').replace(/“([^”]{3,300})”/g, '<span class="qt">“$1”</span>').replace(/&quot;([^&]{3,300}?)&quot;/g, '<span class="qt">“$1”</span>');
  return `<p>${h}${cite ? ` <cite>${cite}</cite>` : ''}</p>`;
}
function fmtPoint(p){ const m = String(p).match(/^([^:]{2,40}):\s+([\s\S]*)$/); return m ? `<b>${esc(m[1])}</b> ${esc(m[2])}` : esc(p); }

/* segnalazioni: effetto subito su questo telefono, poi una issue su GitHub che la redazione legge al giro dopo */
function repoPath(){
  const r = S.meta && S.meta.repo; if (r && /^[\w.-]+\/[\w.-]+$/.test(r)) return r;
  const h = location.hostname; if (/\.github\.io$/.test(h)) { const own = h.split('.')[0]; const rp = location.pathname.split('/').filter(Boolean)[0] || h; return own + '/' + rp; }
  return '';
}
function openIssue(title, body){
  const r = repoPath(); if (!r) return false;
  const a = document.createElement('a');
  a.href = `https://github.com/${r}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
  return true;
}
function armed(el, label){
  if (el.dataset.armed === '1') return true;
  const old = el.textContent; el.dataset.armed = '1'; el.textContent = label; el.classList.add('armed');
  setTimeout(() => { if (el.isConnected && el.dataset.armed === '1') { el.dataset.armed = ''; el.textContent = old; el.classList.remove('armed'); } }, 4000);
  return false;
}
function flagSource(el){
  if (!armed(el, 'Tocca ancora: segnala e togli')) return;
  const sid = S.story, s = getStory(sid), u = el.dataset.u; if (!s || !u) return;
  const x = (s.sources || []).find(y => y.u === u) || {};
  HID[sid] = HID[sid] || {u:[], t:0}; if (!HID[sid].u.includes(u)) HID[sid].u.push(u); HID[sid].t = Date.now(); LS.set('hid', HID);
  const sent = openIssue(`[Eddy] Articolo fuori posto: ${String(s.headline).slice(0, 70)}`,
    `Segnalazione inviata dall'app Eddy.\n\nStoria: ${s.headline}\nArticolo che non riguarda questa storia: «${x.t || ''}» (${outlet(x.o).name})\n${u}\n\nPremi «Create» senza modificare il testo: la redazione automatica lo legge al prossimo giro e chiude la segnalazione.\n\neddy:${JSON.stringify({k:'fonte', s:sid, u})}`);
  toast(sent ? 'Tolto. Conferma su GitHub' : 'Tolto su questo telefono');
  renderSheet(true); scheduleRender();
}
function flagSummary(el){
  if (!armed(el, 'Tocca ancora: segnala e nascondi la sintesi')) return;
  const sid = el.dataset.id, s = getStory(sid); if (!s) return;
  SUMOFF[sid] = Date.now(); LS.set('sumoff', SUMOFF);
  const sent = openIssue(`[Eddy] Sintesi da rivedere: ${String(s.headline).slice(0, 70)}`,
    `Segnalazione inviata dall'app Eddy.\n\nStoria: ${s.headline}\nLa sintesi automatica non rappresenta correttamente le fonti.\n\nPremi «Create» senza modificare il testo: la redazione automatica ritira la sintesi al prossimo giro e chiude la segnalazione.\n\neddy:${JSON.stringify({k:'sintesi', s:sid})}`);
  toast(sent ? 'Sintesi nascosta. Conferma su GitHub' : 'Sintesi nascosta su questo telefono');
  renderSheet(true);
}

/* caroselli: sfumatura sul bordo destro finché c'è altro da scorrere */
const RAILS = '.orail,.lrail,.xrail,.drail,#view .rail';
function railEnd(el){ el.classList.toggle('atend', el.scrollLeft + el.clientWidth >= el.scrollWidth - 6); }
function railEnds(){ document.querySelectorAll(RAILS).forEach(railEnd); }
document.addEventListener('scroll', e => {
  const el = e.target; if (!el || !el.matches || !el.matches(RAILS)) return;
  railEnd(el);
  if (el.classList.contains('orail') && el.scrollLeft > 40 && !LS.get('orailSeen')) { LS.set('orailSeen', 1); const h = $('.ohint'); if (h) h.remove(); }
}, {capture:true, passive:true});
window.addEventListener('resize', railEnds, {passive:true});

/* esplora: filtri e ordinamenti */
function xfDefault(){ return {p:0, sort:'', min:1, topic:'', o:''}; }
S.xf = xfDefault();
function xfCount(){ const f = S.xf; return (f.p ? 1 : 0) + (f.sort ? 1 : 0) + (f.min > 1 ? 1 : 0) + (f.topic ? 1 : 0) + (f.o ? 1 : 0); }
function setXF(k, v){
  if (k === 'p') S.xf.p = Number(v) || 0; else if (k === 'min') S.xf.min = Math.max(1, Number(v) || 1); else S.xf[k] = v || '';
  render();
}
function xfSorter(hasQ){
  const m = S.xf.sort || (hasQ ? 'rel' : 'upd');
  const up = (a, b) => ts(b.updatedAt) - ts(a.updatedAt);
  if (m === 'new') return (a, b) => ts(b.publishedAt || b.updatedAt) - ts(a.publishedAt || a.updatedAt);
  if (m === 'cov') return (a, b) => outletsOf(b).length - outletsOf(a).length || up(a, b);
  if (m === 'upd') return up;
  return (a, b) => score(b) - score(a);
}
function xfPanel(){
  const f = S.xf, n = xfCount(), hasQ = norm(S.query).trim().length >= 2;
  const cur = f.sort || (hasQ ? 'rel' : 'upd');
  const ch = (k, v, l, on) => `<button class="chip plain" data-act="xf" data-k="${k}" data-v="${esc(v)}" aria-pressed="${on}">${esc(l)}</button>`;
  const outs = Object.values(S.outlets).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));
  const sorts = [hasQ ? ['rel', 'Pertinenza'] : null, ['new', 'Più recenti'], ['upd', 'Più aggiornate'], ['cov', 'Più testate']].filter(Boolean);
  return `<details class="xf"${n ? ' open' : ''}><summary><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M7 12h10M10 17.5h4"/></svg>Filtri e ordinamento${n ? `<em>${n}</em>` : ''}</summary>
    <div class="xfg"><small>Periodo</small><div class="xch">${[[0, 'Sempre'], [6, '6 ore'], [24, '24 ore'], [48, '2 giorni'], [168, '7 giorni']].map(([v, l]) => ch('p', v, l, f.p === v)).join('')}</div></div>
    <div class="xfg"><small>Ordina per</small><div class="xch">${sorts.map(([v, l]) => ch('sort', v === (hasQ ? 'rel' : 'upd') ? '' : v, l, cur === v)).join('')}</div></div>
    <div class="xfg"><small>Testate che ne parlano</small><div class="xch">${[[1, 'Tutte'], [2, 'Almeno 2'], [5, 'Almeno 5'], [10, 'Almeno 10']].map(([v, l]) => ch('min', v, l, (f.min || 1) === v)).join('')}</div></div>
    <div class="xfg"><small>Tema</small><div class="xch">${ch('topic', '', 'Tutti', !f.topic)}${TOPICS.map(t => ch('topic', t.id, t.name, f.topic === t.id)).join('')}</div></div>
    <div class="xfg"><small>Testata</small><label class="sr" for="xfO">Testata</label><select id="xfO" class="tinput"><option value="">Tutte le testate</option>${outs.map(o => `<option value="${esc(o.id)}"${f.o === o.id ? ' selected' : ''}>${esc(o.name)}</option>`).join('')}</select></div>
    ${n ? '<button class="tog" data-act="xf-reset">Azzera i filtri</button>' : ''}
  </details>`;
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'xfO') { S.xf.o = e.target.value; render(); } });

/* avvisi con l'app aperta: novità importanti su dossier, testate e temi seguiti */
let alertT = 0;
function hideAlert(){ const a = $('#alertBar'); if (a) a.remove(); clearTimeout(alertT); }
function showAlert(s, why, more){
  hideAlert();
  const k = isDev(s) ? (s.dev.k === 'rettifica' ? 'Rettifica' : 'Nuovi elementi') : 'Nuova storia';
  document.body.insertAdjacentHTML('beforeend', `<div class="alertbar" id="alertBar" role="status"><button class="ab-main" data-act="alert-open" data-id="${esc(s.id)}"><small>${esc(k)}${why ? ' · ' + esc(why) : ''}</small><b>${esc(s.headline)}</b>${more ? `<em>e altre ${more} tra le storie che segui</em>` : ''}</button><button class="ab-x" data-act="alert-x" aria-label="Chiudi l'avviso">${ICON.close}</button></div>`);
  alertT = setTimeout(hideAlert, 12000);
}
function checkAlerts(before){
  if (S.prefs.alerts === false || S.story || S.flow) return;
  const p = S.prefs, seen = LS.get('alerted') || {}, now = Date.now(), cands = [];
  visible(S.stories).forEach(s => {
    const b = before.get(s.id), isNewS = b === undefined, changed = !isNewS && b !== (s.changedAt || s.updatedAt);
    if (!isNewS && !changed) return;
    const dev = s.dev && ts(s.dev.at) > now - 3 * 3600000 ? s.dev.at : '';
    const key = dev || (isNewS ? 'n' : '');
    if (!key || seen[s.id] === key) return;
    const n = outletsOf(s).length;
    const fd = s.dossier && p.dossiers.includes(s.dossier), fo = outletsOf(s).find(o => p.follow.includes(o)), ft = p.topics.includes(s.topic);
    if (!(fd || (fo && (n >= 3 || dev)) || (ft && (n >= 5 || s.top || (dev && n >= 3))))) return;
    const why = fd ? (S.dossiers[s.dossier] || {}).title || 'Dossier' : fo ? outlet(fo).name : (TMAP[s.topic] || {}).name || '';
    cands.push({s, key, why, r:(s.rank || 40) + n * 2 + (dev ? 10 : 0) + (fd ? 15 : 0)});
  });
  if (!cands.length) return;
  cands.sort((a, b) => b.r - a.r);
  cands.forEach(c => { seen[c.s.id] = c.key; });
  const ks = Object.keys(seen); if (ks.length > 400) ks.slice(0, ks.length - 400).forEach(k => delete seen[k]);
  LS.set('alerted', seen);
  showAlert(cands[0].s, cands[0].why, cands.length - 1);
}

function topicChips(active, act, withAll){
  const sel = id => Array.isArray(active) ? active.includes(id) : active === id;
  return `${withAll ? `<button class="chip plain" data-act="${act}" data-topic="tutti" aria-pressed="${active === 'tutti'}">Tutto</button>` : ''}${TOPICS.map(t => `<button class="chip" data-act="${act}" data-topic="${t.id}" data-id="${t.id}" aria-pressed="${sel(t.id)}" style="--tc:${t.c}">${ticon(t.id)}${esc(t.name)}</button>`).join('')}`;
}

/* ----- Oggi ----- */
function viewOggi(){
  const m = S.meta;
  const vis = visible(S.stories);
  const nOut = new Set(); vis.forEach(s => outletsOf(s).forEach(o => nOut.add(o)));
  const sub = m && m.runAt ? `Notizie raccolte ${esc(whenText(freshAt()))} · ${vis.length} storie da ${nOut.size} testate` : '';
  const lead = vis.filter(s => s.top).sort((a, b) => (b.rank || 0) - (a.rank || 0))[0];
  const amb = lead && TMAP[lead.topic] ? TMAP[lead.topic].c : '';
  const late = !!(m && m.runAt && staleMin() > lateLimit());
  let h = `<div class="head home"${amb ? ` style="--amb:${amb}"` : ''}><span class="kicker">${esc(cap(fmtDay.format(new Date())))}</span><h1>${greeting()}${S.firstName ? ', ' + esc(S.firstName) : ''}</h1>${m && m.runAt ? `<div class="hchips" title="${esc(sub.replace(/<[^>]*>/g, ''))}"><span class="hchip ed${late ? ' late' : ''}" id="edPill"><i class="live"></i><span id="edPillTxt">${esc('Aggiornato ' + whenText(freshAt()) + (late ? ' · in ritardo' : ''))}</span></span><span class="hchip">${vis.length} storie · ${nOut.size} testate</span></div>` : ''}</div>`;
  h += `<div id="rfb">${bannerInner(refreshInfo())}</div>`;
  if (m && m.runAt && staleMin() > 2 * lateLimit()) h += `<div class="latebar"><strong>Raccolta in ritardo</strong><span>Le ultime notizie sono state raccolte ${esc(whenText(freshAt()))}. La raccolta gira su GitHub, che nelle ore di traffico rinvia o salta alcuni giri programmati: riparte da sola.</span></div>`;
  const st = feedState(true);
  if (st) return h + st;
  const counts = {}; vis.forEach(s => outletsOf(s).forEach(o => { counts[o] = (counts[o] || 0) + 1; }));
  const fresh = new Set(); vis.filter(s => hoursAgo(s.updatedAt) < 12).forEach(s => outletsOf(s).forEach(o => fresh.add(o)));
  const outs = Object.keys(counts).sort((a, b) => (S.prefs.follow.includes(b) - S.prefs.follow.includes(a)) || counts[b] - counts[a]);
  h += `<div class="orail" role="toolbar" aria-label="Filtra per testata">
    <button class="obub press" data-act="ofilter" data-id="" aria-pressed="${!S.outletF}"><span class="ring"><span class="all">${ICON.grid}</span></span><span class="lbl">Tutte</span></button>
    ${outs.map(id => `<button class="obub press ${fresh.has(id) ? 'fresh' : ''}" data-act="ofilter" data-id="${esc(id)}" aria-pressed="${S.outletF === id}"><span class="ring">${mono(id)}</span><span class="lbl">${esc(outlet(id).name)}</span></button>`).join('')}
  </div>`;
  if (!LS.get('orailSeen')) h += '<div class="ohint" aria-hidden="true">Scorri per altre testate</div>';
  const {top, rest} = oggiLists();
  if (S.outletF) h += `<div class="filterbar"><span>Solo ${esc(outlet(S.outletF).name)} · ${rest.length} storie</span><button data-act="ofilter" data-id="">Mostra tutte</button></div>`;
  if (top.length) {
    h += `<div class="sec"><h2>Prima pagina</h2><span>${top.length} storie</span></div>`;
    h += `<div class="carousel" id="car">${top.map(hero).join('')}</div><div class="dots" id="dots" aria-hidden="true">${top.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>`;
    h += `<div class="quick"><button class="qbtn press" data-act="flow" data-src="oggi"><span class="disc">${ICON.swipe}</span><span><strong>Sfoglia</strong><small>Una notizia per schermata</small></span></button>
      ${hasTTS() ? `<button class="qbtn alt press" data-act="brief"><span class="disc">${ICON.play}</span><span><strong>Ascolta</strong><small>La prima pagina a voce</small></span></button>` : `<button class="qbtn alt press" data-act="tab" data-tab="perte"><span class="disc">${ICON.plus}</span><span><strong>Per te</strong><small>Il tuo feed</small></span></button>`}</div>`;
    h += localRail(vis);
    h += foreignRail(vis, new Set(top.map(s => s.id)));
  }
  h += `<div class="chipbar"><div class="rail" role="toolbar" aria-label="Filtra per tema">${topicChips(S.topic, 'topic', true)}</div></div>`;
  const label = S.topic !== 'tutti' ? (TMAP[S.topic] || {}).long : S.outletF ? 'Le sue notizie' : 'Ultime notizie';
  h += `<div class="sec" id="latest"><h2>${esc(label)}</h2><span>${rest.length} storie</span></div>` + (S.topic === 'roma' ? zoneChips() : '');
  if (!rest.length && !top.length) return h + `<div class="state"><h3>Niente qui, per ora</h3><p>L'edizione corrente non ha storie con questo filtro. La redazione automatica aggiorna le notizie ogni quarto d'ora; il pulsante in alto scarica subito l'ultima raccolta.</p></div>`;
  return h + paged('oggi|' + S.topic + '|' + (S.outletF || '') + '|' + (S.zona || ''), rest);
}

function lcard(s){
  pushCtx(s.id);
  return `<article class="lcard press" data-act="open" data-id="${esc(s.id)}" tabindex="0" aria-label="${esc(s.headline)}">
    <div class="lv">${visual(s, 'band')}<span class="lz">${PIN}${esc(ZMAP[s.zona] || 'Roma')}</span></div>
    <div class="lin"><h3>${esc(s.headline)}</h3><div class="lmeta">${stack(s, 3)}<span class="ln">${vnames(s, 1)}</span><span class="time">${esc(ago(s.updatedAt))}</span></div></div>
  </article>`;
}
function localRail(vis){
  const all = vis.filter(s => hasTopic(s, 'roma'));
  if (all.length < 3) return '';
  const list = all.slice().sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt)).slice(0, 12);
  return `<div class="sec"><h2>Roma e provincia</h2><button class="lnk" data-act="roma-all">Tutte · ${all.length}</button></div><div class="lrail">${list.map(lcard).join('')}</div>`;
}
function zoneChips(){
  const all = visible(S.stories).filter(s => hasTopic(s, 'roma') && (!S.outletF || outletsOf(s).includes(S.outletF)));
  const zc = {}; all.forEach(s => { const z = s.zona || 'citta'; zc[z] = (zc[z] || 0) + 1; });
  const opts = [['', 'Tutta la provincia', all.length]].concat(ZONES.filter(([z]) => zc[z]).map(([z, l]) => [z, l, zc[z]]));
  return `<div class="rail zrail" role="toolbar" aria-label="Zone di Roma e provincia">${opts.map(([z, l, n]) => `<button class="chip plain" data-act="zona" data-id="${z}" aria-pressed="${(S.zona || '') === z}">${z ? PIN : ''}${esc(l)} <em>${n}</em></button>`).join('')}</div>`;
}
function foreignRail(vis, topIds){
  const list = vis.filter(s => !topIds.has(s.id) && srcOf(s).some(x => langOf(x) !== 'it')).sort((a, b) => score(b) - score(a)).slice(0, 12);
  if (list.length < 3) return '';
  const langs = new Set(); vis.forEach(s => srcOf(s).forEach(x => { const l = langOf(x); if (l !== 'it') langs.add(l); }));
  return `<div class="sec"><h2>La stampa estera</h2><span>${langs.size > 1 ? 'Titoli tradotti da ' + langs.size + ' lingue' : 'Titoli tradotti ' + (LANGF[[...langs][0]] || '')}</span></div><div class="xrail">${list.map(xcard).join('')}</div>`;
}
function xcard(s){
  pushCtx(s.id);
  const fx = srcOf(s).filter(x => langOf(x) !== 'it').sort((a, b) => ts(b.d) - ts(a.d))[0];
  const l = langOf(fx), ti = titleIt(fx), nf = new Set(srcOf(s).filter(x => langOf(x) !== 'it').map(x => x.o)).size;
  return `<article class="xcard press" data-act="open" data-id="${esc(s.id)}" tabindex="0" aria-label="${esc(s.headline)}">
    <div class="xv">${visual(s, 'band')}</div>
    <div class="xin"><div class="xo">${mono(fx.o)}<b>${esc(outlet(fx.o).name)}</b>${nf > 1 ? `<em>+${nf - 1}</em>` : ''}<span class="lang">${esc(l.toUpperCase())}</span></div>
    <q>${esc(ti || fx.t)}</q>
    <small>${ti ? 'Tradotto ' + esc(LANGF[l] || '') : 'In ' + esc(LANGN[l] || l)} · ${esc(ago(fx.d))}</small></div>
  </article>`;
}

/* ----- aggiornamento: la redazione automatica gira ogni 15 minuti, il pulsante scarica subito ----- */
function pollCfg(){ const m = S.meta || {}; return {every:Number(m.every) || 15}; }
function etaText(t){
  if (!t) return 'a breve';
  if (t < Date.now()) return 'tra pochi minuti';
  const today = fmtKey.format(new Date()) === fmtKey.format(new Date(t));
  return (today ? 'verso le ' : 'domani verso le ') + fmtHM.format(new Date(t));
}
function refreshInfo(){
  const r = S.run, now = Date.now();
  if (!r) return {k:'idle'};
  if (r.state === 'running') return {k:'running', at:r.startedAt};
  if (r.state === 'done' && now - r.finishedAt < 8 * 60000 && S.rfbHidden !== r.finishedAt) return {k:'done', at:r.finishedAt, added:r.added || 0, updated:r.updated || 0};
  if (r.state === 'error' && now - r.finishedAt < 8 * 60000 && S.rfbHidden !== r.finishedAt) return {k:'error', at:r.finishedAt, note:r.note || ''};
  return {k:'idle'};
}
function bannerInner(i){
  if (i.k === 'idle') return '';
  const m = S.meta || {};
  const hm = t => fmtHM.format(new Date(t));
  const next = m.nextAt ? etaText(ts(m.nextAt)) : 'tra qualche minuto';
  if (i.k === 'running') return `<div class="rfb run"><span class="rfi spin">${ICON.refresh}</span><div><strong>Scarico le ultime notizie</strong><small>${m.runAt ? 'Ultima raccolta della redazione automatica alle ' + hm(m.runAt) + '.' : ''}</small></div><i class="bar"></i></div>`;
  if (i.k === 'done' && staleMin() > lateLimit() && !i.added && !i.updated) return `<div class="rfb err"><span class="rfi">${ICON.refresh}</span><div><strong>Nessuna novità: ultima raccolta ${esc(ago(m.runAt))}</strong><small>La redazione automatica su GitHub è in ritardo: l'ultima edizione è stata pubblicata ${esc(whenText(m.runAt))}. Le notizie nuove arrivano da sole appena riparte.</small></div><button class="rfc" data-act="refresh-hide" data-v="${i.at}" aria-label="Chiudi">${ICON.close}</button></div>`;
  if (i.k === 'done') return `<div class="rfb ok"><span class="rfi">${ICON.check}</span><div><strong>${m.runAt ? 'Notizie aggiornate ' + esc(whenText(m.runAt)) : 'Notizie aggiornate'}</strong><small>${i.added || i.updated ? (i.added ? i.added + (i.added === 1 ? ' storia nuova' : ' storie nuove') : '') + (i.added && i.updated ? ', ' : '') + (i.updated ? i.updated + (i.updated === 1 ? ' aggiornata' : ' aggiornate') : '') + '.' : 'Nessuna novità dall\'ultimo controllo.'} Prossimo giro della redazione ${esc(next)}.</small></div>${i.added || i.updated ? '<button class="rfx" data-act="refresh-see">Vedi</button>' : ''}<button class="rfc" data-act="refresh-hide" data-v="${i.at}" aria-label="Chiudi">${ICON.close}</button></div>`;
  return `<div class="rfb err"><span class="rfi">${ICON.close}</span><div><strong>Aggiornamento non riuscito</strong><small>${esc(i.note || 'Il sito di Eddy non ha risposto.')}</small></div><button class="rfx" data-act="refresh">Riprova</button><button class="rfc" data-act="refresh-hide" data-v="${i.at}" aria-label="Chiudi">${ICON.close}</button></div>`;
}
let lastRfKey = '';
function updateRefreshUI(){
  const i = refreshInfo();
  const b = $('#refreshBtn');
  if (b) {
    b.classList.toggle('spin', i.k === 'running');
    b.classList.remove('queued');
    b.setAttribute('aria-label', i.k === 'running' ? 'Aggiornamento in corso' : 'Aggiorna le notizie');
  }
  const key = JSON.stringify(i);
  const el = $('#rfb');
  if (el && key !== lastRfKey) el.innerHTML = bannerInner(i);
  lastRfKey = key;
  if ((i.k === 'done' || i.k === 'error') && S.rfPrev === 'running') {
    toast(i.k === 'error' ? 'Aggiornamento non riuscito' : i.added ? `${i.added} ${i.added === 1 ? 'storia nuova' : 'storie nuove'}` : i.updated ? `${i.updated} ${i.updated === 1 ? 'storia aggiornata' : 'storie aggiornate'}` : staleMin() > lateLimit() ? 'Redazione in ritardo: ultima raccolta ' + ago(S.meta.runAt) : 'Sei già aggiornato');
  }
  S.rfPrev = i.k;
}
async function requestRefresh(){
  if (S.run && S.run.state === 'running') return;
  S.run = {state:'running', startedAt:Date.now()}; updateRefreshUI();
  const t0 = Date.now();
  const res = await loadData(true);
  const wait = 700 - (Date.now() - t0); if (wait > 0) await new Promise(r => setTimeout(r, wait));
  S.run = res && res.ok ? {state:'done', finishedAt:Date.now(), added:res.added, updated:res.updated}
    : {state:'error', finishedAt:Date.now(), note:(res && res.offline) || navigator.onLine === false ? 'Sei offline: restano le notizie già scaricate.' : 'Il sito di Eddy non ha risposto. Riprova tra poco.'};
  updateRefreshUI();
  if (S.tab === 'oggi') scheduleRender();
}
function cancelRefresh(){}

/* ----- Per te ----- */
function viewPerTe(){
  const p = S.prefs;
  let h = `<div class="head"><span class="kicker">Il tuo feed</span><h1>Per te</h1><p>Tocca un tema per aggiungerlo o toglierlo: il feed si riordina subito.</p></div>`;
  h += `<div class="rail" role="toolbar" aria-label="I tuoi interessi">${topicChips(p.topics, 'ttopic', false)}</div>`;
  const st = feedState(false); if (st) return h + st;
  if (!p.topics.length && !p.follow.length && !p.dossiers.length) {
    return h + `<div class="state"><h3>Scegli almeno un tema</h3><p>Tocca i temi qui sopra oppure segui qualche testata in Esplora: le storie che li riguardano saliranno in cima.</p></div>`;
  }
  const list = perTeList();
  h += `<div class="quick"><button class="qbtn press" data-act="flow" data-src="perte"><span class="disc">${ICON.swipe}</span><span><strong>Sfoglia</strong><small>${list.length} storie per te</small></span></button>
    <button class="qbtn alt press" data-act="tab" data-tab="esplora"><span class="disc">${ICON.plus}</span><span><strong>Testate</strong><small>${p.follow.length ? p.follow.length + (p.follow.length === 1 ? ' seguita' : ' seguite') : 'Scegli chi seguire'}</small></span></button></div>`;
  const ds = Object.values(S.dossiers).filter(d => countDossier(d.id) > 0)
    .sort((a, b) => (p.dossiers.includes(b.id) - p.dossiers.includes(a.id)) || (ts(b.updatedAt) - ts(a.updatedAt)));
  if (ds.length) h += `<div class="sec"><h2>Dossier</h2><span>storie che continuano</span></div><div class="drail">${ds.map(dcard).join('')}</div>`;
  h += `<div class="sec"><h2>Scelte per te</h2><span>${list.length} storie</span></div>`;
  if (!list.length) return h + `<div class="state"><h3>Niente di nuovo sui tuoi temi</h3><p>Questa edizione non ha storie sui temi scelti. Aggiungine altri qui sopra.</p></div>`;
  return h + feature(list[0], 'La più rilevante per te') + paged('perte', list.slice(1));
}
function dossierVisual(d){
  const withImg = visible(S.stories).filter(s => s.dossier === d.id && hasImg(s)).sort((a, b) => (b.rank || 0) - (a.rank || 0))[0];
  if (withImg) return visual(withImg, 'band');
  const withPlace = visible(S.stories).filter(s => s.dossier === d.id && hasPlace(s))[0];
  return withPlace ? mapSvg(withPlace.place, 'band') : art({id:'d-' + d.id, topic:d.topic, headline:d.title}, 'band');
}
function countDossier(id){ return visible(S.stories).filter(s => s.dossier === id).length; }
function dcard(d){
  const n = countDossier(d.id); const t = TMAP[d.topic] || {name:''}; const f = S.prefs.dossiers.includes(d.id);
  return `<button class="dcard press" data-act="dossier" data-id="${esc(d.id)}"><div class="dart">${dossierVisual(d)}</div><span class="dchip" style="--tc:${t.c || '#888'}">${ticon(d.topic)}${esc(t.name)}</span><div class="din"><span class="dtx"><strong>${esc(d.title)}</strong><span>${f ? '<b class="fol">Segui</b> · ' : ''}aggiornato ${esc(ago(d.updatedAt))}</span></span><span class="dnum"><small>${n === 1 ? 'storia' : 'storie'}</small><b>${n}</b></span></div></button>`;
}

/* ----- Esplora ----- */
function viewEsplora(){
  if (S.explore) return viewExploreDetail();
  return `<div class="head"><span class="kicker">Esplora</span><h1>Cerca e scopri</h1></div>
    <label class="search" for="q">${ICON.search}<span class="sr">Cerca</span><input id="q" type="search" placeholder="Notizie, persone, luoghi" autocomplete="off" enterkeyhint="search"></label>
    ${xfPanel()}
    <div id="results">${searchResults()}</div>`;
}
function searchResults(){
  const q = norm(S.query).trim();
  if (q.length >= 2 || xfCount()) {
    const words = q.length >= 2 ? q.split(/\s+/) : [];
    const f = S.xf, now = Date.now();
    const res = visible(S.stories).filter(s => {
      if (f.p && now - ts(s.updatedAt) > f.p * 3600000) return false;
      if (outletsOf(s).length < (f.min || 1)) return false;
      if (f.topic && !hasTopic(s, f.topic)) return false;
      if (f.o && !outletsOf(s).includes(f.o)) return false;
      if (!words.length) return true;
      const hay = norm([s.headline, s.dek, s.summary, (s.tags || []).join(' '), (s.sources || []).map(x => x.t + ' ' + (x.ti || '')).join(' '), (s.sources || []).map(x => outlet(x.o).name).join(' ')].join(' '));
      return words.every(w => hay.includes(w));
    }).sort(xfSorter(q.length >= 2));
    const was = collecting; collecting = true; CTX = [];
    const out = `<div class="sec"><h2>Risultati</h2><span>${res.length}</span></div>` + (res.length ? paged('q|' + q, res) : `<div class="state"><h3>Nessun risultato</h3><p>${q.length >= 2 ? `Nessuna storia degli ultimi sette giorni contiene «${esc(S.query)}»${xfCount() ? ' con questi filtri' : ''}.` : 'Nessuna storia corrisponde ai filtri scelti.'}</p></div>`);
    if (!was) { collecting = false; S.ctx = CTX; }
    return out;
  }
  const vis = visible(S.stories);
  let h = `<div class="sec"><h2>Temi</h2><span>storie in archivio</span></div><div class="ttiles">`;
  h += TOPICS.map(t => { const n = vis.filter(s => hasTopic(s, t.id)).length; return `<button class="ttile nav press" data-act="xtopic" data-id="${t.id}" style="--tc:${t.c}"><span class="ic">${ticon(t.id)}</span><span class="tnum"><b>${n}</b><small>${n === 1 ? 'storia' : 'storie'}</small></span><span><strong>${esc(t.long)}</strong></span></button>`; }).join('');
  h += `</div>`;
  const ds = Object.values(S.dossiers).filter(d => countDossier(d.id) > 0).sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
  if (ds.length) h += `<div class="sec"><h2>Dossier</h2><span>${ds.length}</span></div><div class="drail">${ds.map(dcard).join('')}</div>`;
  const outs = Object.values(S.outlets).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));
  h += `<div class="sec"><h2>Testate</h2><span>${outs.length}</span></div>`;
  const st = feedState(false);
  if (st && !outs.length) return h + st;
  h += outletGroups(outs, orow) + `<p class="hint">Segui: le sue storie salgono in «Per te». Silenzia: spariscono da tutto il feed. Le testate estere sono tradotte in italiano.</p>`;
  return h;
}
function outletGroups(outs, fn){
  return SECS.map(([k, label]) => {
    const g = outs.filter(o => secOf(o) === k); if (!g.length) return '';
    return `<h4 class="grp">${esc(label)}<span>${g.length}</span></h4><div class="olist">${g.map(fn).join('')}</div>`;
  }).join('');
}
const OCN = {ref:null, m:{}};
function outletCount(id){
  if (OCN.ref !== S.stories) { OCN.ref = S.stories; OCN.m = {}; S.stories.forEach(s => new Set((s.sources || []).map(x => x.o)).forEach(o => { OCN.m[o] = (OCN.m[o] || 0) + 1; })); }
  return OCN.m[id] || 0;
}
function langLabel(o){ return o.lang && o.lang !== 'it' ? 'in ' + (LANGN[o.lang] || o.lang) : ''; }
function orow(o){
  const n = outletCount(o.id);
  const f = S.prefs.follow.includes(o.id), m = S.prefs.mute.includes(o.id);
  return `<div class="orow">${mono(o.id, 'md')}<button class="oinfo" data-act="xoutlet" data-id="${esc(o.id)}"><strong>${esc(o.name)}</strong><span>${esc([o.kind, langLabel(o), n + (n === 1 ? ' storia' : ' storie')].filter(Boolean).join(' · '))}</span></button>
    <button class="tog" data-act="follow" data-id="${esc(o.id)}" aria-pressed="${f}">${f ? 'Segui già' : 'Segui'}</button>
    <button class="mutei" data-act="mute" data-id="${esc(o.id)}" aria-pressed="${m}" aria-label="Silenzia ${esc(o.name)}" title="Silenzia">${ICON.mute}</button></div>`;
}
function viewExploreDetail(){
  const x = S.explore;
  let h = `<button class="back" data-act="xback">${ICON.back}Esplora</button>`;
  let list = [];
  if (x.kind === 'topic') {
    const t = TMAP[x.id] || {long:x.id, name:x.id, c:'#888'};
    const on = S.prefs.topics.includes(x.id);
    list = visible(S.stories).filter(s => hasTopic(s, x.id)).sort((a, b) => score(b) - score(a));
    h += `<div class="dhead"><div class="dcover">${art({id:'t-' + x.id, topic:x.id, headline:t.long}, 'band')}</div><small>Tema</small><h1>${esc(t.long)}</h1><div class="row2"><button class="tog" data-act="ttopic" data-id="${esc(x.id)}" aria-pressed="${on}">${on ? 'Nei tuoi interessi' : 'Aggiungi ai tuoi interessi'}</button></div></div>`;
  } else if (x.kind === 'outlet') {
    const o = outlet(x.id);
    const f = S.prefs.follow.includes(o.id), m = S.prefs.mute.includes(o.id);
    list = S.stories.filter(s => (s.sources || []).some(y => y.o === o.id)).sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
    h += `<div class="dhead"><small>Testata</small><div style="display:flex;align-items:center;gap:12px">${mono(o.id, 'lg')}<h1>${esc(o.name)}</h1></div>
      <p>${esc([o.kind, langLabel(o) ? langLabel(o) + ', tradotta da Eddy' : 'in italiano'].filter(Boolean).join(' · '))}${o.site ? ` · <a href="${esc(o.site)}" target="_blank" rel="noopener">${esc(o.site.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>` : ''}</p>
      <div class="row2"><button class="tog" data-act="follow" data-id="${esc(o.id)}" aria-pressed="${f}">${f ? 'Segui già' : 'Segui'}</button><button class="tog mute" data-act="mute" data-id="${esc(o.id)}" aria-pressed="${m}">${m ? 'Silenziata' : 'Silenzia'}</button></div></div>`;
  } else if (x.kind === 'dossier') {
    const d = S.dossiers[x.id] || {title:x.id, topic:'mondo'};
    const on = S.prefs.dossiers.includes(x.id);
    list = visible(S.stories).filter(s => s.dossier === x.id).sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
    h += `<div class="dhead"><div class="dcover">${dossierVisual(Object.assign({id:x.id}, d))}</div><small>Dossier · ${esc((TMAP[d.topic] || {}).name || '')}</small><h1>${esc(d.title)}</h1>${d.blurb ? `<p>${esc(d.blurb)}</p>` : ''}<div class="row2"><button class="tog" data-act="fdossier" data-id="${esc(x.id)}" aria-pressed="${on}">${on ? 'Segui già' : 'Segui il dossier'}</button></div></div>`;
  }
  h += `<div class="sec"><h2>Storie</h2><span>${list.length}</span></div>`;
  h += list.length ? paged('x|' + x.kind + '|' + x.id, list) : `<div class="state"><h3>Nessuna storia</h3><p>Negli ultimi sette giorni non ci sono storie qui.</p></div>`;
  return h;
}

/* ----- Salvati ----- */
function viewSalvati(){
  let h = `<div class="head"><span class="kicker">La tua lista</span><h1>Salvati</h1><p>Restano su questo dispositivo, anche offline.</p></div>`;
  h += `<div class="seg" role="tablist"><button data-act="seg" data-seg="salvati" aria-pressed="${S.savedSeg === 'salvati'}">Salvati</button><button data-act="seg" data-seg="cronologia" aria-pressed="${S.savedSeg === 'cronologia'}">Letti di recente</button></div>`;
  if (S.savedSeg === 'salvati') {
    const items = Object.entries(S.saved).sort((a, b) => ts(b[1].at) - ts(a[1].at));
    if (!items.length) return h + `<div class="state"><h3>Nessuna notizia salvata</h3><p>Tocca il segnalibro su una storia per ritrovarla qui, anche dopo che è uscita dall'archivio.</p></div>`;
    return h + `<div class="feed" style="margin-top:6px">${items.map(([id, v]) => row(S.byId.get(id) || Object.assign({id}, v.s || {}))).join('')}</div>`;
  }
  const seen = new Set();
  const items = S.history.filter(x => x && x.id && !seen.has(x.id) && seen.add(x.id));
  if (!items.length) return h + `<div class="state"><h3>Nessuna lettura</h3><p>Le storie che apri compaiono qui.</p></div>`;
  return h + `<div class="feed" style="margin-top:6px">${items.map(x => { const s = S.byId.get(x.id) || (S.saved[x.id] && S.saved[x.id].s && Object.assign({id:x.id}, S.saved[x.id].s)) || (x.s && Object.assign({id:x.id}, x.s)); return s ? row(s) : ''; }).join('')}</div>
    <p class="hint"><button class="tog" data-act="clear-history">Svuota la cronologia</button></p>`;
}

/* ----- Profilo ----- */
function topicTile(t){
  const on = S.prefs.topics.includes(t.id);
  return `<button class="ttile press" data-act="ttopic" data-id="${t.id}" aria-pressed="${on}" style="--tc:${t.c}"><span class="ic">${ticon(t.id)}</span><span class="ck">${ICON.check}</span><span><strong>${esc(t.long)}</strong></span></button>`;
}
function viewProfilo(){
  const p = S.prefs, m = S.meta || {};
  let h = `<div class="head"><span class="kicker">Impostazioni</span><h1>Il tuo Eddy</h1></div>`;
  h += `<div class="pgroup"><h3 id="intCount">Interessi · ${p.topics.length} scelti</h3><div class="ttiles">${TOPICS.map(topicTile).join('')}</div><p class="hint">Decidono l'ordine di «Per te». «Oggi» mostra sempre tutto.</p></div>`;
  h += `<div class="pgroup"><h3>Testate</h3><div class="pbox"><p style="margin:0">${p.follow.length ? 'Segui ' + p.follow.map(id => esc(outlet(id).name)).join(', ') + '.' : 'Non segui ancora nessuna testata.'}${p.mute.length ? ' Silenziate: ' + p.mute.map(id => esc(outlet(id).name)).join(', ') + '.' : ''}</p><button class="btn ghost" style="margin-top:12px" data-act="tab" data-tab="esplora">Gestisci le testate</button></div></div>`;
  h += `<div class="pgroup"><h3>Dimensione del testo</h3><div class="seg" style="margin-top:0">${[['s','Piccolo'],['m','Medio'],['l','Grande']].map(([k, l]) => `<button data-act="size" data-v="${k}" aria-pressed="${p.size === k}">${l}</button>`).join('')}</div></div>`;
  if (hasTTS()) h += `<div class="pgroup"><h3>Velocità di ascolto</h3><div class="seg" style="margin-top:0">${[0.9, 1, 1.15, 1.3].map(r => `<button data-act="rate" data-v="${r}" aria-pressed="${p.rate === r}">${String(r).replace('.', ',')}×</button>`).join('')}</div></div>`;
  h += `<div class="pgroup"><h3>Avvisi</h3><div class="seg" style="margin-top:0">${[['1', 'Attivi'], ['0', 'Spenti']].map(([k, l]) => `<button data-act="alerts" data-v="${k}" aria-pressed="${(p.alerts !== false) === (k === '1')}">${l}</button>`).join('')}</div><p class="hint">Con l'app aperta, un avviso in alto segnala le novità importanti nei dossier, nelle testate e nei temi che segui. Ad app chiusa non arrivano notifiche: servirebbe un servizio di invio sempre acceso, che GitHub Pages non offre.</p></div>`;
  const nh = Object.keys(HID).length + Object.keys(SUMOFF).length;
  if (nh) h += `<div class="pgroup"><h3>Segnalazioni</h3><div class="pbox"><p style="margin:0">${nh} ${nh === 1 ? 'correzione attiva' : 'correzioni attive'} su questo telefono: articoli tolti da una storia o sintesi nascoste. Durano due settimane, il tempo che la redazione automatica applichi le segnalazioni inviate.</p><div class="row2" style="margin-top:12px"><button class="tog" data-act="unhide">Ripristina tutto</button></div></div></div>`;
  const ok = (m.outletsOk || []).map(id => outlet(id).name), ko = (m.outletsFailed || []).map(id => outlet(id).name);
  h += `<div class="pgroup"><h3>Edizioni</h3><div class="pbox"><dl class="kv">
    <dt>Ultima</dt><dd>${m.runAt ? esc('Aggiornata ' + fmtDMHM.format(new Date(m.runAt)) + ' (' + (m.label || 'edizione').toLowerCase() + ')') : '—'}</dd>
    <dt>Ultima raccolta</dt><dd>${freshAt() ? esc(fmtDMHM.format(new Date(freshAt())) + (staleMin() > lateLimit() ? ' · in ritardo' : '')) : '—'}</dd>
    <dt>Prima pagina</dt><dd>Nuova edizione alle 07:00 e alle 19:00</dd>
    <dt>Prossimo giro</dt><dd>${m.nextAt ? esc(etaText(ts(m.nextAt))) : '—'}</dd>
    <dt>Aggiornamenti</dt><dd>Circa ogni ${pollCfg().every} minuti, giorno e notte: ogni giro prenota il successivo, perché gli orari programmati di GitHub arrivano con ore di ritardo. Il pulsante ${ICON.refresh.replace('class="i"', 'class="i inl"')} in alto scarica subito l'ultima raccolta</dd>
    ${m.translate && m.translate.langs ? `<dt>Traduzioni</dt><dd>${esc(Object.entries(m.translate.langs).filter(([, v]) => v).map(([k]) => LANGN[k] || k).join(', ') || 'in preparazione')}</dd>` : ''}
    <dt>Archivio</dt><dd>${S.stories.length} storie degli ultimi 7 giorni</dd>
    <dt>Testate</dt><dd>${Object.keys(S.outlets).length} in ${new Set(Object.values(S.outlets).map(o => o.lang || 'it')).size} lingue</dd>
    ${ok.length ? `<dt>Fonti lette</dt><dd>${ok.length} testate nell'ultima raccolta</dd>` : ''}
    ${ko.length ? `<dt>Non raggiunte</dt><dd>${esc(ko.join(', '))}</dd>` : ''}
  </dl></div></div>`;
  h += `<div class="pgroup"><button class="btn full" data-act="refresh">${ICON.refresh}Aggiorna adesso</button></div>`;
  h += installBlock();
  h += `<div class="pgroup"><h3>Il tuo nome</h3><div class="pbox"><label class="sr" for="nameInput">Nome per il saluto</label><input id="nameInput" class="tinput" value="${esc(S.prefs.name || '')}" placeholder="Come ti saluta Eddy" autocomplete="given-name" maxlength="40"></div></div>`;
  h += `<div class="pgroup"><h3>Copia di sicurezza</h3><div class="pbox"><p style="margin:0">Interessi, testate, salvati e cronologia restano su questo dispositivo. Per spostarli su un altro telefono esporta il file e importalo là.</p><div class="row2" style="margin-top:12px"><button class="btn ghost" data-act="export">Esporta</button><label class="btn ghost" for="importFile">Importa</label><input id="importFile" type="file" accept="application/json,.json" hidden></div></div></div>`;
  h += `<div class="pgroup"><h3>Come funziona</h3><div class="pbox prose">
    <p>Ogni quarto d'ora un programma automatico, che gira gratis su GitHub, legge i feed pubblici di oltre cento testate italiane, locali di Roma e provincia ed estere, riconosce quando più giornali raccontano lo stesso fatto confrontando le parole e i nomi dei titoli, e li riunisce in un'unica storia con le testate in cima. Alle 07:00 e alle 19:00 sceglie la prima pagina: le storie riprese da più testate, con una sola storia per fatto.</p>
    <p>Non ci sono intelligenze artificiali generative né abbonamenti: titoli, sommari e punti chiave sono frasi delle testate stesse, con il nome di chi le ha scritte. I titoli e i sommari esteri sono tradotti in italiano da modelli di traduzione aperti (OPUS-MT dell'Università di Helsinki) che girano nello stesso programma; sotto ogni traduzione resta l'originale con il link all'articolo.</p>
    <p>I loghi sono le icone ufficiali dei siti delle testate. Le foto restano sui siti di chi le ha pubblicate e arrivano ridimensionate tramite wsrv.nl; quando una notizia non ha foto compare la mappa del luogo o un'illustrazione del tema.</p>
    <p>Le tue scelte e i salvati non lasciano il dispositivo.</p>
  </div></div>`;
  h += `<div class="pgroup"><button class="btn ghost full" data-act="onb-open" data-step="0">Rifai la configurazione iniziale</button></div>`;
  return h;
}


/* ---------- spazio foto ---------- */
async function loadStorage(){
  const C = window.claude; if (!C || typeof C.use !== 'function') return;
  let a = null; try { a = await C.use('assets'); } catch (e) { a = null; }
  S.assetsApi = a;
  if (!a) { S.assetInfo = null; return; }
  try { S.assetInfo = await a.list(); } catch (e) { S.assetInfo = {err:e && e.code}; }
  if (S.tab === 'profilo') scheduleRender();
}
function usedAssetIds(){
  const used = new Set();
  const add = x => { if (x && x.img && x.img.id) used.add(x.img.id); };
  S.stories.forEach(add);
  Object.values(S.saved).forEach(v => add(v && v.s));
  S.history.forEach(x => add(x && x.s));
  return used;
}
function storageBlock(){
  const info = S.assetInfo;
  if (!S.assetsApi || !info || info.err || !info.usage) return '';
  const u = info.usage, used = usedAssetIds();
  const orphans = (info.assets || []).filter(a => !used.has(a.id));
  const pct = u.maxBytes ? Math.min(100, u.bytes / u.maxBytes * 100) : 0;
  const mb = b => (b / 1048576).toFixed(b > 104857600 ? 0 : 1).replace('.', ',');
  return `<div class="pgroup"><h3>Spazio foto</h3><div class="pbox"><div class="meter"><i style="width:${pct.toFixed(1)}%"></i></div>
    <p class="hint" style="margin-top:10px">${u.files} foto · ${mb(u.bytes)} MB su ${mb(u.maxBytes)} MB</p>
    ${orphans.length ? `<button class="btn ghost full" style="margin-top:12px" data-act="clean-assets">${S.cleanConfirm ? `Conferma: elimina ${orphans.length} foto` : `Libera spazio: ${orphans.length} foto non più usate`}</button>` : '<p class="hint">Nessuna foto inutilizzata.</p>'}
  </div></div>`;
}
async function cleanAssets(){
  if (!S.assetsApi || !S.assetInfo) return;
  if (!S.cleanConfirm) { S.cleanConfirm = true; render(); return; }
  S.cleanConfirm = false;
  const used = usedAssetIds();
  const orphans = (S.assetInfo.assets || []).filter(a => !used.has(a.id));
  let n = 0;
  toast('Elimino le foto non più usate…');
  for (const a of orphans) { try { const r = await S.assetsApi.delete(a.id); if (r && r.deleted) n++; } catch (e) { if (e && e.code === 'rate_limited') break; } }
  toast(n + ' foto eliminate');
  await loadStorage(); render();
}

/* ---------- lettore ---------- */
function getStory(id){ return S.byId.get(id) || (S.saved[id] && S.saved[id].s && Object.assign({id}, S.saved[id].s)) || null; }
function openStory(id, opts){
  opts = opts || {};
  const s = getStory(id); if (!s) return;
  if (opts.ctx) S.storyCtx = opts.ctx.slice();
  else if (!opts.keepCtx) S.storyCtx = (S.flow ? S.flow.ids : S.ctx).slice();
  const wasOpen = !!S.story;
  S.story = id;
  addHistory(s);
  const sh = $('#sheet');
  sh.hidden = false;
  if (!wasOpen) { sh.classList.remove('enter'); void sh.offsetWidth; sh.classList.add('enter'); }
  document.body.classList.add('locked');
  renderSheet(false);
  sh.scrollTop = 0;
  if (!opts.fromPop) { try { if (wasOpen && history.state && history.state.story) history.replaceState({story:id}, '', '#s-' + id); else history.pushState({story:id}, '', '#s-' + id); } catch (e) {} }
}
function closeStory(fromPop){
  if (!S.story) return;
  S.story = null;
  $('#sheet').hidden = true; $('#sheet').innerHTML = '';
  if (!S.flow) document.body.classList.remove('locked');
  if (!fromPop) { try { if (history.state && history.state.story) history.back(); else history.replaceState(null, '', '#' + S.tab); } catch (e) {} }
}
function nextOf(id){
  const ctx = S.storyCtx || [];
  const i = ctx.indexOf(id);
  for (let j = i + 1; j < ctx.length; j++) { const n = getStory(ctx[j]); if (n) return n; }
  return null;
}
function renderSheet(keepScroll){
  const s = getStory(S.story); const sh = $('#sheet');
  if (!s) { closeStory(); return; }
  const st = keepScroll ? sh.scrollTop : 0;
  const srcs = srcOf(s).slice().sort((a, b) => ts(a.d) - ts(b.d));
  const ids = outletsOf(s);
  const paras = String(s.summary || '').split(/\n{2,}/).filter(Boolean);
  const sumOff = !!(s.sumOff || SUMOFF[s.id]);
  const d = s.dossier ? S.dossiers[s.dossier] : null;
  const rel = s.dossier ? visible(S.stories).filter(x => x.dossier === s.dossier && x.id !== s.id).sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt)).slice(0, 3) : [];
  const nx = nextOf(s.id);
  const saved = isSaved(s.id);
  sh.innerHTML = `<div class="prog" id="prog"></div>
  <div class="sbar" id="sbar"><div class="wrap">
    <button class="iconbtn" data-act="close" aria-label="Chiudi la notizia">${ICON.back}</button><span class="grow"></span>
    ${srcs.length ? `<button class="iconbtn" data-act="copy" data-url="${esc(srcs[srcs.length - 1].u)}" aria-label="Copia il link della fonte">${ICON.copy}</button>` : ''}
  </div></div>
  <div class="scover">${visual(s, 'wide')}${hasImg(s) ? `<span class="credit">Foto: ${esc(outlet(s.img.o).name)}</span>` : ''}</div>
  <div class="sin"><div class="wrap">
    <div class="coverage-head"><small>Riportata da</small>${coverage(ids.length, s.id)}</div>
    <div class="ostrip">${ids.map(id => { const x = srcs.filter(y => y.o === id).slice(-1)[0]; return `<a class="ochip" href="${esc(x ? x.u : '#')}" target="_blank" rel="noopener">${mono(id)}${esc(outlet(id).name)}</a>`; }).join('')}</div>
    ${agencyLine(srcs)}
    <div class="s-top">${topicTag(s)}<span>${esc(s.updatedAt ? 'Aggiornata ' + ago(s.updatedAt) : '')}</span>${d ? `<button class="tog" data-act="dossier" data-id="${esc(d.id)}">Dossier · ${esc(d.title)}</button>` : ''}</div>
    <h1 class="s-hl">${esc(s.headline)}</h1>
    ${s.dek ? `<p class="s-dek">${esc(s.dek)}</p>` : ''}
    ${sumOff ? '<p class="s-off">La sintesi automatica di questa storia è stata ritirata dopo una segnalazione: restano i titoli originali delle testate.</p>' : paras.length ? `<div class="s-body"><div class="s-lbl">Cosa riportano le testate<span>Sintesi automatica fatta di frasi delle fonti: ogni passaggio indica da quale testata viene</span></div>${paras.map(fmtPara).join('')}</div>` : ''}
    ${!sumOff && (s.points || []).length ? `<div class="blk"><h3>Punti chiave</h3><ol class="kp">${s.points.map(p => `<li><span>${fmtPoint(p)}</span></li>`).join('')}</ol></div>` : ''}
    ${s.why ? `<div class="blk"><h3>Perché è in evidenza</h3><div class="why"><span class="wi"><svg class="i" viewBox="0 0 24 24"><path d="M11 3.5l1.9 5.1L18 10.5l-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg></span><p>${esc(s.why)}</p></div></div>` : ''}
    ${hasPlace(s) && hasImg(s) ? `<div class="blk"><h3>Dove</h3><div class="mapbox">${mapSvg(s.place, 'wide')}</div></div>` : ''}
    ${compareBlock(srcs)}
    ${timelineBlock(srcs)}
    <div class="blk" id="srcBlk"><h3>Come la raccontano</h3><div class="src" id="srcList">${srcs.map(x => srow(x, ids.length > 1)).join('')}</div>${!sumOff && paras.length ? `<button class="flagsum" data-act="flag-sum" data-id="${esc(s.id)}">La sintesi non rappresenta le fonti? Segnalalo</button>` : ''}</div>
    ${rel.length ? `<div class="blk"><h3>Nello stesso dossier</h3><div class="feed">${rel.map(row).join('')}</div></div>` : ''}
    ${nx ? `<button class="nextcard press" data-act="open-next" data-id="${esc(nx.id)}"><span><small>Prossima storia</small><strong>${esc(nx.headline)}</strong></span><span class="nth">${visual(nx, 'thumb')}</span></button>` : ''}
  </div></div>
  <div class="sdock" role="toolbar" aria-label="Azioni sulla storia">
    ${hasTTS() ? `<button class="dk main" data-act="listen" data-id="${esc(s.id)}">${ICON.listen}<span>Ascolta</span></button>` : srcs.length ? `<a class="dk main" href="${esc(srcs[srcs.length - 1].u)}" target="_blank" rel="noopener">${ICON.ext}<span>Leggi su ${esc(outlet(srcs[srcs.length - 1].o).name)}</span></a>` : ''}
    ${navigator.share || window.EddyAndroid ? `<button class="dk" data-act="share" data-id="${esc(s.id)}" aria-label="Condividi">${ICON.share}</button>` : ''}
    <button class="dk savebtn" data-act="save" data-id="${esc(s.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Rimuovi dai salvati' : 'Salva'}">${ICON.save}</button>
  </div>`;
  sh.scrollTop = st;
  onSheetScroll();
}
function cleanAuthor(a, o){
  let t = String(a || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t || /redazione|staff|agenzi|newsroom|editor|reporters?$/i.test(t) || norm(t) === norm(o.name)) return '';
  return t.replace(/^(di|by|par|por|von)\s+/i, '');
}
function srow(x, canFlag){
  const o = outlet(x.o), l = langOf(x), ti = titleIt(x);
  const foreign = l !== 'it';
  return `<div class="srow">${mono(x.o, 'md')}<div><div class="who">${esc(o.name)}${foreign ? ` <span class="lang">${esc(l.toUpperCase())}</span>` : ''}${x.ag ? `<span class="agb">${x.ag === x.o ? 'agenzia' : 'testo ' + esc(agName(x.ag))}</span>` : ''}<time>${esc(x.d ? fmtDMHM.format(new Date(x.d)) : '')}</time></div>
    <q${foreign && !ti ? ` lang="${esc(l)}"` : ''}>${esc(ti || x.t)}</q>
    ${foreign && ti ? `<div class="orig"><span>${ICON.translate}Originale in ${esc(LANGN[l] || l)}</span><q lang="${esc(l)}">${esc(x.t)}</q></div>` : ''}
    ${cleanAuthor(x.a, o) ? `<div class="by">di ${esc(cleanAuthor(x.a, o))}</div>` : ''}<div class="sact"><a href="${esc(x.u)}" target="_blank" rel="noopener">Leggi su ${esc(o.name)} ${ICON.ext}</a>${canFlag ? `<button class="flag" data-act="flag-src" data-u="${esc(x.u)}">Non c'entra?</button>` : ''}</div></div></div>`;
}
function onSheetScroll(){
  const sh = $('#sheet'); const pr = $('#prog'); const bar = $('#sbar'); if (!pr || !bar) return;
  const max = sh.scrollHeight - sh.clientHeight;
  pr.style.transform = `scaleX(${max > 0 ? Math.min(1, sh.scrollTop / max) : 0})`;
  const cov = $('.scover', sh); bar.classList.toggle('solid', !!cov && sh.scrollTop > cov.offsetHeight - 80);
  const dock = $('.sdock', sh), y = sh.scrollTop, py = sh._py || 0;
  if (dock) { if (y > 220 && y > py + 8 && y < max - 160) dock.classList.add('away'); else if (y < py - 8 || y <= 220 || y >= max - 160) dock.classList.remove('away'); }
  if (Math.abs(y - py) > 8) sh._py = y;
}
const QSTOP = new Set('il lo la i gli le un uno una di a da in con su per tra fra e o ma che chi cosa come dove quando perche perché quale quali quanto quanti quante è e sono era stato sta stanno ha hanno ho del dello della dei degli delle al allo alla ai agli alle dal dalla dai nel nella nei sul sulla sui si ci ne non piu più mi ti me te lui lei loro questo questa questi queste quello quella sapere dimmi spiega spiegami cosa è successo succede oggi notizia storia'.split(' '));
/* ---------- sfoglia ---------- */
function openFlow(ids, start){
  ids = ids.filter(id => getStory(id));
  if (!ids.length) return;
  S.flow = {ids, idx:start || 0};
  const el = $('#flow');
  el.innerHTML = `<div class="fx"><span id="fcount">1 / ${ids.length}</span><button data-act="flow-close" aria-label="Chiudi">${ICON.close}</button></div>
    <div class="track" id="ftrack">${ids.map((id, i) => slide(getStory(id), i)).join('')}</div>`;
  el.hidden = false;
  document.body.classList.add('locked', 'flow-on');
  const tr = $('#ftrack');
  tr.addEventListener('scroll', onFlowScroll, {passive:true});
  if (start) tr.scrollTop = start * tr.clientHeight;
  try { history.pushState({flow:1}, '', '#sfoglia'); } catch (e) {}
}
function slide(s, i){
  const t = TMAP[s.topic] || {name:'', c:'#888'};
  const first = String(s.summary || '').split(/\n{2,}/)[0] || s.dek || '';
  const on = isSaved(s.id);
  return `<section class="slide" data-id="${esc(s.id)}" style="--tc:${t.c}" aria-label="${esc(s.headline)}">
    <div class="vtop">${stack(s, 5)}<span class="vn">${vnames(s, 2)}</span></div>
    <div class="scv">${visual(s, 'wide')}<span class="tag">${ticon(s.topic)}${esc(t.name)}</span></div>
    <div class="meta">${outletsOf(s).length} testate · aggiornata ${esc(ago(s.updatedAt))}</div>
    <h2>${esc(s.headline)}</h2>
    <p class="sd">${esc(first)}</p>
    <div class="acts"><button class="btn" data-act="open" data-id="${esc(s.id)}">Leggi la storia ${ICON.send}</button>
      ${hasTTS() ? `<button class="rbtn" data-act="listen" data-id="${esc(s.id)}" aria-label="Ascolta">${ICON.listen}</button>` : ''}
      <button class="rbtn" data-act="save" data-id="${esc(s.id)}" aria-pressed="${on}" aria-label="${on ? 'Rimuovi dai salvati' : 'Salva'}">${ICON.save}</button></div>
    ${i === 0 ? '<div class="hintup">Scorri verso l\'alto per la prossima</div>' : ''}
  </section>`;
}
function onFlowScroll(){
  const tr = $('#ftrack'); if (!tr || !S.flow) return;
  const i = Math.round(tr.scrollTop / Math.max(1, tr.clientHeight));
  S.flow.idx = i;
  const c = $('#fcount'); if (c) c.textContent = (i + 1) + ' / ' + S.flow.ids.length;
}
function closeFlow(fromPop){
  if (!S.flow) return;
  S.flow = null;
  $('#flow').hidden = true; $('#flow').innerHTML = '';
  document.body.classList.remove('flow-on');
  if (!S.story) document.body.classList.remove('locked');
  if (!fromPop) { try { if (history.state && history.state.flow) history.back(); } catch (e) {} }
}

/* ---------- salvati e cronologia ---------- */
function snap(s){ return {headline:s.headline, dek:s.dek || '', summary:s.summary || '', points:s.points || [], why:s.why || '', topic:s.topic, dossier:s.dossier || null, updatedAt:s.updatedAt, sources:(s.sources || []).slice(0, 12), img:s.img || null, place:s.place || null}; }
function toggleSave(id, btn){
  const s = getStory(id); if (!s) return;
  if (S.saved[id]) { delete S.saved[id]; toast('Rimossa dai salvati'); }
  else { S.saved[id] = {at:new Date().toISOString(), s:snap(s)}; toast('Salvata nella tua lista'); }
  const on = !!S.saved[id];
  document.querySelectorAll(`[data-act="save"][data-id="${CSS.escape(id)}"]`).forEach(b => { b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Rimuovi dai salvati' : 'Salva'); });
  if (btn && on) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
  persist('saved', 200);
  if (S.tab === 'salvati') scheduleRender();
}
function addHistory(s){
  S.history = [{id:s.id, at:new Date().toISOString(), s:{headline:s.headline, topic:s.topic, updatedAt:s.updatedAt, img:s.img || null, place:s.place || null, sources:(s.sources || []).slice(0, 6).map(x => ({o:x.o, t:x.t, u:x.u, d:x.d}))}}].concat(S.history.filter(x => x.id !== s.id)).slice(0, 80);
  persist('history', 1500);
}

/* ---------- preferenze ---------- */
function togglePref(key, id){
  const arr = Array.isArray(S.prefs[key]) ? S.prefs[key].slice() : [];
  const i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1); else arr.push(id);
  S.prefs[key] = arr;
  if (key === 'follow' && i < 0) S.prefs.mute = S.prefs.mute.filter(x => x !== id);
  if (key === 'mute' && i < 0) S.prefs.follow = S.prefs.follow.filter(x => x !== id);
  persist('prefs');
  return i < 0;
}
function refreshToggles(act, id, on, labels){
  document.querySelectorAll(`[data-act="${act}"][data-id="${CSS.escape(id)}"]`).forEach(b => {
    b.setAttribute('aria-pressed', on);
    if (labels && b.classList.contains('tog')) b.textContent = on ? labels[0] : labels[1];
  });
}
function applyReaderSize(){ document.body.classList.remove('size-s', 'size-m', 'size-l'); document.body.classList.add('size-' + (S.prefs.size || 'm')); }

/* ---------- onboarding ---------- */
function maybeOnboard(){ if (S.onbShown || S.prefs.onboarded) return; S.onbShown = true; openOnb(0); }
function openOnb(step){ S.onbStep = step; $('#onb').hidden = false; document.body.classList.add('locked'); renderOnb(); $('#onb').scrollTop = 0; }
function closeOnb(){ $('#onb').hidden = true; if (!S.story && !S.flow) document.body.classList.remove('locked'); }
function renderOnb(){
  const p = S.prefs; const el = $('#onb'); let h = '';
  const outs = Object.values(S.outlets).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'it'));
  const steps = `<div class="steps">${[0, 1, 2].map(i => `<i class="${i <= S.onbStep ? 'on' : ''}"></i>`).join('')}</div>`;
  if (S.onbStep === 0) {
    const seenT = new Set(); const demo = visible(S.stories).filter(s => s.top).sort((a, b) => (b.rank || 0) - (a.rank || 0)).filter(s => !seenT.has(s.topic) && seenT.add(s.topic)).slice(0, 3);
    const tiles = demo.length === 3 ? demo : [{id:'a', topic:'scienza'}, {id:'b', topic:'mondo'}, {id:'c', topic:'salute'}];
    h = `<div class="wrap">${steps}<span class="step">Benvenuto in Eddy</span>
      <div class="collage" aria-hidden="true">${tiles.map((s, i) => `<div>${visual(s, i ? 'thumb' : 'tall')}${i === 0 && s.sources ? `<span class="vpill">${stack(s, 4)}<span>${outletsOf(s).length} testate</span></span>` : ''}</div>`).join('')}</div>
      <h2>Una notizia, tutte le voci che la raccontano.</h2>
      <p class="lede">Eddy riunisce in un'unica storia gli articoli di più testate sullo stesso fatto. In cima vedi chi la sta raccontando; sotto trovi riassunto, punti chiave e i titoli originali con il link a ogni articolo.</p>
      <span class="grow"></span>
      <div class="actions"><button class="btn" data-act="onb-next">Iniziamo</button></div></div>`;
  } else if (S.onbStep === 1) {
    h = `<div class="wrap">${steps}<span class="step">Passo 1 di 2 · Temi</span><h2>Cosa ti interessa?</h2><p class="lede">Scegline quanti vuoi. Decidono cosa sale in cima a «Per te».</p>
      <div class="ttiles">${TOPICS.map(topicTile).join('')}</div>
      <span class="grow"></span>
      <div class="actions"><button class="btn ghost" data-act="onb-back">Indietro</button><button class="btn" data-act="onb-next" id="onbNext" ${p.topics.length ? '' : 'disabled'}>${p.topics.length ? 'Avanti · ' + p.topics.length : 'Scegli almeno un tema'}</button></div></div>`;
  } else {
    h = `<div class="wrap">${steps}<span class="step">Passo 2 di 2 · Testate</span><h2>Quali testate segui?</h2><p class="lede">Tutte restano nel feed; quelle che segui pesano di più in «Per te». Puoi anche saltare.</p>
      <div class="pick">${outs.length ? outletGroups(outs, o => { const f = p.follow.includes(o.id); return `<div class="orow" data-act="follow" data-id="${esc(o.id)}">${mono(o.id, 'md')}<div class="oinfo"><strong>${esc(o.name)}</strong><span>${esc([o.kind, langLabel(o)].filter(Boolean).join(' · '))}</span></div><span class="tog" data-act="follow" data-id="${esc(o.id)}" aria-pressed="${f}">${f ? 'Segui già' : 'Segui'}</span></div>`; }) : '<p class="hint" style="padding:12px 0">L\'elenco delle testate si carica con il feed: potrai sceglierle in Esplora.</p>'}</div>
      <span class="grow"></span>
      <div class="actions"><button class="btn ghost" data-act="onb-back">Indietro</button><button class="btn" data-act="onb-done">Apri il mio feed</button></div></div>`;
  }
  el.innerHTML = h;
}
function updateCounters(){
  const n = S.prefs.topics.length;
  const b = $('#onbNext'); if (b) { b.disabled = !n; b.textContent = n ? 'Avanti · ' + n : 'Scegli almeno un tema'; }
  const c = $('#intCount'); if (c) c.textContent = 'Interessi · ' + n + (n === 1 ? ' scelto' : ' scelti');
}

/* ---------- audio ---------- */
const TTS = {queue:[], idx:0, playing:false, paused:false, voice:null, label:'', curId:null};
function hasTTS(){ return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined'; }
function pickVoice(){
  if (!hasTTS()) return null;
  const vs = speechSynthesis.getVoices() || [];
  return vs.find(v => /^it(-|_|$)/i.test(v.lang) && /google|enhanced|premium|natural/i.test(v.name)) || vs.find(v => /^it/i.test(v.lang)) || null;
}
function chunks(text){
  const out = []; const parts = String(text).replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]*\s*/g) || [text];
  let cur = '';
  for (const p of parts) { if ((cur + p).length > 220 && cur) { out.push(cur.trim()); cur = p; } else cur += p; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function storySpeech(s){
  const ids = outletsOf(s).map(id => outlet(id).name);
  const intro = ids.length ? `Raccontata da ${ids.slice(0, 3).join(', ')}${ids.length > 3 ? ' e altre ' + (ids.length - 3) + ' testate' : ''}.` : '';
  return [s.headline + '.', intro, s.summary || s.dek || '', (s.points || []).length ? 'Punti chiave. ' + s.points.join('. ') + '.' : ''].join(' ');
}
function play(items, label){
  if (!hasTTS() || !items.length) return;
  speechSynthesis.cancel();
  TTS.voice = pickVoice(); TTS.queue = [];
  items.forEach((s, n) => chunks((n === 0 && items.length > 1 ? 'Ecco la prima pagina di Eddy. ' : '') + storySpeech(s) + (n < items.length - 1 ? ' Prossima notizia.' : '')).forEach(c => TTS.queue.push({text:c, id:s.id, title:s.headline, s})));
  TTS.idx = 0; TTS.playing = true; TTS.paused = false; TTS.label = label; TTS.curId = null;
  $('#player').hidden = false; document.body.classList.add('player-on');
  speakCurrent();
}
function speakCurrent(){
  if (!TTS.playing) return;
  const it = TTS.queue[TTS.idx];
  if (!it) { stopTTS(); return; }
  $('#plLabel').textContent = TTS.label; $('#plTitle').textContent = it.title;
  if (TTS.curId !== it.id) { $('#plArt').innerHTML = visual(it.s, 'thumb'); TTS.curId = it.id; }
  $('#plToggle').innerHTML = ICON.pause; $('#plToggle').setAttribute('aria-label', 'Pausa');
  $('#plNext').hidden = !TTS.queue.some((x, i) => i > TTS.idx && x.id !== it.id);
  const u = new SpeechSynthesisUtterance(it.text);
  u.lang = 'it-IT'; if (TTS.voice) u.voice = TTS.voice; u.rate = S.prefs.rate || 1;
  const my = TTS.idx;
  u.onend = () => { if (TTS.playing && !TTS.paused && TTS.idx === my) { TTS.idx++; speakCurrent(); } };
  u.onerror = e => { if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; if (TTS.playing && !TTS.paused && TTS.idx === my) { TTS.idx++; speakCurrent(); } };
  speechSynthesis.speak(u);
}
function toggleTTS(){
  if (!TTS.playing) return;
  if (TTS.paused) { TTS.paused = false; speakCurrent(); }
  else { TTS.paused = true; speechSynthesis.cancel(); $('#plToggle').innerHTML = ICON.play; $('#plToggle').setAttribute('aria-label', 'Riprendi'); }
}
function nextTTS(){
  const cur = TTS.queue[TTS.idx]; if (!cur) return;
  let j = TTS.idx; while (j < TTS.queue.length && TTS.queue[j].id === cur.id) j++;
  TTS.idx = j; TTS.paused = false; speechSynthesis.cancel(); setTimeout(speakCurrent, 60);
}
function stopTTS(){
  TTS.playing = false; TTS.paused = false; TTS.queue = [];
  if (hasTTS()) speechSynthesis.cancel();
  $('#player').hidden = true; document.body.classList.remove('player-on');
}
if (hasTTS() && 'onvoiceschanged' in speechSynthesis) speechSynthesis.onvoiceschanged = () => { TTS.voice = pickVoice(); };

/* ---------- toast ---------- */
let toastT = 0;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 1800); }

/* ---------- navigazione ---------- */
function setTab(tab){
  if (!TABS.includes(tab)) tab = 'oggi';
  if (S.story) closeStory();
  if (S.flow) closeFlow();
  const same = S.tab === tab;
  if (same && tab === 'esplora') S.explore = null;
  S.tab = tab;
  if (tab !== 'esplora') S.explore = null;
  try { history.replaceState(null, '', '#' + tab); } catch (e) {}
  if (tab === 'profilo') { S.cleanConfirm = false; loadStorage(); }
  render(!same);
  window.scrollTo({top:0, behavior:same ? 'smooth' : 'auto'});
}
function readHash(){
  const h = (location.hash || '').replace('#', '');
  if (TABS.includes(h)) S.tab = h;
  else if (h.indexOf('s-') === 0) { S.tab = 'oggi'; S.pendingStory = h.slice(2); }
}
window.addEventListener('popstate', () => {
  const h = (location.hash || '').replace('#', '');
  if (S.story && h.indexOf('s-') !== 0) closeStory(true);
  else if (h.indexOf('s-') === 0 && h.slice(2) !== S.story) openStory(h.slice(2), {fromPop:true, keepCtx:true});
  if (S.flow && h !== 'sfoglia' && h.indexOf('s-') !== 0) closeFlow(true);
});

/* ---------- eventi ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  if (a === 'save') { e.stopPropagation(); toggleSave(id, el); return; }
  switch (a) {
    case 'tab': e.preventDefault(); closeOnb(); setTab(el.dataset.tab); break;
    case 'srcs': goSources(id); break;
    case 'flag-src': flagSource(el); break;
    case 'flag-sum': flagSummary(el); break;
    case 'xf': setXF(el.dataset.k, el.dataset.v); break;
    case 'xf-reset': S.xf = xfDefault(); render(); break;
    case 'alert-open': hideAlert(); openStory(id); break;
    case 'alert-x': hideAlert(); break;
    case 'alerts': S.prefs.alerts = el.dataset.v === '1'; persist('prefs'); render(); break;
    case 'unhide': HID = {}; SUMOFF = {}; LS.set('hid', HID); LS.set('sumoff', SUMOFF); toast('Correzioni locali annullate'); render(); break;
    case 'open': openStory(id); break;
    case 'open-next': openStory(id, {keepCtx:true}); break;
    case 'close': closeStory(); break;
    case 'zona': S.zona = id || null; render(); break;
    case 'roma-all': {
      S.topic = 'roma'; S.zona = null; render();
      const cb = $('.chipbar'); if (cb) window.scrollTo({top:cb.getBoundingClientRect().top + window.scrollY - (document.querySelector('.top').offsetHeight || 56), behavior:'smooth'});
      break;
    }
    case 'topic': {
      S.topic = el.dataset.topic; S.zona = null; render();
      const cb = $('.chipbar'); if (cb) { const y = cb.getBoundingClientRect().top + window.scrollY - (document.querySelector('.top').offsetHeight || 56); if (window.scrollY > y) window.scrollTo(0, y); }
      break;
    }
    case 'ofilter': S.outletF = id || null; S.topic = 'tutti'; render(); break;
    case 'flow': openFlow(el.dataset.src === 'perte' ? perTeList().map(s => s.id) : oggiLists().all.map(s => s.id), 0); break;
    case 'flow-close': closeFlow(); break;
    case 'brief': { const top = oggiLists().top; play((top.length ? top : visible(S.stories)).slice(0, 6), 'Prima pagina'); break; }
    case 'listen': { const s = getStory(id); if (s) play([s], 'In ascolto'); break; }
    case 'pl-toggle': toggleTTS(); break;
    case 'pl-next': nextTTS(); break;
    case 'pl-stop': stopTTS(); break;
    case 'go-search': if (S.story) closeStory(); if (S.flow) closeFlow(); S.tab = 'esplora'; S.explore = null; render(true); setTimeout(() => { const q = $('#q'); if (q) q.focus(); }, 30); break;
    case 'xtopic': S.explore = {kind:'topic', id}; render(true); window.scrollTo(0, 0); break;
    case 'xoutlet': S.explore = {kind:'outlet', id}; render(true); window.scrollTo(0, 0); break;
    case 'dossier': if (S.story) closeStory(); if (S.flow) closeFlow(); S.tab = 'esplora'; S.explore = {kind:'dossier', id}; render(true); window.scrollTo(0, 0); break;
    case 'xback': S.explore = null; render(true); break;
    case 'ttopic': {
      const on = togglePref('topics', id);
      refreshToggles('ttopic', id, on, S.explore && S.explore.kind === 'topic' ? ['Nei tuoi interessi', 'Aggiungi ai tuoi interessi'] : null);
      updateCounters();
      if (S.tab === 'perte' && $('#onb').hidden) scheduleRender();
      break;
    }
    case 'follow': {
      e.stopPropagation();
      const on = togglePref('follow', id);
      refreshToggles('follow', id, on, ['Segui già', 'Segui']);
      refreshToggles('mute', id, false, ['Silenziata', 'Silenzia']);
      if ($('#onb').hidden) scheduleRender();
      break;
    }
    case 'mute': { const on = togglePref('mute', id); refreshToggles('mute', id, on, ['Silenziata', 'Silenzia']); scheduleRender(); break; }
    case 'fdossier': { const on = togglePref('dossiers', id); refreshToggles('fdossier', id, on, ['Segui già', 'Segui il dossier']); scheduleRender(); break; }
    case 'seg': S.savedSeg = el.dataset.seg; render(); break;
    case 'clean-assets': cleanAssets(); break;
    case 'refresh': requestRefresh(); break;
    case 'refresh-cancel': cancelRefresh(); break;
    case 'refresh-hide': S.rfbHidden = Number(el.dataset.v) || 0; updateRefreshUI(); break;
    case 'refresh-see': {
      if (S.tab !== 'oggi' || S.topic !== 'tutti' || S.outletF) { S.topic = 'tutti'; S.outletF = null; if (S.tab !== 'oggi') setTab('oggi'); else render(); }
      const sec = $('#latest'); if (sec) window.scrollTo({top:sec.getBoundingClientRect().top + window.scrollY - (document.querySelector('.top').offsetHeight || 56) - 50, behavior:'smooth'});
      break;
    }
    case 'clear-history': S.history = []; persist('history', 0); render(); toast('Cronologia svuotata'); break;
    case 'size': S.prefs.size = el.dataset.v; applyReaderSize(); persist('prefs'); render(); break;
    case 'rate': S.prefs.rate = Number(el.dataset.v); persist('prefs'); render(); break;
    case 'copy': { const url = el.dataset.url; try { navigator.clipboard.writeText(url).then(() => toast('Link copiato'), () => toast(url)); } catch (err) { toast(url); } break; }
    case 'more': showMore(el.dataset.pkey); break;
    case 'share': {
      const st = getStory(id); if (!st) break;
      const url = location.href.split('#')[0] + '#s-' + id;
      if (window.EddyAndroid && EddyAndroid.share) EddyAndroid.share(st.headline + '\n' + url);
      else if (navigator.share) navigator.share({title:st.headline, text:st.dek || st.headline, url}).catch(() => {});
      break;
    }
    case 'export': exportData(); break;
    case 'install': doInstall(); break;
    case 'onb-open': openOnb(Number(el.dataset.step || 0)); break;
    case 'onb-next': if (el.disabled) break; S.onbStep++; renderOnb(); $('#onb').scrollTop = 0; break;
    case 'onb-back': S.onbStep = Math.max(0, S.onbStep - 1); renderOnb(); $('#onb').scrollTop = 0; break;
    case 'onb-done':
      S.prefs.onboarded = true; persist('prefs', 0); closeOnb();
      S.tab = S.prefs.topics.length || S.prefs.follow.length ? 'perte' : 'oggi'; render(true); window.scrollTo(0, 0); break;
  }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('article[data-act="open"]')) { e.preventDefault(); openStory(e.target.dataset.id); }
  if (e.key === 'Escape') { if (!$('#onb').hidden && S.prefs.onboarded) closeOnb(); else if (S.story) closeStory(); else if (S.flow) closeFlow(); }
  if (S.flow && !S.story && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); const tr = $('#ftrack'); tr.scrollBy({top:(e.key === 'ArrowDown' ? 1 : -1) * tr.clientHeight, behavior:'smooth'}); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { S.query = e.target.value; const r = $('#results'); if (r) { r.innerHTML = searchResults(); observeMore(); } }
});
$('#sheet').addEventListener('scroll', onSheetScroll, {passive:true});

/* ---------- dati: file statici pubblicati dalla redazione automatica ---------- */
const DL = {loading:false, last:0, feed:null, archive:[], archAt:''};
async function fetchJSON(url, bust){
  const u = url + (bust ? (url.includes('?') ? '&' : '?') + 't=' + Date.now() : '');
  const r = await fetch(u, {cache:bust ? 'no-store' : 'no-cache'});
  if (!r.ok) { const e = new Error('HTTP ' + r.status); e.code = 'http_' + r.status; throw e; }
  DL.offline = r.headers.get('X-Eddy-Offline') === '1';
  DL.stale = r.headers.get('X-Eddy-Stale') === '1';  // rete lenta: mostrata la copia salvata, intanto si aggiorna la cache
  return r.json();
}
function applyFeed(){
  const f = DL.feed; if (!f) return;
  S.outlets = Object.fromEntries(Object.entries(f.outlets || {}).map(([id, o]) => [id, Object.assign({}, o, {id})]));
  S.dossiers = Object.fromEntries(Object.entries(f.dossiers || {}).map(([id, d]) => [id, Object.assign({}, d, {id})]));
  S.meta = f.meta || null;
  const recent = f.stories || [];
  const have = new Set(recent.map(x => x.id));
  const all = recent.concat(DL.archive.filter(x => !have.has(x.id)));
  all.sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
  S.stories = all; S.byId = new Map(all.map(x => [x.id, x]));
  S.dbState = 'ok';
}
async function loadArchive(at){
  try { const a = await fetchJSON('data/archive.json?v=' + encodeURIComponent(at || '')); DL.archive = Array.isArray(a.stories) ? a.stories : []; DL.archAt = at; applyFeed(); scheduleRender(); } catch (e) {}
}
async function loadData(manual){
  if (DL.loading) return null;
  DL.loading = true;
  const before = new Map(S.stories.map(x => [x.id, x.changedAt || x.updatedAt]));
  try {
    const f = await fetchJSON('data/feed.json', manual);
    DL.feed = f; DL.last = Date.now();
    if (DL.stale) DL.last -= 4 * 60000;  // copia vecchia mostrata subito: tra circa un minuto si ricontrolla (la cache intanto si aggiorna)
    checkUpdate(!!manual);
    applyFeed();
    if (f.archive && f.archive.at !== DL.archAt) loadArchive(f.archive.at);
    let added = 0, updated = 0;
    if (before.size) S.stories.forEach(x => { const b = before.get(x.id); if (b === undefined) added++; else if (b !== (x.changedAt || x.updatedAt)) updated++; });
    if (before.size) checkAlerts(before);
    if (S.pendingStory) { const p = S.pendingStory; S.pendingStory = null; if (S.byId.has(p)) setTimeout(() => openStory(p, {fromPop:true}), 0); }
    scheduleRender();
    if (!$('#onb').hidden && S.onbStep === 2) renderOnb();
    if (DL.offline) { DL.last = 0; return {ok:false, offline:true, added, updated}; }
    return {ok:true, added, updated};
  } catch (e) {
    if (!S.stories.length) { S.dbState = navigator.onLine === false ? 'offline' : 'error'; S.dbErr = e && (e.code || e.message); scheduleRender(); }
    return {ok:false, err:e};
  } finally { DL.loading = false; }
}
function markSeen(){ LS.set('seen', Date.now()); }
const BUILD = '__EDDY_BUILD__';
let updBusy = false;
async function checkUpdate(force){
  // version.json cambia a ogni pubblicazione: se non è la versione in esecuzione, ricarica (mai durante la lettura)
  if (updBusy || BUILD.indexOf('__') === 0 || location.protocol === 'file:') return false;
  updBusy = true;
  try {
    const r = await fetch('version.json?t=' + Date.now(), {cache:'no-store'});
    const v = r.ok ? await r.json() : null;
    if (!v || !v.b || v.b === BUILD) return false;
    const last = LS.get('upd') || {};
    if (last.b === v.b && Date.now() - (last.t || 0) < 10 * 60000) return false;
    if (!force && (S.story || S.flow)) return false;
    LS.set('upd', {b:v.b, t:Date.now()});
    try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch (e) {}
    location.replace(location.pathname + '?v=' + encodeURIComponent(v.b) + location.hash);
    return true;
  } catch (e) { return false; } finally { updBusy = false; }
}
window.EDDY_BUILD = BUILD; window.eddyCheckUpdate = checkUpdate;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { markSeen(); return; }
  const v = LS.get('seen'); if (v && Date.now() - v > 5 * 60000) { S.lastSeen = v; scheduleRender(); }
  if (Date.now() - DL.last > 2 * 60000) loadData(false);
});
window.addEventListener('pagehide', markSeen);
window.addEventListener('online', () => { if (Date.now() - DL.last > 60000) loadData(false); });
setInterval(() => { if (!document.hidden && Date.now() - DL.last > 5 * 60000) loadData(false); if (refreshInfo().k !== 'idle') { lastRfKey = ''; updateRefreshUI(); } }, 30000);

/* ---------- installazione, copia di sicurezza, nome ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (S.tab === 'profilo') scheduleRender(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('Eddy è installata'); if (S.tab === 'profilo') scheduleRender(); });
function standalone(){ return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true || /EddyAndroid/.test(navigator.userAgent); }
function installBlock(){
  if (standalone()) return '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), android = /android/i.test(navigator.userAgent);
  const apk = S.meta && S.meta.apk;
  let h = '<div class="pgroup"><h3>Installa Eddy</h3><div class="pbox">';
  if (deferredInstall) h += '<p style="margin:0">Aggiungi Eddy alla schermata Home: si apre a tutto schermo come un\'app e funziona anche senza rete.</p><button class="btn full" style="margin-top:12px" data-act="install">Installa l\'app</button>';
  else if (ios) h += '<p style="margin:0">In Safari tocca <b>Condividi</b> e poi <b>Aggiungi a Home</b>: Eddy si apre a tutto schermo come un\'app.</p>';
  else h += '<p style="margin:0">Dal menu del browser scegli <b>Installa app</b> o <b>Aggiungi a schermata Home</b>.</p>';
  if (apk && !ios) h += `<p style="margin:12px 0 0">${android ? 'Oppure' : 'Per Android'} scarica l'app vera e propria: <a href="${esc(apk)}" download>eddy.apk</a>. All'installazione Android chiede di consentire le app da questa fonte.</p>`;
  return h + '</div></div>';
}
async function doInstall(){ if (!deferredInstall) return; deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) {} deferredInstall = null; scheduleRender(); }
function exportData(){
  const data = {app:'eddy', v:1, at:new Date().toISOString(), prefs:S.prefs, saved:S.saved, history:S.history};
  const fname = 'eddy-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  if (window.EddyAndroid && EddyAndroid.saveFile) { EddyAndroid.saveFile(fname, JSON.stringify(data)); return; }
  const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fname;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Copia esportata');
}
document.addEventListener('change', async e => {
  if (e.target.id === 'importFile' && e.target.files && e.target.files[0]) {
    try {
      const d = JSON.parse(await e.target.files[0].text());
      if (!d || d.app !== 'eddy') throw new Error('formato');
      if (d.prefs) { S.prefs = Object.assign(defaultPrefs(), d.prefs); ['topics', 'follow', 'mute', 'dossiers'].forEach(k => { if (!Array.isArray(S.prefs[k])) S.prefs[k] = []; }); }
      if (d.saved && typeof d.saved === 'object') S.saved = Object.assign({}, S.saved, d.saved);
      if (Array.isArray(d.history)) S.history = d.history.slice(0, 80);
      ['prefs', 'saved', 'history'].forEach(n => persist(n, 0));
      S.firstName = S.prefs.name || ''; applyReaderSize(); render(); toast('Copia importata');
    } catch (err) { toast('File non valido'); }
    e.target.value = '';
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'nameInput') { S.prefs.name = e.target.value.trim().slice(0, 40); S.firstName = S.prefs.name.split(/\s+/)[0] || ''; persist('prefs', 600); }
});

/* ---------- trascina verso il basso per aggiornare ---------- */
(function(){
  const ind = document.createElement('div');
  ind.className = 'ptr'; ind.setAttribute('aria-hidden', 'true'); ind.innerHTML = ICON.refresh;
  document.body.appendChild(ind);
  let y0 = null, x0 = 0, d = 0, pulling = false;
  const blocked = () => !!S.story || !!S.flow || !$('#onb').hidden || document.body.classList.contains('locked');
  const set = v => { d = v; ind.style.opacity = Math.min(1, v / 55).toFixed(2); ind.style.transform = `translate(-50%, ${v.toFixed(0)}px) rotate(${(v * 3).toFixed(0)}deg)`; ind.classList.toggle('ready', v >= 64); };
  const reset = () => { pulling = false; d = 0; ind.style.opacity = ''; ind.style.transform = ''; ind.classList.remove('ready'); };
  document.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || blocked() || window.scrollY > 2 || ind.classList.contains('spin')) { y0 = null; return; }
    y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; pulling = false;
  }, {passive:true});
  document.addEventListener('touchmove', e => {
    if (y0 === null) return;
    const dy = e.touches[0].clientY - y0, dx = Math.abs(e.touches[0].clientX - x0);
    if (!pulling && (dy < 10 || dx > dy || window.scrollY > 2)) { if (dy < 0 || dx > dy) y0 = null; return; }
    pulling = true;
    set(Math.min(110, dy * 0.5));
  }, {passive:true});
  const end = () => {
    if (y0 === null) return;
    const go = pulling && d >= 64;
    y0 = null; reset();
    if (go) {
      ind.classList.add('spin');
      Promise.resolve(requestRefresh()).finally(() => ind.classList.remove('spin'));
    }
  };
  document.addEventListener('touchend', end, {passive:true});
  document.addEventListener('touchcancel', () => { y0 = null; reset(); }, {passive:true});
})();

/* testata: vetro solo quando la pagina scorre */
(function(){
  const top = document.querySelector('.top'); if (!top) return;
  let on = null;
  const f = () => { const v = window.scrollY > 4; if (v !== on) { on = v; top.classList.toggle('scrolled', v); } };
  window.addEventListener('scroll', f, {passive:true}); f();
})();

/* ---------- avvio ---------- */
function registerSW(){
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js', {updateViaCache:'none'}).catch(() => {});
}
async function init(){
  if (/[?&]v=/.test(location.search)) try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  S.lastSeen = LS.get('seen') || Date.now();
  const p = LS.get('prefs'); if (p) { S.prefs = Object.assign(defaultPrefs(), p); delete S.prefs._rev; }
  ['topics', 'follow', 'mute', 'dossiers'].forEach(k => { if (!Array.isArray(S.prefs[k])) S.prefs[k] = []; });
  const sv = LS.get('saved'); if (sv && sv.items) S.saved = sv.items;
  const hi = LS.get('history'); if (hi && Array.isArray(hi.items)) S.history = hi.items;
  S.firstName = (S.prefs.name || '').split(/\s+/)[0] || '';
  S.rfReady = 3; S.canEdit = true; S.prefsReady = true;
  applyReaderSize();
  readHash();
  render();
  maybeOnboard();
  await loadData(false);
  registerSW();
}
init();
})();
