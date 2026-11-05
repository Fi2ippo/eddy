"use client";

import { useState } from "react";
import StoryArtwork from "./StoryArtwork";

type StoryImageProps = {
  src: string | null;
  credit: string | null;
  tone: number;
  size?: "large" | "thumb";
  /** Dove mettere il credito "Foto: <testata>" sopra l'immagine (le miniature lo mostrano sotto, nel testo). */
  creditPosition?: "top-right" | "bottom-left" | "none";
};

// Foto della testata in hotlink (Eddy non la scarica né la ospita), con credito.
// Se manca o non si carica, al suo posto c'è l'illustrazione segnaposto.
export default function StoryImage({ src, credit, tone, size = "large", creditPosition = "top-right" }: StoryImageProps) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return <StoryArtwork tone={tone} size={size} showLabel={size === "large" && creditPosition !== "none"} />;
  }
  const where = creditPosition === "bottom-left" ? "left-3.5 bottom-3.5" : "right-3.5 top-3.5";
  return (
    <>
      {/* next/image ricopierebbe la foto sul nostro server: qui serve l'hotlink */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(src)}
        className="block size-full object-cover"
      />
      {credit && creditPosition !== "none" && (
        <span className={`absolute ${where} max-w-[60%] truncate rounded-full bg-overlay-strong px-2.5 py-1 text-caption text-on-photo`}>
          {credit}
        </span>
      )}
    </>
  );
}
