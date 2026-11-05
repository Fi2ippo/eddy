"use client";

import { useSyncExternalStore } from "react";
import { editorialInterests } from "../data/editorial-interests";
import type { AreaFilter, StorySnapshot } from "./personal-data";

// Le storie vere: le scrive ogni ora la raccolta (pipeline/collect.py) sul ramo "dati" del repository.
// Si leggono nel browser, così il sito statico non va ricostruito a ogni aggiornamento.
export const STORIES_URL =
  process.env.NEXT_PUBLIC_EDDY_STORIES_URL ??
  "https://raw.githubusercontent.com/Fi2ippo/eddy/dati/stories.json";

export type StorySource = { name: string; title: string; url: string; via: "feed" | "google_news" };
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
    return [{ name, url, title: str(o.title, 400) ?? name, via: o.via === "google_news" ? "google_news" as const : "feed" as const }];
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

export function snapshotOf(story: Story): StorySnapshot {
  return {
    title: story.title,
    category: story.category,
    image: story.image,
    credit: story.image ? story.imageCredit : null,
    source: leadSource(story),
    updated: story.updated,
  };
}

const dayFormat = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" });
const timeFormat = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" });

export function shortDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dayFormat.format(d);
}

export function updatedLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date().toDateString() === d.toDateString();
  return today ? `aggiornata alle ${timeFormat.format(d)}` : `aggiornata il ${dayFormat.format(d)}`;
}

/** Colori dell'illustrazione segnaposto: sempre gli stessi per la stessa storia. */
export function toneOf(id: string) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 997;
  return n;
}
