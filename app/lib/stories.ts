"use client";

import { useSyncExternalStore } from "react";
import { editorialInterests } from "../data/editorial-interests";
import type { AreaFilter, StorySnapshot } from "./personal-data";

// Le storie vere: le scrive ogni ora la raccolta (pipeline/collect.py) sul ramo "dati" del repository.
// Si leggono nel browser, così il sito statico non va ricostruito a ogni aggiornamento.
// Dove stanno i dati: repository e ramo (si possono cambiare con le variabili d'ambiente).
const DATA_REPO = process.env.NEXT_PUBLIC_EDDY_DATA_REPO ?? "Fi2ippo/eddy";
const DATA_BRANCH = process.env.NEXT_PUBLIC_EDDY_DATA_BRANCH ?? "dati";
/** Indirizzo "normale" dei dati: la CDN di GitHub lo tiene in cache fino a 5 minuti. */
export const STORIES_URL =
  process.env.NEXT_PUBLIC_EDDY_STORIES_URL ??
  `https://raw.githubusercontent.com/${DATA_REPO}/${DATA_BRANCH}/stories.json`;
/** Ultimo commit del ramo dati (cache di al massimo 1 minuto): l'indirizzo con il commit è sempre fresco. */
const LATEST_COMMIT_URL = `https://api.github.com/repos/${DATA_REPO}/commits/${DATA_BRANCH}`;
const REFRESH_MINUTES = 10; // con la pagina aperta, ricontrolla se ci sono dati nuovi
const FETCH_TIMEOUT_MS = 15_000; // uno scaricamento che non risponde (es. telefono che ha sospeso la pagina) si interrompe
// (AbortSignal.timeout manca nei browser più vecchi: lì si scarica senza limite di tempo)
const timeoutSignal = () => (typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(FETCH_TIMEOUT_MS) : undefined);
/** Oltre questa età i dati si considerano "in ritardo". */
export const STALE_HOURS = 2;

/** titleOriginal: il titolo nella lingua della testata, quando "title" è una traduzione automatica */
export type StorySource = { name: string; title: string; titleOriginal: string | null; url: string; via: "feed" | "google_news"; published: string | null };
/** Frase o estratto di una testata, sempre con il nome della testata e il link all'originale. */
export type StorySummary = { source: string; text: string; url: string | null; translated: boolean };
export type StoryCompare = {
  outlets: number;
  common: { word: string; count: number }[];
  unique: { text: string; sources: { name: string; url: string }[] }[];
};
export type TimelineItem = { time: string; source: string; title: string; url: string; kind: "first" | "new" | "correction" | "last" };
export type StoryTimeline = { items: TimelineItem[]; repeats: number };
/** "Per capire": riassunto della voce di Wikipedia (licenza CC BY-SA). */
export type StoryContext = { name: string; title: string; summary: string; url: string };
export type Story = {
  id: string;
  title: string;
  titleOriginal: string | null;
  translated: boolean;
  /** lingua del titolo originale quando è tradotto (es. "en") */
  originalLang: string | null;
  category: string;
  topics: string[];
  area: "italia" | "mondo";
  image: string | null;
  imageCredit: string | null;
  firstSeen: string;
  updated: string;
  nSources: number;
  /** storie diverse sullo stesso evento hanno lo stesso valore (id della più importante) */
  event: string;
  summary: StorySummary[];
  keyPoints: StorySummary[];
  compare: StoryCompare | null;
  timeline: StoryTimeline | null;
  context: StoryContext | null;
  sources: StorySource[];
};

type StoriesState = { status: "loading" | "ready" | "error"; stories: Story[]; generated: string | null };

const INTERESTS = new Set<string>(editorialInterests.map(({ id }) => id));

// ------------------------------------------------------------ controllo dei dati
function str(value: unknown, max = 2000): string | null {
  return typeof value === "string" && value.trim() && value.length <= max ? value : null;
}

function httpUrl(value: unknown): string | null {
  const s = str(value);
  return s && /^https?:\/\//i.test(s) ? s : null;
}

