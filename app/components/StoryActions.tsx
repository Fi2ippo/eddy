"use client";

import { Bookmark, BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import { markStoryRead, toggleStoryList, usePersonalData } from "../lib/personal-store";

type StoryPrimaryActionsProps = {
  storyId: string;
  /** Azione principale (es. il link "Leggi la storia"), mostrata accanto al segnalibro. */
  children: ReactNode;
};

// Versione del nuovo design: azione principale + segnalibro rotondo.
export function StoryPrimaryActions({ storyId, children }: StoryPrimaryActionsProps) {
  const { data, ready, notice } = usePersonalData();
  const saved = Boolean(data.stories[storyId]?.savedAt);

  return (
    <div className="mt-4.5">
      <div className="flex gap-2.5">
        {children}
        <button
          type="button"
          disabled={!ready}
          aria-pressed={saved}
          aria-label="Salva la storia"
          className="round-toggle"
          onClick={() => toggleStoryList(storyId, "savedAt")}
        >
          <Bookmark aria-hidden="true" className="size-5.5" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      {notice && <p className="mt-2 text-secondary text-muted" role="status">{notice}</p>}
    </div>
  );
}

type StoryActionsProps = {
  storyId: string;
  storyTitle: string;
  allowRead?: boolean;
};

export default function StoryActions({ storyId, storyTitle, allowRead = false }: StoryActionsProps) {
  const { data, ready, notice } = usePersonalData();
  const activity = data.stories[storyId];
  const saved = Boolean(activity?.savedAt);
  const readingList = Boolean(activity?.readingListAt);

  return (
    <div className="mt-6">
      <div role="group" aria-label={`Azioni per ${storyTitle}`} className="flex flex-wrap gap-x-4 gap-y-2">
        <button
          type="button"
          disabled={!ready}
          aria-pressed={saved}
          className={`story-action text-secondary ${saved ? "font-semibold text-accent" : "text-muted"}`}
          onClick={() => toggleStoryList(storyId, "savedAt")}
        >
          <Bookmark aria-hidden="true" className="size-4 shrink-0" />
          <span>{saved ? "Salvata" : "Salva"}</span>
        </button>
        <button
          type="button"
          disabled={!ready}
          aria-pressed={readingList}
          className={`story-action text-secondary ${readingList ? "font-semibold text-accent" : "text-muted"}`}
          onClick={() => toggleStoryList(storyId, "readingListAt")}
        >
          <BookOpen aria-hidden="true" className="size-4 shrink-0" />
          <span>{readingList ? "In Da leggere" : "Da leggere"}</span>
        </button>
        {allowRead && (
          <button type="button" disabled={!ready} className="story-action text-secondary text-muted" onClick={() => markStoryRead(storyId)}>
            {activity?.readAt ? "Segna di nuovo come letta" : "Segna come letta"}
          </button>
        )}
      </div>
      {notice && <p className="mt-2 text-secondary text-muted" role="status">{notice}</p>}
    </div>
  );
}
