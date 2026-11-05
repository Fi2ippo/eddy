"use client";

import { Bookmark, Clock } from "lucide-react";
import { toggleStoryList, usePersonalData } from "../lib/personal-store";

// Barra fluttuante in fondo alla pagina Storia, al posto della navigazione.
export default function StoryActionBar({ storyId }: { storyId: string }) {
  const { data, ready, notice } = usePersonalData();
  const activity = data.stories[storyId];
  const saved = Boolean(activity?.savedAt);
  const later = Boolean(activity?.readingListAt);

  return (
    <div role="group" aria-label="Azioni sulla storia" className="floating-bar p-2.5">
      {notice && (
        <p role="status" className="px-2 pb-2 text-secondary text-muted">
          {notice}
        </p>
      )}
      <div className="grid min-h-13 grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!ready}
          aria-pressed={saved}
          className="toggle-pill"
          onClick={() => toggleStoryList(storyId, "savedAt")}
        >
          <Bookmark aria-hidden="true" className="size-5" fill={saved ? "currentColor" : "none"} />
          {saved ? "Salvata" : "Salva"}
        </button>
        <button
          type="button"
          disabled={!ready}
          aria-pressed={later}
          className="toggle-pill"
          onClick={() => toggleStoryList(storyId, "readingListAt")}
        >
          <Clock aria-hidden="true" className="size-5" />
          {later ? "In lista" : "Da leggere"}
        </button>
      </div>
    </div>
  );
}
