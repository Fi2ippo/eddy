import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { categoryLabel, leadSource, shortDate, snapshotOf, storyHref, toneOf, type Story } from "../lib/stories";
import { StoryPrimaryActions } from "./StoryActions";
import StoryImage from "./StoryImage";

type StoryPreviewProps = {
  story: Story;
  /** "hero": card grande di Oggi; "compact": card piccola con miniatura, categoria e titolo. */
  variant: "hero" | "compact";
};

export default function StoryPreview({ story, variant }: StoryPreviewProps) {
  const titleId = `story-${story.id}`;
  const href = storyHref(story.id);
  const tone = toneOf(story.id);

  if (variant === "hero") {
    return (
      <article aria-labelledby={titleId} className="rounded-card bg-surface p-2.5 shadow-card">
        <div className="relative h-72 overflow-hidden rounded-media bg-media">
          <StoryImage src={story.image} credit={story.imageCredit} tone={tone} />
          <span className="absolute left-3 top-3 rounded-full bg-[rgb(30_34_32/0.62)] px-3.5 py-1.5 text-label text-surface">
            {categoryLabel(story.category)}
          </span>
        </div>
        <div className="px-2 pb-2 pt-4.5">
          <h2 id={titleId} className="text-heading-2">
            {story.title}
          </h2>
          {story.summary[0] && (
            <p className="mt-2.5 line-clamp-3 text-body text-muted">{story.summary[0].text}</p>
          )}
          <p className="mt-2.5 text-label text-muted-strong">
            {story.nSources > 1 ? `${story.nSources} fonti` : leadSource(story)} · {shortDate(story.updated)}
          </p>
          <StoryPrimaryActions storyId={story.id} card={snapshotOf(story)}>
            <Link href={href} className="pill-button flex-1">
              Leggi la storia
              <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.4} />
            </Link>
          </StoryPrimaryActions>
        </div>
      </article>
    );
  }

  return (
    <article
      aria-labelledby={titleId}
      className="relative flex items-center gap-3.5 rounded-card-sm bg-surface p-2.5 shadow-card-sm"
    >
      <div className="relative size-26 flex-none overflow-hidden rounded-thumb bg-media">
        <StoryImage src={story.image} credit={null} tone={tone} size="thumb" creditPosition="none" />
      </div>
      <div className="min-w-0 pr-1.5">
        <p className="mb-1 text-label text-accent">{categoryLabel(story.category)}</p>
        <h3 id={titleId} className="line-clamp-3 text-heading-3">
          {/* Il link si estende a tutta la card, così si può toccare ovunque. */}
          <Link href={href} className="after:absolute after:inset-0 after:rounded-card-sm">
            {story.title}
          </Link>
        </h3>
        {story.image && story.imageCredit && <p className="mt-1 text-caption text-muted">{story.imageCredit}</p>}
      </div>
    </article>
  );
}