function rec(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function parseCompare(value: unknown): StoryCompare | null {
  const r = rec(value);
  if (!r) return null;
  const common = (Array.isArray(r.common) ? r.common : []).flatMap((c) => {
    const o = rec(c);
    const word = o && str(o.word, 60);
    return word && typeof o.count === "number" ? [{ word, count: o.count }] : [];
  });
  const unique = (Array.isArray(r.unique) ? r.unique : []).flatMap((u) => {
    const o = rec(u);
    const text = o && str(o.text, 200);
    const sources = (Array.isArray(o?.sources) ? (o.sources as unknown[]) : []).flatMap((x) => {
      const q = rec(x);
      const name = q && str(q.name, 120);
      const url = q && httpUrl(q.url);
      return name && url ? [{ name, url }] : [];
    });
    return text && sources.length ? [{ text, sources }] : [];
  });
  const outlets = typeof r.outlets === "number" ? r.outlets : 0;
  return common.length || unique.length ? { outlets, common, unique } : null;
}

function parseTimeline(value: unknown): StoryTimeline | null {
  const r = rec(value);
  if (!r) return null;
  const kinds = new Set(["first", "new", "correction", "last"]);
  const items = (Array.isArray(r.items) ? r.items : []).flatMap((i) => {
    const o = rec(i);
    const time = o && str(o.time, 40);
    const title = o && str(o.title, 400);
    const url = o && httpUrl(o.url);
    const source = o && str(o.source, 120);
    const kind = o && typeof o.kind === "string" && kinds.has(o.kind) ? (o.kind as TimelineItem["kind"]) : null;
    return time && title && url && source && kind ? [{ time, title, url, source, kind }] : [];
  });
  return items.length >= 2 ? { items, repeats: typeof r.repeats === "number" ? r.repeats : 0 } : null;
}

function parseContext(value: unknown): StoryContext | null {
  const r = rec(value);
  const name = r && str(r.name, 120);
  const title = r && str(r.title, 200);
  const summary = r && str(r.summary, 800);
  const url = r && httpUrl(r.url);
  return name && title && summary && url && url.startsWith("https://it.wikipedia.org/") ? { name, title, summary, url } : null;
}

function parseStory(raw: unknown): Story | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id, 128);
  const title = str(r.title, 400);
  const updated = str(r.updated, 40);
  if (!id || !/^[a-z0-9][a-z0-9_-]{0,127}$/.test(id) || !title || !updated) return null;
  const topics = Array.isArray(r.topics) ? r.topics.filter((t): t is string => typeof t === "string" && INTERESTS.has(t)) : [];
  const category = typeof r.category === "string" && INTERESTS.has(r.category) ? r.category : topics[0] ?? "societa";
  const sources: StorySource[] = (Array.isArray(r.sources) ? r.sources : []).flatMap((s) => {
    const o = (s ?? {}) as Record<string, unknown>;
    const name = str(o.name, 120);
    const url = httpUrl(o.url);
    if (!name || !url) return [];
    const titleOriginal = o.translated === true ? str(o.title_original, 400) : null;
    return [{ name, url, title: str(o.title, 400) ?? name, titleOriginal, via: o.via === "google_news" ? "google_news" as const : "feed" as const, published: str(o.published, 40) }];
  });
  const quotes = (value: unknown, max: number): StorySummary[] =>
    (Array.isArray(value) ? value : []).flatMap((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      const text = str(o.text, 800);
      return text ? [{ text, source: str(o.source, 120) ?? "", url: httpUrl(o.url), translated: o.translated === true }] : [];
    }).slice(0, max);
  return {
    id,
    title,
    titleOriginal: str(r.title_original, 400),
    translated: r.translated === true,
    originalLang: str(r.original_lang, 8),
    category,
    topics: topics.length ? topics : [category],
    area: r.area === "italia" ? "italia" : "mondo",
    image: httpUrl(r.image),
    imageCredit: str(r.image_credit, 160),
    firstSeen: str(r.first_seen, 40) ?? updated,
    updated,
    event: str(r.event, 128) ?? id,
    nSources: typeof r.n_sources === "number" && r.n_sources > 0 ? Math.floor(r.n_sources) : Math.max(1, sources.length),
    summary: quotes(r.summary, 6),
    keyPoints: quotes(r.key_points, 5),
    compare: parseCompare(r.compare),
    timeline: parseTimeline(r.timeline),
    context: parseContext(r.context),
    sources,
  };
}

