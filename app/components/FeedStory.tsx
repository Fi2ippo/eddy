import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { EditorialStory } from "../data/demo-stories";
import StoryActions from "./StoryActions";

type FeedStoryProps = {
  story: EditorialStory;
  last: boolean;
};

export default function FeedStory({ story, last }: FeedStoryProps) {
  const titleId = `feed-story-${story.id}`;

  return (
    <article className="feed-story" data-feed-story aria-labelledby={titleId}>
      <div className="reading-container">
        <p className="text-caption tracking-wide text-accent">{story.category}</p>
        <h2 id={titleId} className="mt-3 text-heading-1">
          {story.title}
        </h2>
        <p className="mt-4 text-body text-muted">{story.description}</p>
        {story.insight && <p className="mt-6 text-body">{story.insight}</p>}
        <Link href={`/storia/${story.id}`} className="pill-button mt-6">
          Leggi la storia
          <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.4} />
        </Link>
        <StoryActions storyId={story.id} storyTitle={story.title} allowRead />
        <p className="mt-8 text-caption text-muted">
          {last ? "Fine della selezione" : "Scorri per continuare"}
        </p>
      </div>
    </article>
  );
}
