"use client";

import { defaultTextSize, textSizes } from "../lib/personal-data";
import { usePersonalData } from "../lib/personal-store";

// "In breve": usa la dimensione del testo scelta nel Profilo (Piccolo / Medio / Grande).
export default function StorySummary({ paragraphs }: { paragraphs: readonly string[] }) {
  const { data } = usePersonalData();
  const size =
    textSizes.find(({ id }) => id === data.textSize) ??
    textSizes.find(({ id }) => id === defaultTextSize)!;

  return (
    <div
      className="space-y-3.5 rounded-card bg-surface p-5 shadow-card-sm"
      style={{ fontSize: size.fontSize, lineHeight: 1.55 }}
    >
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}
