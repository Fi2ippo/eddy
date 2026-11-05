"use client";

import { defaultTextSize, textSizes } from "../lib/personal-data";
import { usePersonalData } from "../lib/personal-store";
import type { StorySummary as Summary } from "../lib/stories";
import { SourceLink } from "./StoryBlocks";

// "In breve": estratti brevi di testate diverse (fino a 6), nella dimensione di testo scelta nel Profilo.
// Ogni estratto ha il nome della testata con il link all'originale.
export default function StorySummary({ items }: { items: Summary[] }) {
  const { data } = usePersonalData();
  const size =
    textSizes.find(({ id }) => id === data.textSize) ??
    textSizes.find(({ id }) => id === defaultTextSize)!;

  return (
    <div className="space-y-4 rounded-card bg-surface p-5 shadow-card-sm">
      {items.map((item, index) => (
        <figure key={index} className="m-0">
          <blockquote className="m-0" style={{ fontSize: size.fontSize, lineHeight: 1.55 }}>
            {item.text}
          </blockquote>
          <figcaption className="mt-1.5">
            <SourceLink name={item.source} url={item.url} translated={item.translated} />
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