// ------------------------------------------------------------ caricamento (all'apertura, poi ogni 10 minuti)
const serverState: StoriesState = { status: "loading", stories: [], generated: null };
let state: StoriesState = serverState;
let started = false;
let loadedCommit: string | null = null;
let loadingSince = 0; // quando è partito lo scaricamento in corso (0 = nessuno)
const listeners = new Set<() => void>();

function publish(next: StoriesState) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Indirizzo dei dati più freschi: quello del commit più recente del ramo dati (non passa dalla cache della CDN).
 *  Se GitHub non risponde (es. troppe richieste), si usa l'indirizzo normale. */
async function freshUrl(): Promise<{ url: string; commit: string | null }> {
  if (process.env.NEXT_PUBLIC_EDDY_STORIES_URL) return { url: STORIES_URL, commit: null };
  try {
    const r = await fetch(LATEST_COMMIT_URL, { cache: "no-store", headers: { Accept: "application/vnd.github.sha" }, signal: timeoutSignal() });
    const sha = r.ok ? (await r.text()).trim() : "";
    if (/^[0-9a-f]{40}$/.test(sha)) {
      return { url: `https://raw.githubusercontent.com/${DATA_REPO}/${sha}/stories.json`, commit: sha };
    }
  } catch {
    // si usa l'indirizzo normale
  }
  return { url: STORIES_URL, commit: null };
}

/** Carica le storie. Con "quiet" (controlli periodici) non mostra il caricamento e non cambia nulla se i dati sono gli stessi. */
export async function loadStories(quiet = false) {
  started = true;
  // uno scaricamento rimasto appeso (pagina sospesa dal telefono) non deve bloccare per sempre i successivi
  if (loadingSince && Date.now() - loadingSince < 2 * FETCH_TIMEOUT_MS + 5_000) return;
  const mine = (loadingSince = Date.now());
  if (!quiet && state.status !== "loading") publish({ ...state, status: "loading" });
  try {
    const { url, commit } = await freshUrl();
    if (quiet && commit && commit === loadedCommit) return;
    const response = await fetch(url, { cache: commit ? "force-cache" : "no-cache", signal: timeoutSignal() });
    if (!response.ok) throw new Error(String(response.status));
    const data = ((await response.json()) ?? {}) as Record<string, unknown>;
    const stories = (Array.isArray(data.stories) ? data.stories : []).map(parseStory).filter((s): s is Story => s !== null);
    loadedCommit = commit;
    publish({ status: "ready", stories, generated: str(data.generated, 40) });
  } catch {
    if (!quiet || state.stories.length === 0) publish({ ...state, status: "error" });
  } finally {
    if (loadingSince === mine) loadingSince = 0;
  }
}

let refreshTimer: ReturnType<typeof setInterval> | undefined;
// Si ricontrolla appena si torna sulla pagina: scheda di nuovo visibile, pagina ripristinata dalla memoria
// del telefono (pageshow), finestra di nuovo attiva o connessione tornata.
const onVisible = () => {
  if (document.visibilityState === "visible") void loadStories(true);
};
const WAKE_EVENTS = ["pageshow", "focus", "online"] as const;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) queueMicrotask(() => void loadStories());
  if (!refreshTimer) {
    refreshTimer = setInterval(() => void loadStories(true), REFRESH_MINUTES * 60_000);
    document.addEventListener("visibilitychange", onVisible);
    WAKE_EVENTS.forEach((e) => window.addEventListener(e, onVisible));
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = undefined;
      document.removeEventListener("visibilitychange", onVisible);
      WAKE_EVENTS.forEach((e) => window.removeEventListener(e, onVisible));
    }
  };
}

export function useStories() {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}

const dayFormat = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" });

// ------------------------------------------------------------ scelte e ordinamenti
export function byArea(stories: Story[], area: AreaFilter) {
  return area === "tutto" ? stories : stories.filter((s) => s.area === area);
}

