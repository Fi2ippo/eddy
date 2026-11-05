"use client";

import { Bookmark, Clock } from "lucide-react";
import type { StorySnapshot } from "../lib/personal-data";
import { toggleStoryList, usePersonalData } from "../lib/personal-store";

type SaveLaterButtonsProps = {
  storyId: string;
  card: StorySnapshot;
  /** "dark": pulsanti del Feed scuro; "bar": barra della pagina Storia. */
  look: "dark" | "bar";
};

// Salva / Da leggere con etichetta e stato, usati nel Feed e nella pagina Storia.
export function SaveLaterButtons({ storyId, card, look }: SaveLaterButtonsProps) {
  const { data, ready } = usePersonalData();
  const activity = data.stories[storyId];
  const saved = Boolean(activity?.savedAt);
  const later = Boolean(activity?.readingListAt);
  const cls = look === "dark" ? "feed-toggle" : "toggle-pill";
  return (
    <>
      <button type="button" disabled={!ready} aria-pressed={saved} className={cls}
        onClick={() => toggleStoryList(storyId, "savedAt", card)}>
        <Bookmark aria-hidden="true" className="size-5" fill={saved ? "currentColor" : "none"} />
        {saved ? "Salvata" : "Salva"}
      </button>
      <button type="button" disabled={!ready} aria-pressed={later} className={cls}
        onClick={() => toggleStoryList(storyId, "readingListAt", card)}>
        <Clock aria-hidden="true" className="size-5" />
        {later ? "In lista" : "Da leggere"}
      </button>
    </>
  );
}
