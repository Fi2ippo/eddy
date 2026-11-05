"use client";

import type { StorySnapshot } from "../lib/personal-data";
import { usePersonalData } from "../lib/personal-store";
import { SaveLaterButtons } from "./StoryActions";

// Barra fluttuante in fondo alla pagina Storia, al posto della navigazione.
export default function StoryActionBar({ storyId, card }: { storyId: string; card: StorySnapshot }) {
  const { notice } = usePersonalData();

  return (
    <div role="group" aria-label="Azioni sulla storia" className="floating-bar p-2.5">
      {notice && (
        <p role="status" className="px-2 pb-2 text-secondary text-muted">
          {notice}
        </p>
      )}
      <div className="grid min-h-13 grid-cols-2 gap-2">
        <SaveLaterButtons storyId={storyId} card={card} look="bar" />
      </div>
    </div>
  );
}