/** Punteggio del Feed: testate (pesano di più), freschezza, foto. Gli interessi contano dopo, nella miscela. */
export function feedScore(story: Story, now: number) {
  const fresh = Math.max(0, 1 - hoursAgo(story.updated, now) / 36);
  return 3 * Math.min(outletCount(story), 10) + 10 * fresh + (story.image ? 1 : 0);
}

/** Feed: storie per punteggio, mescolate con i tuoi interessi in proporzione e con varietà di testate e temi;
 *  le storie già lette vanno in fondo. */
export function feedOrder(stories: Story[], interests: string[], area: AreaFilter, read: Set<string>, now: number, limit = 30) {
  const ordered = byArea(stories, area)
    .map((s) => ({ s, score: feedScore(s, now) }))
    .sort((a, b) => b.score - a.score || b.s.updated.localeCompare(a.s.updated))
    .map(({ s }) => s);
  const unread = ordered.filter((s) => !read.has(s.id));
  return [...mix(unread, { interests: new Set(interests), limit }), ...ordered.filter((s) => read.has(s.id))].slice(0, limit);
}

// ------------------------------------------------------------ miscela: interessi in proporzione e varietà
/** Quota delle storie dei tuoi temi quando hai scelto degli interessi: 7 su 10 (le altre 3 per non chiudersi in una bolla). */
export const INTEREST_SHARE = 0.7;
const SOURCE_GAP = 4; // la stessa testata non torna prima di 4 storie
const THEME_RUN = 2; // lo stesso tema al massimo 2 volte di fila

export function isMine(story: Story, interests: Set<string>) {
  return interests.size > 0 && interests.has(story.category); // la categoria mostrata, così ciò che vedi torna con ciò che hai scelto
}

const leadOf = (s: Story) => s.sources[0]?.name ?? "";

type MixOptions = { interests: Set<string>; limit?: number; maxPerTheme?: number; share?: number };

/** Rimescola un elenco già ordinato (per importanza o per orario) senza stravolgerlo:
 *  - se ci sono interessi, circa il 70% delle storie viene dai tuoi temi e il resto dagli altri;
 *  - la stessa testata non compare due volte entro SOURCE_GAP storie, lo stesso tema non più di THEME_RUN volte di fila
 *    (una in più per i tuoi temi);
 *  - con maxPerTheme, un tema che non è fra i tuoi non supera quel numero di storie.
 *  Quando le regole non si possono rispettare (es. restano storie di un solo tema), si prende la prima disponibile. */
export function mix(ordered: Story[], { interests, limit = ordered.length, maxPerTheme, share = INTEREST_SHARE }: MixOptions) {
  const mine: Story[] = [];
  const other: Story[] = [];
  for (const s of ordered) (isMine(s, interests) ? mine : other).push(s);
  const out: Story[] = [];
  const perTheme = new Map<string, number>();
  let taken = 0; // storie dei tuoi temi già scelte
  // per i tuoi temi i limiti sono più larghi: la proporzione la decide già la quota
  const underCap = (s: Story) => !maxPerTheme || interests.has(s.category) || (perTheme.get(s.category) ?? 0) < maxPerTheme;
  const varied = (s: Story, gap = SOURCE_GAP) => {
    if (out.slice(-gap).some((r) => leadOf(r) === leadOf(s))) return false;
    const run = interests.has(s.category) ? THEME_RUN + 1 : THEME_RUN;
    const last = out.slice(-run);
    return !(last.length === run && last.every((r) => r.category === s.category));
  };
  // dal gruppo voluto la prima storia che rispetta le regole (poi con una distanza fra testate più corta);
  // se non c'è, dall'altro gruppo; solo alla fine si allenta
  const pick = (first: Story[], second: Story[]) => {
    const strict = (s: Story) => underCap(s) && varied(s);
    const loose = (s: Story) => underCap(s) && varied(s, 2);
    for (const [pool, test] of [[first, strict], [first, loose], [second, strict], [first, underCap], [second, underCap]] as const) {
      const i = pool.findIndex(test);
      if (i >= 0) return pool.splice(i, 1)[0];
    }
    return (first.length ? first : second).shift()!;
  };
  while (out.length < limit && (mine.length || other.length)) {
    const wantMine = mine.length > 0 && (other.length === 0 || taken < share * (out.length + 1));
    const s = wantMine ? pick(mine, other) : pick(other, mine);
    if (isMine(s, interests)) taken++;
    perTheme.set(s.category, (perTheme.get(s.category) ?? 0) + 1);
    out.push(s);
  }
  return out;
}

