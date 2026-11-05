"use client";

import { Bookmark, Clock, History } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { StoryField, StorySnapshot } from "../lib/personal-data";
import { removeStoryFromList, usePersonalData } from "../lib/personal-store";
import { ThemeTag } from "../lib/themes";
import { shortDate, snapshotOf, storyHref, toneOf, useStories } from "../lib/stories";
import LibraryEmptyState from "./LibraryEmptyState";
import OutletsTag from "./OutletsTag";
import StoryImage from "./StoryImage";

const sections = [
  { label: "Salvati", field: "savedAt", icon: Bookmark, title: "Ancora nessuna storia salvata", text: "Tocca il segnalibro su una storia per conservarla qui." },
  { label: "Recenti", field: "readAt", icon: History, title: "Nessuna lettura recente", text: "Le storie che apri compariranno qui, dalla più recente." },
  { label: "Da leggere", field: "readingListAt", icon: Clock, title: "La lista è libera", text: "Aggiungi una storia a “Da leggere” per conservarla per il momento giusto." },
] as const;

export default function LibraryView() {
  const [active, setActive] = useState(0);
  const { data, ready, notice } = usePersonalData();
  const { stories } = useStories();
  const section = sections[active];
  const entriesOf = (field: StoryField) =>
    Object.entries(data.stories)
      .filter(([, activity]) => activity[field])
      .sort(([a, x], [b, y]) => (y[field] ?? 0) - (x[field] ?? 0) || a.localeCompare(b));
  const entries = entriesOf(section.field);

  return (
    <main className="navigation-page reading-container">
      <header className="text-center">
        <span className="wordmark">Eddy</span>
        <h1 className="mt-5.5 text-display">Libreria</h1>
        <p className="mx-auto mt-2.5 max-w-[19rem] text-body text-muted">
          Uno spazio personale per ritrovare ciò che merita più tempo e attenzione.
        </p>
      </header>

      <div role="group" aria-label="Sezioni della Libreria" className="segmented mt-5.5 grid-cols-3">
        {sections.map(({ label, field }, index) => (
          <button key={field} type="button" aria-pressed={active === index} aria-controls="library-list" onClick={() => setActive(index)}>
            {label}
            <span className="count">
              {ready ? entriesOf(field).length : "–"}
              <span className="sr-only"> storie</span>
            </span>
          </button>
        ))}
      </div>

      <section id="library-list" aria-live="polite" aria-label={section.label} className="mt-3.5 rounded-card bg-surface shadow-card">
        {notice && <p role="status" className="px-5 pt-4 text-secondary text-muted">{notice}</p>}
        {!ready ? (
          <p role="status" className="p-8 text-center text-body text-muted">Caricamento della Libreria…</p>
        ) : entries.length === 0 ? (
          <LibraryEmptyState title={section.title} description={section.text} icon={<section.icon className="size-8.5" strokeWidth={2} />} />
        ) : (
          <ul className="px-4 py-2.5">
            {entries.map(([id, activity]) => {
              const live = stories.find((s) => s.id === id);
              const card: StorySnapshot | undefined = live ? snapshotOf(live) : activity.snapshot;
              return (
                <li key={id} className="border-b border-divider py-3 last:border-0">
                  {card ? (
                    <article className="relative flex items-center gap-3.5">
                      <div className="relative size-21 flex-none overflow-hidden rounded-[1.25rem] bg-media">
                        <StoryImage src={card.image} credit={null} tone={toneOf(id)} size="thumb" creditPosition="none" />
                      </div>
                      <div className="min-w-0">
                        <ThemeTag id={card.category} className="mb-1.5" />
                        <h2 className="line-clamp-3 text-[1.0625rem] font-extrabold leading-tight">
                          <Link href={storyHref(id)} className="after:absolute after:inset-0">
                            {card.title}
                          </Link>
                        </h2>
                        {card.outlets && (
                          <span className="relative z-10 mt-1.5 inline-flex">
                            <OutletsTag count={card.outlets} />
                          </span>
                        )}
                        <p className="mt-1 text-caption text-muted">
                          {card.source} · {shortDate(card.updated)}
                          {card.image && card.credit && ` · ${card.credit}`}
                        </p>
                      </div>
                    </article>
                  ) : (
                    <div>
                      <h2 className="text-heading-3">Storia non più disponibile</h2>
                      <p className="mt-1 text-secondary text-muted">Era stata salvata con una versione precedente di Eddy.</p>
                      <button
                        type="button"
                        className="mt-2 min-h-11 cursor-pointer border-0 bg-transparent p-0 text-secondary font-bold text-accent underline underline-offset-4"
                        onClick={() => removeStoryFromList(id, section.field)}
                      >
                        Togli dall’elenco
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
