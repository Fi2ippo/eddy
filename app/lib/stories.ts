"use client";

import { useSyncExternalStore } from "react";
import { editorialInterests } from "../data/editorial-interests";
import type { AreaFilter, StorySnapshot } from "./personal-data";

// Le storie vere: le scrive ogni ora la raccolta (pipeline/collect.py) sul ramo "dati" del repository.
// Si leggono nel browser, così il sito statico non va ricostruito a ogni aggiornamento.
export const STORIES_URL =
  process.env.NEXT_PUBLIC_EDDY_STORIES_URL ??
  "https://raw.githubusercontent.com/Fi2ippo/eddy/dati/stories.json";

export type StorySource = { name: string; title: string; url: string; via: "feed" | "google_news"; published: string | null };
export type StorySummary = { source: string; text: string; translated: boolean };
export type Story = {
  id: string;
  title: string;
  titleOriginal: string | null;
  translated: boolean;
  category: string;
  topics: string[];
  area: "italia" | "mondo";
  image: string | null;
  imageCredit: string | null;
  firstSeen: string;
  updated: string;
  nSources: number;
  summary: StorySummary[];
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
    return [{ name, url, title: str(o.title, 400) ?? name, via: o.via === "google_news" ? "google_news" as const : "feed" as const, published: str(o.published, 40) }];
  });
  const summary: StorySummary[] = (Array.isArray(r.summary) ? r.summary : []).flatMap((s) => {
    const o = (s ?? {}) as Record<string, unknown>;
    const text = str(o.text, 800);
    return text ? [{ text, source: str(o.source, 120) ?? "", translated: o.translated === true }] : [];
  });
  return {
    id,
    title,
    titleOriginal: str(r.title_original, 400),
    translated: r.translated === true,
    category,
    topics: topics.length ? topics : [category],
    area: r.area === "italia" ? "italia" : "mondo",
    image: httpUrl(r.image),
    imageCredit: str(r.image_credit, 160),
    firstSeen: str(r.first_seen, 40) ?? updated,
    updated,
    nSources: typeof r.n_sources === "number" && r.n_sources > 0 ? Math.floor(r.n_sources) : Math.max(1, sources.length),
    summary: summary.slice(0, 3),
    sources,
  };
}

// ------------------------------------------------------------ caricamento (una volta per visita)
const serverState: StoriesState = { status: "loading", stories: [], generated: null };
let state: StoriesState = serverState;
let started = false;
const listeners = new Set<() => void>();

function publish(next: StoriesState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function loadStories() {
  started = true;
  if (state.status !== "loading") publish({ ...state, status: "loading" });
  fetch(STORIES_URL, { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json() as Promise<unknown>;
    })
    .then((json) => {
      const data = (json ?? {}) as Record<string, unknown>;
      const stories = (Array.isArray(data.stories) ? data.stories : []).map(parseStory).filter((s): s is Story => s !== null);
      publish({ status: "ready", stories, generated: str(data.generated, 40) });
    })
    .catch(() => publish({ ...state, status: "error" }));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) queueMicrotask(loadStories);
  return () => listeners.delete(listener);
}

export function useStories() {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}

const dayFormat = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" });

// ------------------------------------------------------------ scelte e ordinamenti
export function byArea(stories: Story[], area: AreaFilter) {
  return area === "tutto" ? stories : stories.filter((s) => s.area === area);
}

/** Feed: prima le storie dei tuoi interessi, poi le altre; dentro ciascun gruppo dalla più recente. */
export function feedOrder(stories: Story[], interests: string[], area: AreaFilter, limit = 30) {
  const chosen = new Set(interests);
  const match = (s: Story) => (chosen.size && s.topics.some((t) => chosen.has(t)) ? 1 : 0);
  return [...byArea(stories, area)]
    .sort((a, b) => match(b) - match(a) || b.updated.localeCompare(a.updated))
    .slice(0, limit);
}

/** Oggi: la storia più importante (i dati arrivano già in ordine di importanza) e altre due. */
export function todayPicks(stories: Story[], area: AreaFilter) {
  return byArea(stories, area).slice(0, 3);
}

export function findStory(stories: Story[], id: string | null) {
  return id ? stories.find((s) => s.id === id) : undefined;
}

export function storyHref(id: string) {
  return `/storia?id=${encodeURIComponent(id)}`;
}

export function categoryLabel(id: string) {
  return editorialInterests.find((i) => i.id === id)?.label ?? id;
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

/** Prima pagina: solo le ultime 24 ore, ordinate per punteggio; rispetta il filtro Italia / Mondo. */
export function frontPage(stories: Story[], area: AreaFilter, now: number) {
  return byArea(stories, area)
    .filter((s) => hoursAgo(s.updated, now) <= FRONT_PAGE_HOURS)
    .map((s) => ({ story: s, score: frontPageScore(s, now) }))
    .sort((a, b) => b.score - a.score || b.story.updated.localeCompare(a.story.updated))
    .slice(0, FRONT_PAGE_SIZE);
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