export function findStory(stories: Story[], id: string | null) {
  return id ? stories.find((s) => s.id === id) : undefined;
}

export function storyHref(id: string) {
  return `/storia/?id=${encodeURIComponent(id)}`;
}

export function categoryLabel(id: string) {
  return editorialInterests.find((i) => i.id === id)?.label ?? id;
}

/** Testo sotto il titolo nel Feed: l'estratto più lungo della storia (fino a 4 righe). */
const FROM_LANG: Record<string, string> = {
  en: "dall’inglese", fr: "dal francese", es: "dallo spagnolo", de: "dal tedesco", pt: "dal portoghese", nl: "dall’olandese",
};

/** "Tradotto dall'inglese" per le storie con il titolo tradotto automaticamente (null se non tradotto). */
export function translatedFrom(story: Story) {
  if (!story.translated || !story.titleOriginal) return null;
  return `Tradotto ${FROM_LANG[story.originalLang ?? "en"] ?? "automaticamente"}`;
}

export function leadText(story: Story) {
  return story.summary.reduce((best, s) => (s.text.length > best.length ? s.text : best), "");
}

export function leadSource(story: Story) {
  return story.sources[0]?.name ?? "";
}

/** Nomi delle testate della storia, senza doppioni, nell'ordine dei dati (prima le italiane). */
export function outletNames(story: Story) {
  return [...new Set(story.sources.map((s) => s.name))];
}

/** Numero di testate diverse che raccontano la storia (comprese quelle arrivate da Google News). */
export function outletCount(story: Story) {
  return Math.max(story.nSources, outletNames(story).length, 1);
}

export function outletsLabel(n: number) {
  return n === 1 ? "1 testata" : `${n} testate`;
}

/** "Il Post, ANSA +3": le prime testate e quante altre. */
export function outletsShort(story: Story, max = 2) {
  const names = outletNames(story);
  const more = outletCount(story) - Math.min(max, names.length);
  return names.slice(0, max).join(", ") + (more > 0 ? ` +${more}` : "");
}

/** "Raccontata da Il Post, ANSA e altre 2 testate". */
export function coverageLine(story: Story) {
  const names = outletNames(story);
  const n = outletCount(story);
  if (names.length === 0) return "";
  if (n === 1) return `Raccontata da ${names[0]}`;
  if (n === 2 && names.length >= 2) return `Raccontata da ${names[0]} e ${names[1]}`;
  if (n === 3 && names.length >= 3) return `Raccontata da ${names[0]}, ${names[1]} e ${names[2]}`;
  const rest = n - 2;
  return `Raccontata da ${names.slice(0, 2).join(", ")} e ${rest === 1 ? "un’altra testata" : `altre ${rest} testate`}`;
}

// ------------------------------------------------------------ prima pagina (rilevanti e recenti)
export const FRONT_PAGE_SIZE = 9;
export const FRONT_PAGE_HOURS = 24;
// Pesi del punteggio: le testate contano di più, poi la freschezza, poi un piccolo bonus per la foto.
const W_OUTLET = 3; // punti per ogni testata (fino a MAX_OUTLETS)
const MAX_OUTLETS = 15;
const W_FRESH = 10; // punti per una storia appena aggiornata, che scendono a 0 dopo 24 ore
const W_PHOTO = 1.5;

export function hoursAgo(iso: string, now: number) {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 999 : Math.max(0, (now - t) / 3_600_000);
}

export function frontPageScore(story: Story, now: number) {
  const h = hoursAgo(story.updated, now);
  const fresh = Math.max(0, 1 - h / FRONT_PAGE_HOURS);
  return W_OUTLET * Math.min(outletCount(story), MAX_OUTLETS) + W_FRESH * fresh + (story.image ? W_PHOTO : 0);
}

