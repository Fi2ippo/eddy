"use client";

import { useSyncExternalStore } from "react";
import { editorialInterests } from "../data/editorial-interests";
import {
  decodePersonalData,
  emptyPersonalData,
  hasActivity,
  isAreaFilter,
  isStoryId,
  isTextSize,
  type AreaFilter,
  LEGACY_PERSONAL_DATA_KEY,
  PERSONAL_DATA_KEY,
  type PersonalData,
  type StoryField,
  type StorySnapshot,
  type TextSize,
} from "./personal-data";

type PersonalSnapshot = {
  data: PersonalData;
  ready: boolean;
  notice: string | null;
};

const serverSnapshot: PersonalSnapshot = {
  data: emptyPersonalData,
  ready: false,
  notice: null,
};
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();

function publish(next: PersonalSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

// Copia una sola volta i dati salvati con la vecchia chiave di ALT.
// Se esiste già un archivio Eddy, vince quello. La vecchia chiave viene
// rimossa solo dopo una copia riuscita, così nessun dato va perso.
function migrateLegacyData(storage: Storage) {
  const legacy = storage.getItem(LEGACY_PERSONAL_DATA_KEY);
  if (legacy === null) return;
  if (storage.getItem(PERSONAL_DATA_KEY) === null) {
    storage.setItem(PERSONAL_DATA_KEY, legacy);
  }
  storage.removeItem(LEGACY_PERSONAL_DATA_KEY);
}

function refresh() {
  try {
    migrateLegacyData(window.localStorage);
  } catch {
    // Migrazione non riuscita: i vecchi dati restano dove sono e si riprova al prossimo avvio.
  }
  try {
    const decoded = decodePersonalData(window.localStorage.getItem(PERSONAL_DATA_KEY));
    publish({ ...decoded, ready: true });
  } catch {
    publish({
      ...snapshot,
      ready: true,
      notice: "Il browser non consente di leggere i dati locali di Eddy.",
    });
  }
}

function onStorage(event: StorageEvent) {
  if (event.key === PERSONAL_DATA_KEY || event.key === null) refresh();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
    refresh();
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => snapshot;
const getServerSnapshot = () => serverSnapshot;

export function usePersonalData() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function commit(change: (current: PersonalData) => PersonalData) {
  if (!snapshot.ready) return false;
  try {
    // Rilegge prima di scrivere, includendo le modifiche già salvate da altre schede.
    const { data } = decodePersonalData(window.localStorage.getItem(PERSONAL_DATA_KEY));
    const next = change(data);
    window.localStorage.setItem(PERSONAL_DATA_KEY, JSON.stringify(next));
    publish({ data: next, ready: true, notice: null });
    return true;
  } catch {
    publish({
      ...snapshot,
      notice:
        "Il browser non ha consentito il salvataggio. La modifica non è stata applicata; controlla la disponibilità della memoria del sito.",
    });
    return false;
  }
}

export function toggleInterest(id: string) {
  if (!editorialInterests.some((interest) => interest.id === id)) return false;
  return commit((data) => ({
    ...data,
    interests: data.interests.includes(id)
      ? data.interests.filter((selected) => selected !== id)
      : [...data.interests, id],
  }));
}

export function setTextSize(size: TextSize) {
  if (!isTextSize(size)) return false;
  return commit((data) => ({ ...data, textSize: size }));
}

export function setArea(area: AreaFilter) {
  if (!isAreaFilter(area)) return false;
  return commit((data) => ({ ...data, area }));
}

// Introduzione: true quando la si finisce o la si salta; false per rivederla (dal Profilo).
export function setOnboardingDone(done: boolean) {
  return commit((data) => ({ ...data, onboardingDone: done }));
}

function updateStory(
  id: string,
  field: StoryField,
  value: (previous: number | undefined) => number | undefined,
  card?: StorySnapshot,
) {
  if (!isStoryId(id)) return false;
  return commit((data) => {
    const activity = { ...data.stories[id] };
    const next = value(activity[field]);
    if (next === undefined) delete activity[field];
    else activity[field] = next;
    if (card) activity.snapshot = card;
    const stories = { ...data.stories };
    if (!hasActivity(activity)) delete stories[id];
    else stories[id] = activity;
    return { ...data, stories };
  });
}

// "card" è la piccola scheda della storia (titolo, categoria, foto…) da conservare per Libreria e Profilo.
export function toggleStoryList(id: string, field: "savedAt" | "readingListAt", card?: StorySnapshot) {
  return updateStory(id, field, (previous) => previous ? undefined : Date.now(), card);
}

export function markStoryRead(id: string, card?: StorySnapshot) {
  return updateStory(id, "readAt", () => Date.now(), card);
}

export function removeStoryFromList(id: string, field: StoryField) {
  return updateStory(id, field, () => undefined);
}

export function clearPersonalData() {
  try {
    window.localStorage.removeItem(PERSONAL_DATA_KEY);
    window.localStorage.removeItem(LEGACY_PERSONAL_DATA_KEY);
    publish({ data: emptyPersonalData, ready: true, notice: null });
    return true;
  } catch {
    publish({ ...snapshot, notice: "Non è stato possibile cancellare i dati locali. Nessun dato è stato rimosso." });
    return false;
  }
}
