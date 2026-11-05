"use client";

import { useState, type ReactNode } from "react";
import type { EditorialStory } from "../data/demo-stories";
import type { StoryField } from "../lib/personal-data";
import { removeStoryFromList, usePersonalData } from "../lib/personal-store";
import StoryPreview from "./StoryPreview";

const sections = ["Salvati", "Recenti", "Da leggere"] as const;
const fields: readonly StoryField[] = ["savedAt", "readAt", "readingListAt"];

type LibrarySectionsProps = {
  panels: readonly [ReactNode, ReactNode, ReactNode];
  stories: readonly EditorialStory[];
};

export default function LibrarySections({ panels, stories }: LibrarySectionsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data, ready, notice } = usePersonalData();
  const field = fields[activeIndex];
  const entries = Object.entries(data.stories)
    .filter(([, activity]) => activity[field])
    .sort(([leftId, left], [rightId, right]) =>
      (right[field] ?? 0) - (left[field] ?? 0) || leftId.localeCompare(rightId),
    );
  const removalLabels = ["Rimuovi dai Salvati", "Rimuovi dai Recenti", "Rimuovi dalla lista Da leggere"];

  return (
    <div className="mt-8">
      <div
        role="group"
        aria-label="Sezioni della Libreria"
        className="flex flex-wrap gap-x-4 gap-y-2 border-b border-border"
      >
        {sections.map((label, index) => (
          <button
            key={label}
            id={`library-section-${index}`}
            type="button"
            aria-pressed={activeIndex === index}
            aria-controls="library-content"
            data-label={label}
            onClick={() => setActiveIndex(index)}
            className={`library-section-button text-body ${
              activeIndex === index
                ? "border-accent font-semibold text-accent"
                : "border-transparent font-normal text-muted"
            }`}
          >
            <span>{label}</span>
          </button>
        ))}
      </div>
      <section
        id="library-content"
        aria-labelledby={`library-section-${activeIndex}`}
        className="mt-8"
      >
        {notice && <p role="status" className="mb-4 text-secondary text-muted">{notice}</p>}
        {!ready ? <p role="status" className="text-body text-muted">Caricamento della Libreria…</p> : entries.length === 0 ? panels[activeIndex] : (
          <ul className="divide-y divide-border">
            {entries.map(([id]) => {
              const story = stories.find((item) => item.id === id);
              const title = story?.title ?? "Storia non più disponibile";
              const removeButton = (
                <button
                  type="button"
                  aria-label={`${removalLabels[activeIndex]}: ${title}`}
                  className="story-action mt-4 text-secondary text-accent"
                  onClick={() => {
                    if (removeStoryFromList(id, field)) document.getElementById(`library-section-${activeIndex}`)?.focus();
                  }}
                >
                  {removalLabels[activeIndex]}
                </button>
              );
              return (
                <li key={id} className="py-8 first:pt-0">
                  {story ? <StoryPreview story={story}>{removeButton}</StoryPreview> : (
                    <article>
                      <h2>{title}</h2>
                      <p className="mt-3 text-body text-muted">Il contenuto non è presente nella selezione attuale. Puoi rimuovere questa voce dall’elenco.</p>
                      {removeButton}
                    </article>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