const FRONT_PAGE_POOL = 45; // si sceglie fra le 45 storie più importanti, così anche quelle dei tuoi temi sono rilevanti
const FRONT_PAGE_MAX_THEME = 3; // al massimo 3 storie dello stesso tema

/** Prima pagina: ultime 24 ore, una sola storia per evento, rispetta il filtro Italia / Mondo.
 *  Fra le più importanti: circa 7 su 10 dei tuoi temi (se li hai scelti), al massimo 3 per tema, testate varie;
 *  quelle che hai già letto passano dietro le altre. */
export function frontPage(stories: Story[], area: AreaFilter, now: number, interests: string[] = [], read: Set<string> = new Set()) {
  const seen = new Set<string>();
  const chosen = new Set(interests);
  const all = byArea(stories, area)
    .filter((s) => hoursAgo(s.updated, now) <= FRONT_PAGE_HOURS)
    .map((s) => ({ story: s, score: frontPageScore(s, now) }))
    .sort((a, b) => b.score - a.score || b.story.updated.localeCompare(a.story.updated))
    .filter(({ story }) => (seen.has(story.event) ? false : (seen.add(story.event), true)))
    .map(({ story }) => story);
  // le più importanti in generale + le migliori dei tuoi temi (anche se raccontate da meno testate), con foto se possibile
  const mineBest = all.filter((s) => isMine(s, chosen)).sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image))).slice(0, FRONT_PAGE_SIZE);
  const pool = [...new Set([...all.slice(0, FRONT_PAGE_POOL), ...mineBest])];
  const ordered = [...pool.filter((s) => !read.has(s.id)), ...pool.filter((s) => read.has(s.id))];
  return mix(ordered, { interests: chosen, limit: FRONT_PAGE_SIZE, maxPerTheme: FRONT_PAGE_MAX_THEME });
}

/** Relevanza per l'elenco filtrato per tema (stesso punteggio della prima pagina, senza limite di 24 ore). */
export function byRelevance(stories: Story[], now: number) {
  return [...stories].sort((a, b) => frontPageScore(b, now) - frontPageScore(a, now) || b.updated.localeCompare(a.updated));
}

export function byRecency(stories: Story[]) {
  return [...stories].sort((a, b) => b.updated.localeCompare(a.updated));
}

// ------------------------------------------------------------ orario relativo ("5 min fa"), aggiornato ogni minuto
const hourMinute = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" });

export function timeAgo(iso: string | null | undefined, now: number) {
  const t = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(t)) return "";
  const m = Math.round((now - t) / 60_000);
  if (m < 1) return "ora";
  if (m < 60) return `${m} min fa`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h fa`;
  const d = new Date(t);
  if (d.toDateString() === new Date(now - 86_400_000).toDateString()) return `ieri ${hourMinute.format(d)}`;
  return dayFormat.format(d);
}

let nowValue = 0;
let nowTimer: ReturnType<typeof setInterval> | undefined;
const nowListeners = new Set<() => void>();

function subscribeNow(listener: () => void) {
  nowListeners.add(listener);
  if (!nowTimer) {
    nowValue = Date.now();
    nowTimer = setInterval(() => {
      nowValue = Date.now();
      nowListeners.forEach((l) => l());
    }, 60_000);
  }
  queueMicrotask(listener);
  return () => {
    nowListeners.delete(listener);
    if (nowListeners.size === 0 && nowTimer) {
      clearInterval(nowTimer);
      nowTimer = undefined;
    }
  };
}

/** L'ora attuale, aggiornata ogni minuto (null durante il primo disegno, per non sbagliare sul server). */
export function useNow(): number | null {
  return useSyncExternalStore(subscribeNow, () => nowValue || null, () => null);
}

export function snapshotOf(story: Story): StorySnapshot {
  return {
    title: story.title,
    category: story.category,
    image: story.image,
    credit: story.image ? story.imageCredit : null,
    source: leadSource(story),
    updated: story.updated,
    outlets: outletCount(story),
  };
}


export function shortDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dayFormat.format(d);
}

/** Colori dell'illustrazione segnaposto: sempre gli stessi per la stessa storia. */
export function toneOf(id: string) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 997;
  return n;
}
