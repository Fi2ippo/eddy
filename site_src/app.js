(function(){
'use strict';

/* ---------- costanti ---------- */
// Colori dei temi "Famiglie Solare": c = tono pieno (righe, cartelle, quadratini, barre), tx = tono scritta (testo colorato).
// Il testo bianco non va mai sul tono pieno: le etichette piene usano tx come fondo.
const TOPICS = [
  {id:'cronaca',     name:'Cronaca',            long:'Cronaca',              c:'#D0021B', tx:'#D0021B', fam:'Attualità'},
  {id:'italia',      name:'Politica',           long:'Politica italiana',    c:'#C2185B', tx:'#C2185B', fam:'Attualità'},
  {id:'salute',      name:'Salute',             long:'Salute e medicina',    c:'#F06B8B', tx:'#E31748', fam:'Attualità'},
  {id:'mondo',       name:'Mondo',              long:'Esteri e geopolitica', c:'#3D5FC4', tx:'#3D5FC4', fam:'Luoghi'},
  {id:'napoli',      name:'Napoli e provincia', long:'Napoli e provincia',   c:'#3FB0F0', tx:'#0E79B6', fam:'Luoghi'},
  {id:'economia',    name:'Economia',           long:'Economia e lavoro',    c:'#2BAE66', tx:'#21854E', fam:'Sapere'},
  {id:'scienza',     name:'Scienza',            long:'Scienza e scoperte',   c:'#17B3B0', tx:'#11817F', fam:'Sapere'},
  {id:'clima',       name:'Clima',              long:'Clima e ambiente',     c:'#A3C736', tx:'#657B21', fam:'Sapere'},
  {id:'tech',        name:'Tecnologia',         long:'Tecnologia e IA',      c:'#1E8A96', tx:'#1B7E89', fam:'Sapere'},
  {id:'cultura',     name:'Cultura',            long:'Cultura e società',    c:'#C25400', tx:'#C25400', fam:'Cultura'},
  {id:'design',      name:'Design',             long:'Design, grafica e UX', c:'#F2B32B', tx:'#996C09', fam:'Cultura'},
  {id:'arte',        name:'Arte e fotografia',  long:'Arte e fotografia',    c:'#F08A4B', tx:'#C05310', fam:'Cultura'},
  {id:'architettura',name:'Architettura',       long:'Architettura e città', c:'#C4A57A', tx:'#8F6D3F', fam:'Cultura'},
  {id:'spettacoli',  name:'Spettacoli',         long:'Spettacoli e costume', c:'#D25BB4', tx:'#C837A4', fam:'Tempo libero'},
  {id:'sport',       name:'Sport',              long:'Sport',                c:'#8E6CF0', tx:'#7C55EE', fam:'Tempo libero'},
  {id:'motori',      name:'Motori',             long:'Motori e nautica',     c:'#5E6272', tx:'#5E6272', fam:'Tempo libero'}
];
const TMAP = Object.fromEntries(TOPICS.map(t => [t.id, t]));
const TICON = {
  napoli:'<path d="M2.5 20h19"/><path d="M3.5 20l5.2-8.6c.7-1.1 1.6-1.4 2.3-.6l.9 1 1-1.2c.6-.7 1.5-.6 2.1.3L20.5 20"/><path d="M11.2 8.2c.2-1.6 1.4-2.7 2.8-2.7M13.6 4.2c.9-.8 2.2-1 3.4-.5"/>',
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
  spettacoli:'<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3.5 9L6 4h12.5L21 9"/><path d="M9 4.2L7.5 9M14.5 4.2L13 9"/>',
  design:'<path d="M12 3l6 7-6 11-6-11z"/><circle cx="12" cy="11.5" r="1.8"/><path d="M12 13.3V21M4 5.5l3 1.5M20 5.5L17 7"/>',
  architettura:'<path d="M3.5 21h17M5.5 21V9.5L12 4l6.5 5.5V21"/><path d="M9 21v-5h6v5M9 11h.01M12 11h.01M15 11h.01"/>',
  arte:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 16l5-5 4 4 3-3 5 5"/><circle cx="15.5" cy="9" r="1.6"/>'
};
const PALETTE = ['#1F4E79','#8B2E2E','#2E6B4F','#6B3FA0','#9A5B13','#0F6A7A','#A33E6B','#3D4A5C','#5C6B1F','#7A2E5C','#24527A','#8A4B2A'];
const TABS = ['oggi','perte','sfoglia','salvati','profilo'];
const ICON = {
  ext:'<svg class="i" viewBox="0 0 24 24"><path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/></svg>',
  refresh:'<svg class="i" viewBox="0 0 24 24"><path d="M19.5 12a7.5 7.5 0 0 1-12.9 5.2M4.5 12a7.5 7.5 0 0 1 12.9-5.2"/><path d="M17.8 3.4v3.6h-3.6M6.2 20.6V17h3.6"/></svg>'
};
const LANGN = {it:'italiano', en:'inglese', fr:'francese', de:'tedesco', es:'spagnolo', pt:'portoghese', nl:'olandese'};
const ZONES = [['citta', 'Napoli'], ['flegrea', 'Area flegrea'], ['vesuviana', 'Area vesuviana'], ['nord', 'Area nord e nolana'], ['isole', 'Isole e penisola']];
const ZMAP = Object.fromEntries(ZONES);

/* ---------- utilità ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
const TZ = 'Europe/Rome';
const fmtHM = new Intl.DateTimeFormat('it-IT', {hour:'numeric', minute:'2-digit', timeZone:TZ});
const fmtWD = new Intl.DateTimeFormat('it-IT', {weekday:'short', day:'numeric', month:'long', timeZone:TZ});
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
/* la luce che cambia con l'ora: saluto, sfondo della pagina e colore del nome (5–12, 12–18, 18–5) */
function hourNow(){ return Number(new Intl.DateTimeFormat('it-IT', {hour:'numeric', hourCycle:'h23', timeZone:TZ}).format(new Date())) % 24; }
function light(){ const h = hourNow(); return h >= 5 && h < 12 ? 'mattino' : h >= 12 && h < 18 ? 'pomeriggio' : 'sera'; }
function greeting(){ const l = light(); return l === 'mattino' ? 'Buongiorno' : l === 'pomeriggio' ? 'Buon pomeriggio' : 'Buonasera'; }
function applyLight(){ const l = light(); if (document.documentElement.dataset.light !== l) document.documentElement.dataset.light = l; }
function dayLabel(){ return cap(fmtWD.format(new Date()).replace(/\.(?=\s)/, '')); }
const LOGO = '<span class="logo" role="img" aria-label="Eddy"><svg viewBox="0 0 70 50" aria-hidden="true"><rect x="0" y="0" width="50" height="12" rx="6" fill="#D0021B"/><rect x="10" y="19" width="50" height="12" rx="6" fill="#3D5FC4"/><rect x="20" y="38" width="50" height="12" rx="6" fill="#C25400"/></svg><span aria-hidden="true">eddy</span></span>';
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
function hasPlace(s){ return s && s.place && typeof s.place.lat === 'number' && typeof s.place.lon === 'number'; }
function fallbackVisual(s, kind){ return hasPlace(s) ? mapSvg(s.place, kind) : art(s, kind); }
// Ogni foto porta il credito della testata (sulle miniature è nel testo accanto e nel titolo dell'immagine).
function visual(s, kind, credit = true){
  if (hasImg(s)) {
    const who = s.img.o ? outlet(s.img.o).name : '';
    const cr = credit && kind !== 'thumb' && who ? `<span class="pcred">Foto: ${esc(who)}</span>` : '';
    return `<span class="vis k-${kind}"><img class="ph" src="${esc(imgUrl(s.img, kind))}" alt="" title="${who ? 'Foto: ' + esc(who) : ''}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-sid="${esc(s.id)}" data-kind="${kind}">${cr}</span>`;
  }
  return fallbackVisual(s, kind);
}
document.addEventListener('error', e => {
  const t = e.target;
  if (!t || t.tagName !== 'IMG' || !t.classList.contains('ph')) return;
  const s = getStory(t.dataset.sid) || {id:t.dataset.sid, topic:'mondo'};
  const holder = t.parentNode;
  t.remove();
  if (holder) holder.querySelectorAll('.pcred').forEach(c => c.remove());
  if (holder) holder.insertAdjacentHTML('beforeend', fallbackVisual(Object.assign({}, s, {img:null}), t.dataset.kind || 'thumb'));
}, true);

/* ---------- stato ---------- */
const defaultPrefs = () => ({topics:[], follow:[], mute:[], dossiers:[], onboarded:false, size:'m', rate:1});
const S = {
  dbState:'pending', dbErr:null, db:null, uid:null, sample:null, firstName:'',
  stories:[], byId:new Map(), outlets:{}, dossiers:{}, meta:null,
  prefs:defaultPrefs(), prefsReady:false,
  saved:{}, history:[],
  tab:'oggi', savedSeg:'salvati',
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
function langOf(x){ return (x && x.l) || outlet(x && x.o).lang || 'it'; }
function hasTopic(s, t){ return s.topic === t || (t !== 'napoli' && Array.isArray(s.alt) && s.alt.includes(t)); }
/* traduzioni dei titoli esteri: dalla redazione (campo ti) o, per le storie più vecchie, tradotte qui e tenute in cache */
const TR = new Map(Object.entries(LS.get('tr') || {}));
function trKey(t){ return hash(t).toString(36) + String(t).length; }
function titleIt(x){
  if (langOf(x) === 'it') return null;
  return x.ti || TR.get(trKey(x.t)) || null;
}
function srcOf(s){ const hid = HID[s.id] && HID[s.id].u; return (s.sources || []).filter(x => x && x.o && !(hid && hid.includes(x.u))); }
function outletsOf(s){ const seen = new Set(), ids = []; for (const x of srcOf(s)) if (!seen.has(x.o)) { seen.add(x.o); ids.push(x.o); } return ids; }
function visible(list){ return list.filter(s => outletsOf(s).length > 0); }

/* ---------- ordinamenti ---------- */
function score(s){ return (s.rank || 40) - hoursAgo(s.updatedAt) * 1.6 + Math.min(outletsOf(s).length, 6) * 3; }
function personalScore(s){
  const p = S.prefs; let sc = score(s);
  if (p.topics.some(t => hasTopic(s, t))) sc += p.topics.includes(s.topic) ? 28 : 20;
  return sc;
}
function matchesMe(s){
  const p = S.prefs;
  return p.topics.some(t => hasTopic(s, t));
}
// prima pagina (le storie dell'edizione) e ultime notizie; Napoli e provincia ha la sua sezione
function oggiLists(){
  const list = visible(S.stories).filter(s => s.topic !== 'napoli' || s.top);
  const top = list.filter(s => s.top).sort((a, b) => (b.rank || 0) - (a.rank || 0)).slice(0, 9);
  const topIds = new Set(top.map(s => s.id));
  const rest = list.filter(s => !topIds.has(s.id)).sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
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
/* ---------- render ---------- */
let raf = 0, collecting = false, CTX = [];
function scheduleRender(){ if (raf) return; raf = requestAnimationFrame(() => { raf = 0; render(); }); }
function pushCtx(id){ if (collecting && !CTX.includes(id)) CTX.push(id); }

function render(animate){
  applyLight();
  document.querySelectorAll('.tabs button').forEach(b => { if (b.dataset.tab === S.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  document.body.classList.toggle('sf-on', S.tab === 'sfoglia');
  renderEdPill();
  const v = $('#view');
  collecting = true; CTX = [];
  let html = '';
  if (S.tab === 'oggi') html = viewOggi();
  else if (S.tab === 'perte') html = viewPerTe();
  else if (S.tab === 'sfoglia') html = viewSfoglia();
  else if (S.tab === 'salvati') html = viewSalvati();
  else html = viewProfilo();
  collecting = false; S.ctx = CTX;
  v.innerHTML = html;
  const sfv = $('#sfv'); if (sfv && S.sfIdx) sfv.scrollTop = S.sfIdx * sfv.clientHeight;
  if (animate) { v.classList.remove('fade'); void v.offsetWidth; v.classList.add('fade'); }
  layoutDeck();
  if (S.story && !$('#sheet').hidden) renderSheet(true);
  observeMore();
}
function renderEdPill(){
  updateRefreshUI();
  const t = $('#edPillTxt');
  if (t && S.meta && S.meta.runAt) t.textContent = 'Aggiornato ' + whenText(freshAt()) + (staleMin() > lateLimit() ? ' · in ritardo' : '');
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
function isSaved(id){ return !!S.saved[id]; }
const PAGE = 30;
const PAGED = {};
S.pages = {};
const PAGEDF = {};
function paged(key, list, fn, cls){
  PAGED[key] = list; PAGEDF[key] = fn || nrow;
  const n = Math.min(list.length, Math.max(PAGE, S.pages[key] || 0));
  const rest = list.length - n;
  return `<div class="${cls || 'nlist'}" data-pkey="${esc(key)}">${list.slice(0, n).map(x => PAGEDF[key](x)).join('')}</div>${rest > 0 ? moreBtn(key, rest) : ''}`;
}
function moreBtn(key, rest){ return `<button class="more" data-act="more" data-pkey="${esc(key)}">Mostra altre ${rest} ${rest === 1 ? 'storia' : 'storie'}</button>`; }
function showMore(key){
  const list = PAGED[key]; if (!list) return;
  const feed = document.querySelector(`[data-pkey="${CSS.escape(key)}"]:not(.more)`); if (!feed) return;
  const n0 = feed.children.length, n1 = Math.min(list.length, n0 + PAGE);
  if (n1 <= n0) return;
  S.pages[key] = n1;
  const was = collecting; collecting = true; CTX = S.ctx || [];
  feed.insertAdjacentHTML('beforeend', list.slice(n0, n1).map(x => (PAGEDF[key] || nrow)(x)).join(''));
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
  const sub = shownU.length ? `${shownU.length} ${shownU.length === 1 ? 'dettaglio compare' : 'dettagli compaiono'} solo in alcune testate` : common.length ? `In comune nei titoli: ${common.slice(0, 3).map(([st]) => surf.get(st)).join(', ')}` : 'Come le testate impostano il titolo';
  return {sub, n:N, html:`
    ${common.length ? `<div class="cmpg"><small>In comune nei titoli</small><div class="cmpc">${common.map(([st, c]) => `<span>${esc(surf.get(st))}<em>${c}/${N}</em></span>`).join('')}</div></div>` : ''}
    ${shownU.length ? `<div class="cmpg"><small>Solo in alcune testate</small><ul class="cmpu">${shownU.map(e => `<li><span class="cw">${esc(e.d.s)}</span><span class="co">${[...e.os.entries()].map(([o, x]) => `<a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(outlet(o).name)}</a>`).join(', ')}</span></li>`).join('')}</ul></div>` : ''}
    ${frame.length ? `<div class="cmpg"><small>Come impostano il titolo</small>${frame.map(f => `<p>${f}</p>`).join('')}</div>` : ''}
    <p class="note">Confronto automatico dei titoli di ${N} testate: mostra cosa ripetono quasi tutti e cosa compare solo in alcune, non stabilisce chi ha ragione.</p>`};
}

/* cronologia: gli articoli delle testate dal più recente; in vista gli ultimi 3, poi "Tutta la cronologia · N" */
function crTime(v){ const t = ts(v); if (!t) return ''; const d = new Date(t); return fmtKey.format(d) === fmtKey.format(new Date()) ? fmtHM.format(d) : fmtKey.format(d) === fmtKey.format(new Date(Date.now() - 86400000)) ? 'ieri ' + fmtHM.format(d) : fmtDMHM.format(d); }
function cronoBlock(srcs, all){
  const seen = new Set();
  const ev = srcs.slice().sort((a, b) => ts(b.d) - ts(a.d)).filter(x => { const k = x.o + '|' + norm(titleIt(x) || x.t); if (seen.has(k)) return false; seen.add(k); return true; });
  if (!ev.length) return '';
  const shown = all ? ev : ev.slice(0, 3);
  return `<p class="lab">Cronologia · ultimi aggiornamenti</p><div class="box crono">${shown.map(x => `<a class="cr2" href="${esc(x.u)}" target="_blank" rel="noopener"><span><time>${esc(crTime(x.d))}</time><br>${esc(outlet(x.o).name)}</span><span class="crt">${esc(titleIt(x) || x.t)}${langOf(x) !== 'it' && titleIt(x) ? ' <em>· tradotto</em>' : ''}</span></a>`).join('')}
    ${ev.length > 3 ? `<button class="fo" data-act="crono-all" aria-expanded="${!!all}">${all ? 'Solo gli ultimi aggiornamenti' : 'Tutta la cronologia · ' + ev.length}<span>${CHEV}</span></button>` : ''}</div>`;
}

/* sintesi: ogni passaggio con la sua fonte, le citazioni in evidenza */
const OBYNAME = {ref:null, m:{}};
function outletByName(n){
  if (OBYNAME.ref !== S.outlets) { OBYNAME.ref = S.outlets; OBYNAME.m = {}; Object.values(S.outlets).forEach(o => { OBYNAME.m[norm(o.name)] = o; }); }
  return OBYNAME.m[norm(n)] || null;
}
function fmtPara(p){
  let t = String(p), cite = '';
  const m = t.match(/\s\(([^()]{2,80})\)\s*$/); if (m) { cite = m[1]; t = t.slice(0, m.index); }
  const o = cite ? outletByName(cite) : null;
  const tr = o && o.lang && o.lang !== 'it';
  return `<p class="p">${esc(t.trim())}${cite ? `<small>${esc(cite)}${tr ? ' · tradotto' : ''}</small>` : ''}</p>`;
}
function fmtPoint(p){ const m = String(p).match(/^([^:]{2,40}):\s+([\s\S]*)$/); return m ? `${esc(m[2])}<small>${esc(m[1])}</small>` : esc(p); }

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

/* ----- Oggi ----- */
const REFRESH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';
const PAPER_S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4.5h11.5A1.5 1.5 0 0 1 20 6v12.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V9.5H7"/><path d="M7 4.5v14a2 2 0 0 1-2 2"/><path d="M10.5 8h6v3.6h-6zM10.5 14.6h6M10.5 17.4h4"/></svg>';
function tcol(s){ return TMAP[s.topic] || {name:s.topic || '', c:'#9A9DA5', tx:'#6B6E76'}; }
// etichetta del tema; per Napoli e provincia la zona (Napoli, Area flegrea, Isole e penisola…)
function kickName(s){ const t = tcol(s); return s.topic === 'napoli' ? (ZMAP[s.zona] || 'Napoli') : t.name; }
function covText(n){ return n + ' ' + (n === 1 ? 'testata' : 'testate'); }
// "Il Mattino +10 · 4 h fa"
function whoLine(s){ const ids = outletsOf(s); const tr = srcOf(s).length && srcOf(s).every(x => langOf(x) !== 'it'); return (ids.length ? esc(outlet(ids[0]).name) + (ids.length > 1 ? ' +' + (ids.length - 1) : '') + ' · ' : '') + esc(ago(s.updatedAt)) + (tr ? ' · Tradotto' : ''); }
// riga di un elenco: tema (o zona), titolo, testate, miniatura
function nrow(s, opts){
  opts = opts || {};
  pushCtx(s.id);
  const t = tcol(s), n = outletsOf(s).length;
  return `<article class="nrow" data-act="open" data-id="${esc(s.id)}" tabindex="0" aria-label="${esc(s.headline)}">
    <div class="ntx">${opts.why ? `<span class="nwhy">${esc(opts.why)}</span>` : opts.kick === false ? '' : `<span class="kick" style="color:${t.tx}">${esc(kickName(s))}</span>`}<h3>${esc(s.headline)}</h3>
    <div class="rm"><b>${PAPER_S}${covText(n)}</b>${opts.meta || `<span>${whoLine(s)}</span>`}</div></div>
    <div class="th">${visual(s, 'thumb')}</div></article>`;
}
function leadOf(s){ return s.dek || String(s.summary || '').split(/\n{2,}/)[0].replace(/\s\(([^()]{2,80})\)\s*$/, '') || ''; }
function deckCard(s, i){
  pushCtx(s.id);
  const t = tcol(s), n = outletsOf(s).length, lead = leadOf(s);
  return `<article class="dk" data-i="${i}" data-act="open" data-id="${esc(s.id)}" style="--tg:${t.c};--tgt:${t.tx}" aria-label="${esc(s.headline)}">
    <div class="ph">${visual(s, 'wide')}</div>
    <div class="cin"><span class="tag">${esc(kickName(s))}</span><h3>${esc(s.headline)}</h3>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
      <div class="meta"><span class="cov">${PAPER_S}${covText(n)}</span><span>${esc(ago(s.updatedAt))}</span></div></div>
  </article>`;
}
function viewOggi(){
  const m = S.meta;
  const vis = visible(S.stories);
  const nOut = new Set(); vis.forEach(s => outletsOf(s).forEach(o => nOut.add(o)));
  const sub = m && m.runAt ? `Notizie raccolte ${whenText(freshAt())} · ${vis.length} storie da ${nOut.size} testate` : '';
  const late = !!(m && m.runAt && staleMin() > lateLimit());
  let h = `<header class="ohead">${LOGO}<h1 class="greet">${greeting()}${S.firstName ? `, <em>${esc(S.firstName)}</em>` : ''}</h1>
    <span class="osub" title="${esc(sub)}">${esc(dayLabel())}${m && m.runAt ? ` · <b id="edPillTxt">Aggiornato ${esc(whenText(freshAt()))}${late ? ' · in ritardo' : ''}</b>` : ''}<button class="rb" id="refreshBtn" data-act="refresh" aria-label="Aggiorna le notizie">${REFRESH_SVG}</button></span></header>`;
  const st = feedState(true);
  if (st) return h + st;
  const {top, rest} = oggiLists();
  if (top.length) {
    S.deckIdx = Math.min(S.deckIdx || 0, top.length - 1);
    h += `<div class="sec deck-sec"><h2 id="ppT">Prima pagina</h2><span id="deckN">${S.deckIdx + 1} di ${top.length}</span></div>
      <div class="deck${deckHint() ? ' hinting' : ''}" id="deck" tabindex="0" role="region" aria-roledescription="mazzo di carte" aria-labelledby="ppT" aria-describedby="deckHelp">${top.map(deckCard).join('')}</div>
      <p class="sr" id="deckHelp">Trascina la carta a sinistra per la prossima notizia, a destra per tornare indietro; con la tastiera usa le frecce. Invio apre la notizia.</p>
      ${deckHint() ? `<div class="hintp" id="deckHintP">${ARROW_L} Trascina per la prossima</div>` : `<div class="pg" id="dots" aria-hidden="true">${top.map((_, i) => `<i class="${i === S.deckIdx ? 'on' : ''}"></i>`).join('')}</div>`}`;
  }
  const nap = vis.filter(s => hasTopic(s, 'napoli')).sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt));
  if (nap.length) {
    h += `<div class="sec"><h2>Napoli e provincia</h2>${nap.length > 3 ? `<button class="lnk" data-act="napoli-all" aria-expanded="${!!S.napAll}">${S.napAll ? 'Meno' : 'Tutte'}</button>` : ''}</div>`;
    h += S.napAll ? paged('oggi|napoli', nap, nrow, 'nlist') : `<div class="nlist">${nap.slice(0, 3).map(s => nrow(s)).join('')}</div>`;
  }
  h += `<div class="sec" id="latest"><h2>Ultime notizie</h2><span>${rest.length} ${rest.length === 1 ? 'storia' : 'storie'}</span></div>`;
  if (!rest.length && !top.length) return h + `<div class="state"><h3>Niente qui, per ora</h3><p>L'edizione corrente non ha ancora storie. La redazione automatica aggiorna le notizie ogni quarto d'ora; il pulsante in alto scarica subito l'ultima raccolta.</p></div>`;
  return h + paged('oggi|ultime', rest, nrow, 'nlist');
}

/* prima pagina a mazzo di carte: si trascina a sinistra per la prossima, a destra per tornare indietro */
let deckSuppress = 0;
function layoutDeck(){
  const deck = $('#deck'); if (!deck) return;
  const cards = deck.querySelectorAll('.dk'), idx = S.deckIdx || 0;
  cards.forEach((c, j) => {
    const d = j - idx;
    c.className = 'dk ' + (d < 0 ? 'out' : d === 0 ? 'c0' : d === 1 ? 'b1' : d === 2 ? 'b2' : 'bx');
    c.style.transform = ''; c.style.transition = '';
    c.tabIndex = d === 0 ? 0 : -1;
    if (d === 0) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true');
  });
  const n = $('#deckN'); if (n) n.textContent = (idx + 1) + ' di ' + cards.length;
  document.querySelectorAll('#dots i').forEach((d, j) => d.classList.toggle('on', j === idx));
}
function deckGo(step){
  const deck = $('#deck'); if (!deck) return false;
  const n = deck.querySelectorAll('.dk').length, to = (S.deckIdx || 0) + step;
  if (to < 0 || to >= n) { layoutDeck(); return false; }
  S.deckIdx = to; layoutDeck(); deckHintDone(); return true;
}
(function(){
  let x0 = 0, y0 = 0, dx = 0, drag = false, card = null, pid = null;
  document.addEventListener('pointerdown', e => {
    const deck = e.target.closest && e.target.closest('#deck'); if (!deck || e.button > 0) return;
    card = deck.querySelector('.dk.c0'); if (!card) return;
    deck.classList.remove('hinting');
    x0 = e.clientX; y0 = e.clientY; dx = 0; drag = false; pid = e.pointerId;
  });
  document.addEventListener('pointermove', e => {
    if (!card || e.pointerId !== pid) return;
    const mx = e.clientX - x0, my = e.clientY - y0;
    if (!drag) { if (Math.abs(mx) < 8 || Math.abs(mx) < Math.abs(my)) { if (Math.abs(my) > 12) card = null; return; } drag = true; try { card.setPointerCapture(pid); } catch (err) {} card.style.transition = 'none'; }
    dx = mx;
    const atEnd = (dx < 0 && !card.nextElementSibling) || (dx > 0 && (S.deckIdx || 0) === 0);
    const v = atEnd ? dx * .25 : dx;
    card.style.transform = `translateX(${v.toFixed(1)}px) rotate(${(v * .03).toFixed(2)}deg)`;
  });
  const end = e => {
    if (!card || (e && e.pointerId !== pid)) return;
    const was = drag; const c = card; card = null;
    if (!was) return;
    deckSuppress = Date.now() + 350;
    c.style.transition = '';
    if (dx < -70 && deckGo(1)) return;
    if (dx > 70 && deckGo(-1)) return;
    c.style.transform = '';
  };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
  document.addEventListener('keydown', e => {
    if (!e.target.closest || !e.target.closest('#deck')) return;
    if (e.key === 'Enter' && e.target.id === 'deck') { e.preventDefault(); const c = $('#deck .dk.c0'); if (c) openStory(c.dataset.id); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault(); deckGo(e.key === 'ArrowRight' ? 1 : -1);
      const c = $('#deck .dk.c0'); if (c && e.target !== $('#deck')) c.focus();
    }
  });
})();

/* ----- aggiornamento: la redazione automatica gira ogni 15 minuti, il pulsante scarica subito ----- */
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
function updateRefreshUI(){
  const i = refreshInfo();
  const b = $('#refreshBtn');
  if (b) {
    b.classList.toggle('spin', i.k === 'running');
    b.classList.remove('queued');
    b.setAttribute('aria-label', i.k === 'running' ? 'Aggiornamento in corso' : 'Aggiorna le notizie');
  }
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

/* ----- Per te: il filo delle storie che segui e le storie collegate ----- */
// "Letta alle 9:40", "Salvata ieri", "Letta il 6 nov"
function whenDid(verb, v){
  const t = ts(v); if (!t) return verb;
  const d = new Date(t);
  if (fmtKey.format(d) === fmtKey.format(new Date())) return verb + ' alle ' + fmtHM.format(d);
  if (fmtKey.format(d) === fmtKey.format(new Date(Date.now() - 86400000))) return verb + ' ieri';
  return verb + ' il ' + fmtDM.format(d);
}
// le storie che hai letto o salvato, con l'ora in cui le hai viste l'ultima volta
function followed(){
  const m = new Map();
  S.history.forEach(x => { if (x && x.id && !m.has(x.id)) m.set(x.id, {id:x.id, readAt:ts(x.at), savedAt:0}); });
  Object.entries(S.saved).forEach(([id, v]) => { const e = m.get(id) || {id, readAt:0, savedAt:0}; e.savedAt = ts(v && v.at); m.set(id, e); });
  return [...m.values()].map(e => Object.assign(e, {since:Math.max(e.readAt, e.savedAt), verb:e.readAt >= e.savedAt ? 'Letta' : 'Salvata'}));
}
// gli articoli arrivati dopo che hai aperto (o salvato) la storia, dal più recente
function newsSince(s, since){
  const seen = new Set();
  return srcOf(s).filter(x => ts(x.d) > since + 60000).sort((a, b) => ts(b.d) - ts(a.d))
    .filter(x => { const k = x.o + '|' + norm(titleIt(x) || x.t); if (seen.has(k)) return false; seen.add(k); return true; });
}
function filoList(){
  return followed().map(e => { const s = S.byId.get(e.id); if (!s || !outletsOf(s).length) return null; const ev = newsSince(s, e.since); return ev.length ? {s, e, ev} : null; })
    .filter(Boolean).sort((a, b) => ts(b.ev[0].d) - ts(a.ev[0].d));
}
function filoCard(f){
  pushCtx(f.s.id);
  const t = tcol(f.s), at = f.e.verb === 'Letta' ? f.e.readAt : f.e.savedAt;
  return `<article class="fc" data-act="open" data-id="${esc(f.s.id)}" tabindex="0" style="--tg:${t.c};--tgt:${t.tx}" aria-label="${esc(f.s.headline)}: ${f.ev.length} ${f.ev.length === 1 ? 'novità' : 'novità'}">
    <div class="fh"><span class="k">${esc(kickName(f.s))}</span><span class="w">${esc(whenDid(f.e.verb, new Date(at).toISOString()))}</span></div>
    <h3>${esc(f.s.headline)}</h3>
    <div class="fl">${f.ev.slice(0, 3).map(x => `<div class="ev"><span class="h">${esc(crTime(x.d))} · ${esc(outlet(x.o).name)}</span><p>${esc(titleIt(x) || x.t)}${langOf(x) !== 'it' && titleIt(x) ? ' <em>· tradotto</em>' : ''}</p></div>`).join('')}${f.ev.length > 3 ? `<div class="ev evm"><span class="h">${f.ev.length === 4 ? 'e un altro aggiornamento' : 'e altri ' + (f.ev.length - 3) + ' aggiornamenti'}</span></div>` : ''}</div>
  </article>`;
}
// storie collegate a quelle lette: stesso dossier, oppure nomi e luoghi in comune
function tagSet(x){ return new Set((x.tags || []).map(norm).filter(w => w.length > 2)); }
function shortTitle(h){ let t = String(h || '').split(/[:,.;]\s/)[0]; if (t.length > 42) t = t.slice(0, 40).replace(/\s+\S*$/, '') + '…'; return t; }
function relatedList(){
  const known = new Set(S.history.map(x => x && x.id).concat(Object.keys(S.saved)));
  const base = S.history.slice(0, 12).map(x => S.byId.get(x.id) || (x.s && Object.assign({id:x.id}, x.s))).filter(Boolean);
  const out = new Map();
  base.forEach((r, ri) => {
    const rt = tagSet(r);
    visible(S.stories).forEach(c => {
      if (known.has(c.id) || c.id === r.id) return;
      let sc = 0, why = '';
      if (r.dossier && c.dossier === r.dossier) { sc = 3; why = (S.dossiers[r.dossier] || {}).title || ''; }
      else { const ct = tagSet(c); let n = 0; rt.forEach(w => { if (ct.has(w)) n++; }); if (n >= 2) sc = 2; else if (n === 1 && c.topic === r.topic) sc = 1; }
      if (!sc) return;
      sc = sc * 10 - ri - hoursAgo(c.updatedAt) / 24;
      const prev = out.get(c.id);
      if (!prev || prev.sc < sc) out.set(c.id, {s:c, sc, why:'Perché hai letto «' + (why || shortTitle(r.headline)) + '»'});
    });
  });
  return [...out.values()].sort((a, b) => b.sc - a.sc).slice(0, 6);
}
function viewPerTe(){
  const st = feedState(false);
  const filo = st ? [] : filoList();
  const rel = st ? [] : relatedList();
  const nNew = filo.reduce((n, f) => n + f.ev.length, 0);
  let h = `<header class="phead"><h1>Per te</h1><span class="psub">${filo.length ? `Le storie che segui · <b>${nNew} ${nNew === 1 ? 'novità' : 'novità'}</b>` : 'Le storie che segui e cosa è cambiato'}</span></header>`;
  if (st) return h + st;
  if (filo.length) h += `<div class="sec"><h2>Si sono mosse</h2><span>${filo.length} ${filo.length === 1 ? 'storia' : 'storie'}</span></div>${filo.map(filoCard).join('')}`;
  if (rel.length) h += `<div class="sec"><h2>Collegate</h2><span>${rel.length} ${rel.length === 1 ? 'storia' : 'storie'}</span></div><div class="nlist">${rel.map(r => nrow(r.s, {why:r.why})).join('')}</div>`;
  if (!filo.length && !rel.length) h += `<div class="empty"><span class="eico">${NAVI.perte}</span><h3>Qui Eddy segue le storie per te</h3><p>Apri o salva una notizia: quando ne arrivano di nuove, o ne escono altre collegate, le trovi qui con un riassunto di cosa è cambiato.</p></div>`;
  if (filo.length + rel.length < 3) {
    const seen = new Set(filo.map(f => f.s.id).concat(rel.map(r => r.s.id)));
    // a turno dai temi scelti, perché si vedano tutti
    const byT = S.prefs.topics.map(t => perTeList().filter(x => !seen.has(x.id) && hasTopic(x, t)));
    const mine = [];
    for (let i = 0; mine.length < 5 && byT.some(l => l.length > i); i++) byT.forEach(l => { const x = l[i]; if (x && mine.length < 5 && !mine.includes(x)) mine.push(x); });
    const list = (mine.length ? mine : visible(S.stories).filter(x => x.top)).slice(0, 5);
    if (list.length) h += `<div class="sec"><h2>${S.prefs.topics.length ? 'Per cominciare, dai tuoi temi' : 'Per cominciare, dalla prima pagina'}</h2></div><div class="nlist">${list.map(x => nrow(x)).join('')}</div>`;
  }
  return h;
}
const NAVI = {perte:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/></svg>'};
/* ----- Salvati: cartelle per tema e Recenti ----- */
// "Salvata ieri", "Aperta alle 9:40", "Aperta 4 giorni fa"
function relDay(verb, v){
  const t = ts(v); if (!t) return verb;
  const d = new Date(t), k = fmtKey.format(d);
  if (k === fmtKey.format(new Date())) return verb + ' alle ' + fmtHM.format(d);
  if (k === fmtKey.format(new Date(Date.now() - 86400000))) return verb + ' ieri';
  const n = Math.round((Date.now() - t) / 86400000);
  return n < 7 ? `${verb} ${n} giorni fa` : verb + ' il ' + fmtDM.format(d);
}
function folderName(id){ return id === 'napoli' ? 'Napoli' : (TMAP[id] || {name:id}).name; }
function savedItems(){ return Object.entries(S.saved).sort((a, b) => ts(b[1].at) - ts(a[1].at)).map(([id, v]) => ({id, at:v.at, s:getStory(id)})).filter(x => x.s); }
function folderCard(id, items){
  const all = id === 'tutte', t = all ? {c:'#111216', tx:'#111216'} : TMAP[id] || {c:'#9A9DA5', tx:'#6B6E76'};
  const n = items.length, name = all ? 'Tutte' : folderName(id);
  const k = all ? 4 : Math.min(4, n);
  const tiles = n ? items.slice(0, all ? 4 : k).map(x => `<i>${visual(x.s, 'thumb')}</i>`).join('') + (all ? '<i></i>'.repeat(Math.max(0, 4 - n)) : '') : '<i></i><i></i><i></i><i></i>';
  const cls = all ? 'm4' : !n ? 'm4' : 'm' + k;
  return `<button class="fd${all ? ' all' : ''}${n ? '' : ' void'}" data-act="folder" data-id="${id}" style="--tg:${t.c};--tgt:${t.tx}" aria-label="${esc(name)}: ${n ? n + (n === 1 ? ' storia' : ' storie') : 'vuota'}">
    <span class="mo ${cls}" aria-hidden="true">${tiles}</span><span class="fi"><b>${esc(name)}</b><span>${n || 'vuota'}</span></span></button>`;
}
function viewSalvati(){
  const items = savedItems();
  if (S.folder) return viewFolder(items);
  const seg = S.savedSeg === 'cronologia' ? 'recenti' : S.savedSeg || 'salvati';
  let h = `<header class="phead"><h1>Salvati</h1><span class="psub">${seg === 'recenti' ? 'Le storie che hai aperto di recente' : `${items.length} ${items.length === 1 ? 'storia' : 'storie'} · restano su questo telefono`}</span></header>`;
  h += `<div class="stabs" role="tablist" aria-label="Salvati e recenti"><button role="tab" data-act="seg" data-seg="salvati" aria-selected="${seg === 'salvati'}">Salvati</button><button role="tab" data-act="seg" data-seg="recenti" aria-selected="${seg === 'recenti'}">Recenti</button></div>`;
  if (seg === 'salvati') {
    if (!items.length) return h + `<div class="empty"><span class="eico">${SBI.save}</span><h3>Nessuna storia salvata</h3><p>Tocca il segnalibro in cima a una storia per ritrovarla qui, divisa per tema, anche dopo che è uscita dall'archivio.</p></div>`;
    const topics = S.prefs.topics.length ? S.prefs.topics.filter(id => TMAP[id]) : [...new Set(items.map(x => x.s.topic))].filter(id => TMAP[id]);
    h += `<div class="fg">${folderCard('tutte', items)}${topics.map(id => folderCard(id, items.filter(x => x.s.topic === id))).join('')}</div>`;
    return h + `<p class="fnote">Le cartelle sono i tuoi temi. Le storie di altri temi stanno in «Tutte».</p>`;
  }
  const seen = new Set();
  const hist = S.history.filter(x => x && x.id && !seen.has(x.id) && seen.add(x.id)).map(x => ({x, s:getStory(x.id) || (x.s && Object.assign({id:x.id}, x.s))})).filter(y => y.s && y.s.headline);
  if (!hist.length) return h + `<div class="empty"><span class="eico">${NAVI.perte}</span><h3>Nessuna lettura</h3><p>Le storie che apri compaiono qui, divise per giorno, con le novità arrivate dopo.</p></div>`;
  const today = fmtKey.format(new Date()), yest = fmtKey.format(new Date(Date.now() - 86400000));
  const groups = [['Oggi', []], ['Ieri', []], ['Questa settimana', []], ['Prima', []]];
  hist.forEach(y => { const t = ts(y.x.at), k = fmtKey.format(new Date(t)); (k === today ? groups[0] : k === yest ? groups[1] : Date.now() - t < 7 * 86400000 ? groups[2] : groups[3])[1].push(y); });
  groups.forEach(([label, list]) => {
    if (!list.length) return;
    h += `<p class="day">${label}</p><div class="nlist">${list.map(y => { const live = S.byId.get(y.s.id); const nn = live ? newsSince(live, ts(y.x.at)).length : 0; return nrow(y.s, {meta:`<span>${esc(relDay('Aperta', y.x.at))}</span>${nn ? `<span class="nv">${nn} ${nn === 1 ? 'novità' : 'novità'}</span>` : ''}`}); }).join('')}</div>`;
  });
  return h + `<button class="more" data-act="clear-history">Svuota i recenti</button>`;
}
function viewFolder(items){
  const id = S.folder, all = id === 'tutte', t = all ? {c:'#111216', tx:'#111216'} : TMAP[id] || {c:'#9A9DA5', tx:'#6B6E76'};
  const list = all ? items : items.filter(x => x.s.topic === id);
  let h = `<button class="bk" data-act="folder" data-id="">${SBI.back}Salvati</button>
    <header class="phead fhead"><h1 style="color:${t.tx}">${esc(all ? 'Tutte' : folderName(id))}</h1><span class="psub">${list.length} ${list.length === 1 ? 'storia salvata' : 'storie salvate'}</span></header>`;
  if (!list.length) return h + `<div class="empty"><span class="eico">${SBI.save}</span><h3>Cartella vuota</h3><p>Le storie di questo tema che salvi compaiono qui.</p></div>`;
  return h + `<div class="nlist ftop" style="--tg:${t.c}">${list.map(x => nrow(x.s, {kick:all, meta:`<span>${esc(relDay('Salvata', x.at))}</span>`})).join('')}</div>`;
}

/* ----- Profilo ----- */
const CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const PEN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
// pulsante di un tema da scegliere (primo avvio e Profilo): quadratino o riga del colore pieno, spunta quando è scelto
// scelta dei temi (primo avvio e Profilo): pillole divise per famiglia; scelte si accendono del colore pieno del tema
const FAMS = ['Attualità', 'Luoghi', 'Sapere', 'Cultura', 'Tempo libero'];
const PICK_ORDER = ['italia', 'cronaca', 'salute', 'napoli', 'mondo', 'economia', 'scienza', 'tech', 'clima', 'cultura', 'design', 'architettura', 'arte', 'sport', 'motori', 'spettacoli'];
function lum(hex){ return hexRgb(hex).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0); }
function contrast(a, b){ const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
// testo sul colore pieno: bianco o inchiostro, quello che si legge meglio
function onColor(c){ return contrast(c, '#FFFFFF') > contrast(c, '#111216') ? '#FFFFFF' : '#111216'; }
function tIcon(id){ return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TICON[id] || ''}</svg>`; }
function topicPill(t){
  const on = S.prefs.topics.includes(t.id);
  return `<button class="tpl" data-act="ttopic" data-id="${t.id}" aria-pressed="${on}" style="--c:${t.c};--tx:${t.tx};--on:${onColor(t.c)}">${tIcon(t.id)}${esc(t.name)}</button>`;
}
function topicFamilies(prefix){
  const order = PICK_ORDER.map(id => TMAP[id]).filter(Boolean).concat(TOPICS.filter(t => !PICK_ORDER.includes(t.id)));
  return `<div class="fams">${FAMS.map((f, i) => {
    const list = order.filter(t => t.fam === f); if (!list.length) return '';
    const lid = prefix + 'Fam' + i;
    return `<p class="fml" id="${lid}">${esc(f)}</p><div class="tpls" role="group" aria-labelledby="${lid}">${list.map(topicPill).join('')}</div>`;
  }).join('')}</div>`;
}
const SIZES = [['s', 'Piccola'], ['m', 'Media'], ['l', 'Grande']];
// i temi più letti: dalle storie aperte (cronologia delle letture)
function topRead(){
  const seen = new Set(), cnt = {}; let n = 0;
  S.history.forEach(x => {
    if (!x || !x.id || seen.has(x.id)) return; seen.add(x.id);
    const st = S.byId.get(x.id) || x.s || {}; const t = st.topic; if (!TMAP[t]) return;
    cnt[t] = (cnt[t] || 0) + 1; n++;
  });
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, c]) => ({t:TMAP[id], pct:Math.round(c * 100 / n)}));
  return {n, top};
}
function viewProfilo(){
  const p = S.prefs, tr = topRead();
  let h = `<header class="phead who">${S.editName ? `<label class="sr" for="nameInput">Il tuo nome</label><input id="nameInput" class="nameinp" value="${esc(p.name || '')}" placeholder="Il tuo nome" autocomplete="given-name" maxlength="40" enterkeyhint="done">`
    : `<span class="nm"><h1${p.name ? '' : ' class="noname"'}>${esc(p.name || 'Il tuo nome')}</h1><button class="pen" data-act="edit-name" aria-label="Cambia nome">${PEN}</button></span>`}</header>`;
  h += `<section class="card2" aria-labelledby="trT"><div class="ch2"><b id="trT">I tuoi temi più letti</b>${tr.n ? `<span>${tr.n} ${tr.n === 1 ? 'storia' : 'storie'}</span>` : ''}</div>`;
  h += tr.top.length ? `<div class="three">${tr.top.map(x => `<div style="--c:${x.t.c};--ct:${x.t.tx}"><b>${x.pct}%</b><span>${esc(folderName(x.t.id))}</span></div>`).join('')}</div>`
    : `<p class="hint0">Apri qualche storia: qui vedrai i temi che leggi di più. Il conto si fa solo su questo telefono.</p>`;
  h += `</section>`;
  const mine = TOPICS.filter(t => p.topics.includes(t.id));
  h += `<div class="grp"><p class="gl">Le tue scelte</p><div class="bx">
    <button class="it" data-act="panel" data-v="temi"><b>I tuoi temi</b><span class="r">${mine.length ? `<span class="tdots" aria-label="${mine.length} temi scelti">${mine.map(t => `<i style="background:${t.c}"></i>`).join('')}</span>` : 'Nessuno'}${CHEV}</span></button>
    <button class="it" data-act="panel" data-v="testo"><b>Dimensione del testo</b><span class="r">${(SIZES.find(x => x[0] === p.size) || SIZES[1])[1]}${CHEV}</span></button>
  </div></div>
  <div class="plain"><button class="it" data-act="panel" data-v="edizione"><b>Come funziona l’edizione</b>${CHEV}</button><button class="it" data-act="panel" data-v="privacy"><b>Privacy</b>${CHEV}</button></div>
  <button class="again" data-act="onb-open" data-step="0">Rivedi l’introduzione</button>
  <button class="del" data-act="wipe">Cancella i dati di Eddy</button>
  <p class="made">Eddy · fatto da Fi2ippo</p>`;
  return h;
}

/* pannello che sale dal basso (temi, dimensione del testo, edizione, privacy) */
let panelBack = null;
function openPanel(kind){ S.panel = kind; panelBack = document.activeElement; renderPanel(); const el = $('#panel'); el.hidden = false; document.body.classList.add('locked'); const f = el.querySelector('.psheet button, .psheet a'); if (f) f.focus(); }
function closePanel(){ if (!S.panel) return; S.panel = null; const el = $('#panel'); el.hidden = true; el.innerHTML = ''; if (!S.story) document.body.classList.remove('locked'); render(); if (panelBack && panelBack.isConnected) panelBack.focus(); else { const b = document.querySelector(`[data-act="panel"]`); if (b) b.focus(); } }
function renderPanel(){
  const k = S.panel, p = S.prefs, m = S.meta || {};
  let title = '', body = '';
  if (k === 'temi') {
    title = 'I tuoi temi';
    body = `<p class="plede">Tocca i temi: si accendono del loro colore. Decidono le cartelle di Salvati e cosa trovi in Per te; Oggi mostra sempre tutto.</p>${topicFamilies('pan')}`;
  } else if (k === 'testo') {
    title = 'Dimensione del testo';
    body = `<p class="plede">Vale per il testo delle storie.</p><div class="opts" role="radiogroup" aria-label="Dimensione del testo">${SIZES.map(([v, l]) => `<button role="radio" class="opt" data-act="size" data-v="${v}" aria-checked="${p.size === v}"><span style="font-size:${v === 's' ? 15.5 : v === 'm' ? 17 : 19}px">${l}</span><span class="ck">${p.size === v ? CHECK : ''}</span></button>`).join('')}</div>`;
  } else if (k === 'edizione') {
    title = 'Come funziona l’edizione';
    const ok = (m.outletsOk || []).length;
    body = `<div class="prose">
      <p>Più volte all'ora un programma automatico, che gira gratis su GitHub, legge i feed pubblici di circa ${Object.keys(S.outlets).length || 145} testate italiane, di Napoli e provincia, estere e di design, architettura e arte. Quando più giornali raccontano lo stesso fatto li riunisce in un'unica storia, con le testate in cima.</p>
      <p>Alle 7 e alle 19 sceglie la <b>prima pagina</b>: le storie riprese da più testate, una sola per fatto. Le altre arrivano in Ultime notizie man mano che escono.</p>
      <p>Non c'è scrittura automatica: «In breve», punti chiave e frasi sono <b>frasi delle testate</b>, sempre con il nome di chi le ha scritte e il link all'originale. I titoli esteri sono tradotti da modelli di traduzione aperti e segnalati come «tradotto».</p>
      <p>Le foto restano sui siti di chi le ha pubblicate: Eddy le mostra da lì, con il credito «Foto: testata». Per chiedere la rimozione di un contenuto c'è il <a href="https://github.com/Fi2ippo/eddy/issues/new?template=rimozione.yml" target="_blank" rel="noopener">modulo su GitHub</a>.</p>
    </div>
    <dl class="kv">
      <dt>Ultima edizione</dt><dd>${m.runAt ? esc(fmtDMHM.format(new Date(m.runAt)) + (m.label ? ' · ' + m.label.toLowerCase() : '')) : '—'}</dd>
      <dt>Ultima raccolta</dt><dd>${freshAt() ? esc(fmtDMHM.format(new Date(freshAt())) + (staleMin() > lateLimit() ? ' · in ritardo' : '')) : '—'}</dd>
      <dt>Prossimo giro</dt><dd>${m.nextAt ? esc(etaText(ts(m.nextAt))) : '—'}</dd>
      <dt>Archivio</dt><dd>${S.stories.length} storie degli ultimi 7 giorni</dd>
      ${ok ? `<dt>Testate lette</dt><dd>${ok} nell'ultima raccolta</dd>` : ''}
    </dl>
    <button class="btnp" data-act="refresh">Aggiorna adesso</button>`;
  } else if (k === 'privacy') {
    title = 'Privacy';
    const nh = Object.keys(HID).length + Object.keys(SUMOFF).length;
    body = `<div class="prose">
      <p>Eddy non ha account e non raccoglie dati su di te. Nome, temi, salvati e storie lette restano <b>solo in questo browser</b>: nessuno li riceve.</p>
      <p>Le foto si caricano direttamente dai siti delle testate, che come ogni sito vedono la richiesta del tuo browser. I link portano agli articoli originali.</p>
      <p>Per spostare le tue scelte su un altro telefono puoi esportarle in un file e importarlo là.</p>
    </div>
    <div class="row2"><button class="btn2" data-act="export">Esporta</button><label class="btn2" for="importFile">Importa</label><input id="importFile" type="file" accept="application/json,.json" hidden></div>
    ${nh ? `<p class="plede">${nh} ${nh === 1 ? 'correzione attiva' : 'correzioni attive'} su questo telefono (articoli tolti da una storia o sintesi nascoste dopo una tua segnalazione).</p><button class="btn2" data-act="unhide">Ripristina tutto</button>` : ''}`;
  }
  $('#panel').innerHTML = `<div class="scrim" data-act="panel-close"></div><div class="psheet" role="dialog" aria-modal="true" aria-labelledby="panelT"><span class="grab" aria-hidden="true"></span><h2 id="panelT">${esc(title)}</h2><div class="pbody">${body}</div><button class="done" data-act="panel-close">Fatto</button></div>`;
}
function wipeData(el){
  if (!armed(el, 'Tocca ancora: cancella tutto')) return;
  try { Object.keys(localStorage).filter(k => k.indexOf('eddy:') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) {}
  location.replace(location.pathname + '#oggi'); location.reload();
}

/* ---------- lettore ---------- */
function getStory(id){ return S.byId.get(id) || (S.saved[id] && S.saved[id].s && Object.assign({id}, S.saved[id].s)) || null; }
function openStory(id, opts){
  opts = opts || {};
  const s = getStory(id); if (!s) return;
  if (opts.ctx) S.storyCtx = opts.ctx.slice();
  else if (!opts.keepCtx) S.storyCtx = S.ctx.slice();
  const wasOpen = !!S.story;
  if (S.story !== id) { S.openCh = new Set(); S.cronoAll = false; }
  S.story = id;
  addHistory(s);
  const sh = $('#sheet');
  sh.hidden = false;
  if (!wasOpen) { sh.classList.remove('enter'); void sh.offsetWidth; sh.classList.add('enter'); }
  document.body.classList.add('locked');
  renderSheet(false);
  sh.scrollTop = 0;
  if (!wasOpen) S.storyBack = document.activeElement;
  const cb = sh.querySelector('[data-act="close"]'); if (cb) cb.focus({preventScroll:true});
  if (!opts.fromPop) { try { if (wasOpen && history.state && history.state.story) history.replaceState({story:id}, '', '#s-' + id); else history.pushState({story:id}, '', '#s-' + id); } catch (e) {} }
}
function closeStory(fromPop){
  if (!S.story) return;
  S.story = null;
  $('#sheet').hidden = true; $('#sheet').innerHTML = '';
  if (S.storyBack && S.storyBack.isConnected) S.storyBack.focus({preventScroll:true}); S.storyBack = null;
  document.body.classList.remove('locked');
  if (!fromPop) { try { if (history.state && history.state.story) history.back(); else history.replaceState(null, '', '#' + S.tab); } catch (e) {} }
}
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
const SBI = {
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
  save:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 21l-6-4-6 4V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>'
};
S.openCh = new Set();
function chapter(key, title, sub, body){
  return `<details class="chd" data-ch="${key}"${S.openCh.has(key) ? ' open' : ''}><summary class="ch"><span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${CHEV}</summary><div class="chb">${body}</div></details>`;
}
function renderSheet(keepScroll){
  const s = getStory(S.story); const sh = $('#sheet');
  if (!s) { closeStory(); return; }
  const st = keepScroll ? sh.scrollTop : 0;
  const srcs = srcOf(s).slice().sort((a, b) => ts(a.d) - ts(b.d));
  const ids = outletsOf(s);
  const t = tcol(s);
  const paras = String(s.summary || '').split(/\n{2,}/).filter(Boolean);
  const sumOff = !!(s.sumOff || SUMOFF[s.id]);
  const saved = isSaved(s.id);
  const names = ids.slice(0, 3).map(id => `<b>${esc(outlet(id).name)}</b>`).join(', ');
  const more = ids.length - Math.min(3, ids.length);
  let brief = '';
  if (sumOff) brief = '<p class="s-off">La sintesi automatica di questa storia è stata ritirata dopo una segnalazione: restano i titoli originali delle testate.</p>';
  else if (paras.length) brief = paras.map(fmtPara).join('');
  else if (s.dek) brief = `<p class="p">${esc(s.dek)}</p>`;
  else {
    const seen = new Set(); brief = srcs.slice().reverse().filter(x => !seen.has(x.o) && seen.add(x.o)).slice(0, 2).map(x => `<p class="p">${esc(titleIt(x) || x.t)}<small>${esc(outlet(x.o).name)}${langOf(x) !== 'it' && titleIt(x) ? ' · tradotto' : ''}</small></p>`).join('');
  }
  const cmp = compareBlock(srcs);
  const pts = !sumOff ? (s.points || []) : [];
  const first = srcs[0], last = srcs[srcs.length - 1];
  let chapters = '';
  if (pts.length) chapters += chapter('punti', 'Punti chiave', pts.length + ' · ' + String(pts[0]).replace(/^[^:]{2,40}:\s+/, ''), `<ul class="pts" style="--tg:${t.c}">${pts.map(p => `<li class="pt"><span>${fmtPoint(p)}</span></li>`).join('')}</ul>`);
  if (cmp) chapters += chapter('confronto', 'Confronto tra le testate', cmp.sub, cmp.html);
  if (srcs.length) chapters += chapter('fonti', 'Le fonti', ids.length > 1 ? `${covText(ids.length)}, da ${outlet(first.o).name} a ${outlet(last.o).name}` : `${outlet(first.o).name}`,
    `${agencyLine(srcs)}<div class="vos" id="srcList">${srcs.slice().reverse().map(x => srow(x, ids.length > 1)).join('')}</div>${!sumOff && paras.length ? `<button class="flagsum" data-act="flag-sum" data-id="${esc(s.id)}">La sintesi non rappresenta le fonti? Segnalalo</button>` : ''}`);
  sh.innerHTML = `<div class="sbar" id="sbar" style="--tg:${t.c}">
    <button class="ib" data-act="close" aria-label="Indietro">${SBI.back}</button><span class="grow"></span>
    <button class="ib savebtn" data-act="save" data-id="${esc(s.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Rimuovi dai salvati' : 'Salva'}">${SBI.save}</button>
    <button class="ib" data-act="share" data-id="${esc(s.id)}" aria-label="Condividi">${SBI.share}</button>
  </div>
  <article class="story">
    <div class="swrap"><span class="k" style="color:${t.tx}">${esc(kickName(s))}</span><h1 class="tt">${esc(s.headline)}</h1>
    <p class="by">${ids.length ? `Raccontata da ${names}${more > 0 ? ` e ${more === 1 ? 'un\'altra' : 'altre ' + more}` : ''} · ` : ''}aggiornata ${esc(ago(s.updatedAt))}</p></div>
    <div class="sph">${visual(s, 'wide')}</div>
    <div class="swrap">
      ${brief ? `<p class="lab">In breve</p>${brief}` : ''}
      ${cronoBlock(srcs, S.cronoAll)}
      ${chapters ? `<p class="lab">Approfondisci</p><div class="box chs">${chapters}</div>` : ''}
    </div>
  </article>`;
  sh.scrollTop = st;
}
function cleanAuthor(a, o){
  let t = String(a || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t || /redazione|staff|agenzi|newsroom|editor|reporters?$/i.test(t) || norm(t) === norm(o.name)) return '';
  return t.replace(/^(di|by|par|por|von)\s+/i, '');
}
function initials(o){ const w = String(o.short || o.name || '?').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/); return (o.short ? o.short : w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).slice(0, 3).toUpperCase(); }
function srow(x, canFlag){
  const o = outlet(x.o), l = langOf(x), ti = titleIt(x);
  const foreign = l !== 'it';
  return `<div class="vo"><span class="bo" aria-hidden="true">${esc(initials(o))}</span><div><b>${esc(o.name)}<time>${esc(crTime(x.d))}</time></b>
    <p${foreign && !ti ? ` lang="${esc(l)}"` : ''}>${esc(ti || x.t)}</p>
    ${foreign && ti ? `<p class="orig"><span>Originale in ${esc(LANGN[l] || l)} · traduzione automatica</span><q lang="${esc(l)}">${esc(x.t)}</q></p>` : ''}
    ${cleanAuthor(x.a, o) ? `<small class="aut">di ${esc(cleanAuthor(x.a, o))}</small>` : ''}<div class="sact"><a href="${esc(x.u)}" target="_blank" rel="noopener">Leggi su ${esc(o.name)} ${ICON.ext}</a>${canFlag ? `<button class="flag" data-act="flag-src" data-u="${esc(x.u)}">Non c'entra?</button>` : ''}</div></div></div>`;
}
const QSTOP = new Set('il lo la i gli le un uno una di a da in con su per tra fra e o ma che chi cosa come dove quando perche perché quale quali quanto quanti quante è e sono era stato sta stanno ha hanno ho del dello della dei degli delle al allo alla ai agli alle dal dalla dai nel nella nei sul sulla sui si ci ne non piu più mi ti me te lui lei loro questo questa questi queste quello quella sapere dimmi spiega spiegami cosa è successo succede oggi notizia storia'.split(' '));
/* ---------- sfoglia: una notizia per schermata ---------- */
function sfogliaList(){ return oggiLists().all; }
// una frase di una testata: il primo passaggio della sintesi (che porta il nome) o, in mancanza, il titolo di un'altra testata
function phraseOf(s){
  const p = String(s.summary || '').split(/\n{2,}/).find(x => /\s\(([^()]{2,80})\)\s*$/.test(x));
  if (p && !(s.sumOff || SUMOFF[s.id])) { const m = p.match(/\s\(([^()]{2,80})\)\s*$/); return {t:p.slice(0, m.index).trim(), o:m[1]}; }
  const hl = norm(s.headline);
  const x = srcOf(s).slice().sort((a, b) => ts(b.d) - ts(a.d)).find(y => norm(titleIt(y) || y.t) !== hl);
  return x ? {t:titleIt(x) || x.t, o:outlet(x.o).name, tr:langOf(x) !== 'it' && !!titleIt(x)} : null;
}
const SF_STEP = 25;
function sfSlide(s){
  pushCtx(s.id);
  const t = tcol(s), n = outletsOf(s).length, ph = phraseOf(s);
  const q = ph ? String(ph.t).replace(/^[«"“]+|[»"”]+$/g, '') : '';
  return `<article class="sf" data-act="open" data-id="${esc(s.id)}" tabindex="0" style="--tg:${t.c}" aria-label="${esc(s.headline)}">
    <div class="sfph">${visual(s, 'wide')}</div>
    <div class="sftx"><p class="m2"><span style="color:${t.tx}">${esc(kickName(s))}</span> · ${covText(n)} · ${esc(ago(s.updatedAt))}</p>
      <h2>${esc(s.headline)}</h2>
      ${q ? `<p class="q"><span class="qt">«${esc(q)}»</span><span class="qo">${esc(ph.o)}${ph.tr ? ' · tradotto' : ''}${n > 1 ? ` · e ${n === 2 ? 'un\'altra testata' : 'altre ' + (n - 1) + ' testate'}` : ''}</span></p>` : ''}</div>
  </article>`;
}
function viewSfoglia(){
  const st = feedState(false); if (st) return st;
  const list = sfogliaList();
  if (!list.length) return `<div class="state"><h3>Niente da sfogliare, per ora</h3><p>Appena la redazione automatica pubblica le notizie, qui le trovi una per schermata.</p></div>`;
  S.sfN = Math.min(list.length, Math.max(S.sfN || 0, SF_STEP, (S.sfIdx || 0) + 5));
  return `<div class="sfv" id="sfv" role="feed" aria-label="Sfoglia: una notizia per schermata">${list.slice(0, S.sfN).map(sfSlide).join('')}</div>`;
}
function sfMore(){
  const el = $('#sfv'); if (!el) return;
  const list = sfogliaList(); if (S.sfN >= list.length) return;
  const n1 = Math.min(list.length, S.sfN + SF_STEP);
  const was = collecting; collecting = true; CTX = S.ctx || [];
  el.insertAdjacentHTML('beforeend', list.slice(S.sfN, n1).map(sfSlide).join(''));
  S.ctx = CTX; collecting = was; S.sfN = n1;
}
document.addEventListener('scroll', e => {
  const el = e.target; if (!el || el.id !== 'sfv') return;
  if (Date.now() - (S.sfKeyAt || 0) > 700) S.sfIdx = Math.round(el.scrollTop / Math.max(1, el.clientHeight));
  if (el.scrollTop + el.clientHeight * 4 > el.scrollHeight) sfMore();
}, {capture:true, passive:true});
document.addEventListener('keydown', e => {
  if (S.tab !== 'sfoglia' || S.story || !$('#onb').hidden) return;
  if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(e.key)) return;
  const el = $('#sfv'); if (!el) return;
  e.preventDefault();
  const i = Math.max(0, Math.min(el.children.length - 1, (S.sfIdx || 0) + (e.key === 'ArrowDown' || e.key === 'PageDown' ? 1 : -1)));
  S.sfIdx = i; S.sfKeyAt = Date.now(); if (i + 4 > el.children.length) sfMore();
  el.scrollTo({top:i * el.clientHeight, behavior:'smooth'});
  const sl = el.children[i]; if (sl) sl.focus({preventScroll:true});
});
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
  S.history = [{id:s.id, at:new Date().toISOString(), s:{headline:s.headline, topic:s.topic, zona:s.zona || null, dossier:s.dossier || null, tags:(s.tags || []).slice(0, 8), updatedAt:s.updatedAt, img:s.img || null, place:s.place || null, sources:(s.sources || []).slice(0, 6).map(x => ({o:x.o, t:x.t, u:x.u, d:x.d}))}}].concat(S.history.filter(x => x.id !== s.id)).slice(0, 80);
  persist('history', 1500);
}

/* ---------- preferenze ---------- */
function togglePref(key, id){
  const arr = Array.isArray(S.prefs[key]) ? S.prefs[key].slice() : [];
  const i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1); else arr.push(id);
  S.prefs[key] = arr;
  persist('prefs');
  return i < 0;
}
function applyReaderSize(){ document.body.classList.remove('size-s', 'size-m', 'size-l'); document.body.classList.add('size-' + (S.prefs.size || 'm')); }

/* ---------- primo avvio: benvenuto, temi, nome; poi in Oggi la carta che si muove da sola ---------- */
const ARROW_R = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ARROW_L = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
function maybeOnboard(){ if (S.onbShown || S.prefs.onboarded) return; S.onbShown = true; openOnb(0); }
function openOnb(step){ S.onbStep = step; $('#onb').hidden = false; document.body.classList.add('locked'); renderOnb(); $('#onb').scrollTop = 0; }
function closeOnb(){ $('#onb').hidden = true; if (!S.story) document.body.classList.remove('locked'); }
function onbGreet(){ return `${greeting()}${S.firstName ? `, <em>${esc(S.firstName)}</em>` : ''}`; }
function finishOnb(){
  S.prefs.onboarded = true; persist('prefs', 0); closeOnb();
  S.deckIdx = 0; setTab('oggi');
}
function renderOnb(){
  const p = S.prefs, el = $('#onb'), st = S.onbStep;
  const top = `<div class="obt"><span class="steps" aria-label="Passo ${st + 1} di 3">${[0, 1, 2].map(i => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</span><button class="skip" data-act="onb-done">Salta</button></div>`;
  let h = '';
  if (st === 0) {
    const n = Object.keys(S.outlets).length || 145;
    h = `${top}<div class="ostack" aria-hidden="true"><div class="sc" style="top:0;transform:scale(.9);border-top-color:#C25400;opacity:.9"></div><div class="sc" style="top:14px;transform:scale(.95);border-top-color:#3D5FC4"></div><div class="sc" style="top:30px;border-top-color:#D0021B"><span class="p"></span><span class="l1"></span><span class="l2"></span><span class="l3"></span></div></div>
      <div class="obx"><h1 id="onbT">Ciao, benvenuto in <em>Eddy</em></h1><p class="olead">Ogni giorno leggiamo per te ${n} testate e mettiamo insieme gli articoli che raccontano lo stesso fatto.</p><p class="olead" style="margin-top:8px">Una notizia, tutte le voci, in un posto solo.</p></div>
      <button class="cta" data-act="onb-next">Iniziamo ${ARROW_R}</button>`;
  } else if (st === 1) {
    const k = p.topics.length;
    h = `${top}<h1 id="onbT" class="oh2">Cosa ti interessa?</h1><p class="olead sm">Tocca i temi: si accendono del loro colore.</p>
      <div class="otg">${topicFamilies('onb')}</div>
      <div class="obot"><button class="cta" data-act="onb-next" id="onbNext">${k ? `Avanti · ${k} ${k === 1 ? 'tema' : 'temi'}` : 'Avanti'}</button></div>`;
  } else {
    h = `${top}<div class="obx" style="margin-top:70px"><h1 id="onbT">Come ti dobbiamo chiamare?</h1><p class="olead">Solo per salutarti. Il nome resta su questo telefono.</p>
      <label class="sr" for="onbName">Il tuo nome</label><input id="onbName" class="oinp" value="${esc(p.name || '')}" placeholder="Il tuo nome" autocomplete="given-name" maxlength="40" enterkeyhint="done">
      <div class="oprev" aria-live="polite"><small>Così ti saluteremo</small><b id="onbGreet">${onbGreet()}</b></div></div>
      <button class="cta" data-act="onb-done">Inizia a leggere</button>`;
  }
  el.innerHTML = `<div class="ob${st === 1 ? ' fixh' : ''}">${h}</div>`;
  const f = el.querySelector('#onbT'); if (f) { f.tabIndex = -1; f.focus({preventScroll:true}); }
}
function updateCounters(){
  const k = S.prefs.topics.length;
  const b = $('#onbNext'); if (b) b.textContent = k ? `Avanti · ${k} ${k === 1 ? 'tema' : 'temi'}` : 'Avanti';
}
// la prima volta in Oggi la carta in primo piano si muove da sola: finisce appena sposti il mazzo
function deckHint(){ return !!S.prefs.onboarded && !LS.get('deckHint'); }
function deckHintDone(){ if (!deckHint()) return; LS.set('deckHint', 1); const d = $('#deck'); if (d) d.classList.remove('hinting'); const hp = $('#deckHintP'); if (hp) hp.outerHTML = `<div class="pg" id="dots" aria-hidden="true">${[...document.querySelectorAll('#deck .dk')].map((_, i) => `<i class="${i === (S.deckIdx || 0) ? 'on' : ''}"></i>`).join('')}</div>`; }

/* ---------- toast ---------- */
let toastT = 0;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 1800); }

/* ---------- navigazione ---------- */
function setTab(tab){
  if (!TABS.includes(tab)) tab = 'oggi';
  if (S.story) closeStory();
  const same = S.tab === tab;
  if (tab !== 'salvati' || same) S.folder = null;
  S.tab = tab;
  try { history.replaceState(null, '', '#' + tab); } catch (e) {}
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
});

/* ---------- eventi ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  if (a === 'save') { e.stopPropagation(); toggleSave(id, el); return; }
  switch (a) {
    case 'tab': e.preventDefault(); closeOnb(); setTab(el.dataset.tab); break;
    case 'flag-src': flagSource(el); break;
    case 'flag-sum': flagSummary(el); break;
    case 'unhide': HID = {}; SUMOFF = {}; LS.set('hid', HID); LS.set('sumoff', SUMOFF); toast('Correzioni locali annullate'); render(); break;
    case 'open': if (Date.now() < deckSuppress) break; openStory(id); break;
    case 'crono-all': S.cronoAll = !S.cronoAll; renderSheet(true); break;
    case 'close': closeStory(); break;
    case 'napoli-all': S.napAll = !S.napAll; render(); break;
    case 'ttopic': {
      const on = togglePref('topics', id);
      document.querySelectorAll(`[data-act="ttopic"][data-id="${CSS.escape(id)}"]`).forEach(b => b.setAttribute('aria-pressed', on));
      updateCounters();
      break;
    }
    case 'seg': S.savedSeg = el.dataset.seg; render(); break;
    case 'folder': S.folder = id || null; render(true); window.scrollTo(0, 0); break;
    case 'refresh': requestRefresh(); break;
    case 'clear-history': S.history = []; persist('history', 0); render(); toast('Cronologia svuotata'); break;
    case 'size': S.prefs.size = el.dataset.v; applyReaderSize(); persist('prefs'); if (S.panel) renderPanel(); render(); { const f = document.querySelector(`#panel [data-act="size"][data-v="${el.dataset.v}"]`); if (f) f.focus(); } break;
    case 'panel': openPanel(el.dataset.v); break;
    case 'panel-close': closePanel(); break;
    case 'edit-name': S.editName = true; render(); { const i = $('#nameInput'); if (i) { i.focus(); i.select(); } } break;
    case 'wipe': wipeData(el); break;
    case 'more': showMore(el.dataset.pkey); break;
    case 'share': {
      const st = getStory(id); if (!st) break;
      const url = location.href.split('#')[0] + '#s-' + id;
      if (window.EddyAndroid && EddyAndroid.share) EddyAndroid.share(st.headline + '\n' + url);
      else if (navigator.share) navigator.share({title:st.headline, url}).catch(() => {});
      else { try { navigator.clipboard.writeText(url).then(() => toast('Link copiato'), () => toast(url)); } catch (err) { toast(url); } }
      break;
    }
    case 'export': exportData(); break;
    case 'onb-open': if (S.panel) closePanel(); LS.set('deckHint', 0); openOnb(Number(el.dataset.step || 0)); break;
    case 'onb-next': S.onbStep = Math.min(2, S.onbStep + 1); renderOnb(); $('#onb').scrollTop = 0; break;
    case 'onb-back': S.onbStep = Math.max(0, S.onbStep - 1); renderOnb(); $('#onb').scrollTop = 0; break;
    case 'onb-done': finishOnb(); break;
  }
});
document.addEventListener('focusout', e => { if (e.target && e.target.id === 'nameInput' && S.editName) { S.editName = false; setTimeout(render, 0); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target && e.target.id === 'onbName') { e.preventDefault(); finishOnb(); return; }
  if (e.key === 'Enter' && e.target && e.target.id === 'nameInput') { e.preventDefault(); e.target.blur(); const b = $('[data-act="edit-name"]'); if (b) b.focus(); return; }
  if (e.key === 'Escape' && S.panel) { closePanel(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('article[data-act="open"]') && e.target.tabIndex >= 0) { e.preventDefault(); openStory(e.target.dataset.id); }
  if (e.key === 'Escape') { if (!$('#onb').hidden) finishOnb(); else if (S.story) closeStory(); }
});
document.addEventListener('toggle', e => {
  const d = e.target; if (!d || !d.matches || !d.matches('details.chd')) return;
  if (d.open) S.openCh.add(d.dataset.ch); else S.openCh.delete(d.dataset.ch);
}, true);

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
    if (S.pendingStory) { const p = S.pendingStory; S.pendingStory = null; if (S.byId.has(p)) setTimeout(() => openStory(p, {fromPop:true}), 0); }
    scheduleRender();
    if (!$('#onb').hidden && S.onbStep === 0) renderOnb();
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
    if (!force && S.story) return false;
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
setInterval(() => { if (!document.hidden && Date.now() - DL.last > 5 * 60000) loadData(false); }, 30000);

/* ---------- installazione, copia di sicurezza, nome ---------- */
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
  if (e.target.id === 'nameInput' || e.target.id === 'onbName') { S.prefs.name = e.target.value.trim().slice(0, 40); S.firstName = S.prefs.name.split(/\s+/)[0] || ''; persist('prefs', 600); const g = $('#onbGreet'); if (g) g.innerHTML = onbGreet(); }
});

/* ---------- trascina verso il basso per aggiornare ---------- */
(function(){
  const ind = document.createElement('div');
  ind.className = 'ptr'; ind.setAttribute('aria-hidden', 'true'); ind.innerHTML = ICON.refresh;
  document.body.appendChild(ind);
  let y0 = null, x0 = 0, d = 0, pulling = false;
  const blocked = () => !!S.story || S.tab === 'sfoglia' || !$('#onb').hidden || document.body.classList.contains('locked');
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
