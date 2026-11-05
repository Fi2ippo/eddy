"use client";

import { defaultTextSize, textSizes } from "../lib/personal-data";
import { usePersonalData } from "../lib/personal-store";
import type { StorySummary as Summary } from "../lib/stories";

// "In breve": estratti brevi delle testate (massimo 3), nella dimensione di testo scelta nel Profilo.
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
          <figcaption className="mt-1.5 text-label text-muted-strong">
            {item.source}
            {item.translated && <span className="font-semibold text-muted"> · tradotto automaticamente</span>}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
