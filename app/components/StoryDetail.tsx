"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { markStoryRead, usePersonalData } from "../lib/personal-store";
import { categoryLabel, coverageLine, findStory, outletCount, snapshotOf, toneOf, useStories } from "../lib/stories";
import BackButton from "./BackButton";
import DataNotice from "./DataNotice";
import OutletsTag from "./OutletsTag";
import StoryActionBar from "./StoryActionBar";
import StoryImage from "./StoryImage";
import { CompareBlock, ContextBox, KeyPoints, TimelineBlock } from "./StoryBlocks";
import StorySummary from "./StorySummary";
import TimeAgo from "./TimeAgo";

// Pagina Storia unica: legge l'id dall'indirizzo (/storia?id=…) e la storia dai dati caricati nel browser.
export default function StoryDetail() {
  const id = useSearchParams().get("id");
  const { status, stories } = useStories();
  const { data, ready } = usePersonalData();
  const story = findStory(stories, id);
  const marked = useRef<string | null>(null);

  // Aprire la storia la registra nei Recenti (una volta per apertura).
  useEffect(() => {
    if (story && ready && marked.current !== story.id) {
      marked.current = story.id;
      markStoryRead(story.id, snapshotOf(story));
    }
  }, [story, ready]);

  useEffect(() => {
    if (story) document.title = `${story.title} · Eddy`;
  }, [story]);

  const header = (
    <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
      <BackButton />
      <span className="wordmark text-center">Eddy</span>
      <span aria-hidden="true" />
    </header>
  );

  if (!story) {
    const old = id ? data.stories[id]?.snapshot : undefined;
    return (
      <main className="navigation-page reading-container">
        {header}
        {status === "loading" ? (
          <DataNotice kind="loading" />
        ) : status === "error" ? (
          <DataNotice kind="error" />
        ) : (
          <div className="mt-10 text-center">
            {old && <h1 className="text-heading-2">{old.title}</h1>}
            <p className="mx-auto mt-4 max-w-sm text-body text-muted">
              {old
                ? `Questa storia non è più tra quelle degli ultimi giorni. Era di ${old.source}.`
                : "Questa storia non c’è (o non c’è più)."}
            </p>
            <Link href="/feed" className="pill-button mt-6">Vai al Feed</Link>
          </div>
        )}
      </main>
    );
  }

  const feedSources = story.sources.filter((s) => s.via === "feed").length;
  return (
    <main className="navigation-page reading-container">
      {header}
      <article aria-labelledby="story-title" className="mt-5">
        <div className="relative h-67.5 overflow-hidden rounded-card bg-media shadow-[0_14px_34px_rgb(23_25_28/0.14)]">
          <StoryImage src={story.image} credit={story.imageCredit} tone={toneOf(story.id)} creditPosition="bottom-left" />
          <span className="absolute left-3.5 top-3.5 rounded-full bg-[rgb(30_34_32/0.62)] px-3.5 py-1.5 text-label text-surface">
            {categoryLabel(story.category)}
          </span>
        </div>

        <h1 id="story-title" className="mb-2 mt-5.5 text-center">
          {story.title}
        </h1>
        {story.translated && story.titleOriginal && (
          <p className="mb-2 text-center text-secondary text-muted">
            Titolo originale: <span lang="en">{story.titleOriginal}</span> · tradotto automaticamente
          </p>
        )}
        <p className="text-center text-secondary font-semibold text-muted-strong">{coverageLine(story)}</p>
        <div className="mt-2.5 flex items-center justify-center gap-2.5 text-label font-semibold text-muted">
          <OutletsTag count={outletCount(story)} />
          <TimeAgo iso={story.updated} prefix="Aggiornata " />
        </div>

        {story.summary.length > 0 && (
          <>
            <h2 className="mb-3 mt-6.5 text-center text-section">In breve</h2>
            <StorySummary items={story.summary} />
          </>
        )}
        {/* ogni blocco compare solo se ha contenuto */}
        {story.keyPoints.length > 0 && <KeyPoints items={story.keyPoints} />}
        {story.context && <ContextBox context={story.context} />}
        {story.compare && <CompareBlock compare={story.compare} />}
        {story.timeline && <TimelineBlock timeline={story.timeline} />}

        <h2 className="mb-3 mt-7 text-center text-section">Le fonti</h2>
        <ul className="flex flex-col gap-2.5">
          {story.sources.map((source, index) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-18 items-center gap-3.5 rounded-card-sm bg-surface px-3.5 py-3 shadow-card-sm"
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 flex-none items-center justify-center rounded-full bg-accent-soft text-heading-3 text-accent"
                >
                  {source.name.replace(/^(the|il|la|lo|l’|l')\s*/i, "").charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2 text-label">
                    <span className="text-accent">Leggi su {source.name}</span>
                    <TimeAgo iso={source.published} className="font-semibold text-muted" />
                  </span>
                  <span className="mt-0.5 line-clamp-3 block text-[0.9375rem] font-bold leading-snug">{source.title}</span>
                  <span className="sr-only"> (si apre in un’altra scheda)</span>
                </span>
                <ArrowUpRight aria-hidden="true" className="size-5 flex-none text-muted-strong" strokeWidth={2.2} />
              </a>
              {index === feedSources - 1 && feedSources < story.sources.length && (
                <p className="mt-4 text-center text-caption text-muted">Ne parlano anche (link tramite Google News):</p>
              )}
            </li>
          ))}
        </ul>
      </article>

      <StoryActionBar storyId={story.id} card={snapshotOf(story)} />
    </main>
  );
}
