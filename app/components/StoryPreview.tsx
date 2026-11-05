import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { EditorialStory } from "../data/demo-stories";
import StoryActions, { StoryPrimaryActions } from "./StoryActions";
import StoryArtwork from "./StoryArtwork";

type StoryPreviewProps = {
  story: EditorialStory;
  /**
   * - "hero": card grande della schermata Oggi (immagine, testo, Leggi + Salva)
   * - "compact": card piccola con miniatura, categoria e titolo
   * - "list": versione semplice usata dalla Libreria (non ancora ridisegnata)
   */
  variant?: "hero" | "compact" | "list";
  /** Posizione della storia, per variare i colori dell'illustrazione. */
  tone?: number;
  children?: ReactNode;
};

export default function StoryPreview({
  story,
  variant = "list",
  tone = 0,
  children,
}: StoryPreviewProps) {
  const titleId = `story-${story.id}`;
  const readHref = `/storia/${story.id}`;

  if (variant === "hero") {
    return (
      <article aria-labelledby={titleId} className="rounded-card bg-surface p-2.5 shadow-card">
        <div className="relative h-72 overflow-hidden rounded-media bg-media">
          <StoryArtwork tone={tone} />
          <span className="absolute left-3 top-3 rounded-full bg-[rgb(30_34_32/0.62)] px-3.5 py-1.5 text-label text-surface">
            {story.category}
          </span>
        </div>
        <div className="px-2 pb-2 pt-4.5">
          <h2 id={titleId} className="text-heading-2">
            {story.title}
          </h2>
          <p className="mt-2.5 line-clamp-3 text-body text-muted">{story.description}</p>
          <StoryPrimaryActions storyId={story.id}>
            <Link href={readHref} className="pill-button flex-1">
              Leggi la storia
              <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.4} />
            </Link>
          </StoryPrimaryActions>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article
        aria-labelledby={titleId}
        className="relative flex items-center gap-3.5 rounded-card-sm bg-surface p-2.5 shadow-card-sm"
      >
        <div className="size-26 flex-none overflow-hidden rounded-thumb">
          <StoryArtwork tone={tone} size="thumb" />
        </div>
        <div className="min-w-0 pr-1.5">
          <p className="mb-1 text-label text-accent">{story.category}</p>
          <h3 id={titleId} className="text-heading-3">
            {/* Il link si estende a tutta la card, così si può toccare ovunque. */}
            <Link href={readHref} className="after:absolute after:inset-0 after:rounded-card-sm">
              {story.title}
            </Link>
          </h3>
        </div>
      </article>
    );
  }

  return (
    <article aria-labelledby={titleId}>
      <p className="text-caption tracking-wide text-accent">{story.category}</p>
      <h2 id={titleId} className="mt-2 text-heading-2">
        {story.title}
      </h2>
      <p className="mt-3 text-body text-muted">{story.description}</p>
      {children ?? <StoryActions storyId={story.id} storyTitle={story.title} />}
    </article>
  );
}
