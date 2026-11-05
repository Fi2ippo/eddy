"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { areaFilters } from "../lib/personal-data";
import { setArea, usePersonalData } from "../lib/personal-store";
import { categoryLabel, feedOrder, snapshotOf, storyHref, toneOf, useStories, type Story } from "../lib/stories";
import DataNotice from "./DataNotice";
import { SaveLaterButtons } from "./StoryActions";
import StoryImage from "./StoryImage";

const pad = (n: number) => String(n).padStart(2, "0");

// Feed a tutto schermo e scuro: una storia per schermata, scorrimento a scatti (dito, rotella, frecce).
export default function FeedView() {
  const { status, stories } = useStories();
  const { data } = usePersonalData();
  const list = feedOrder(stories, data.interests, data.area);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const total = list.length;

  // La storia attiva è quella che occupa lo schermo (si aggiorna mentre si scorre).
  const onScroll = useCallback(() => {
    const v = viewportRef.current;
    if (!v || v.clientHeight === 0) return;
    setActive(Math.max(0, Math.min(total - 1, Math.round(v.scrollTop / v.clientHeight))));
  }, [total]);

  const goTo = (index: number) => {
    const v = viewportRef.current;
    if (!v) return;
    const target = Math.max(0, Math.min(total - 1, index));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    v.scrollTo({ top: target * v.clientHeight, behavior: reduce ? "auto" : "smooth" });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a, button")) {
      if (event.key === " " || event.key === "Enter") return; // spazio/invio attivano link e pulsanti
    }
    const next = ["ArrowDown", "PageDown", " "].includes(event.key);
    const prev = ["ArrowUp", "PageUp"].includes(event.key);
    if (!next && !prev && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    if (event.key === "Home") goTo(0);
    else if (event.key === "End") goTo(total - 1);
    else goTo(active + (next ? 1 : -1));
  };

  // Al cambio di filtro si riparte dalla prima storia; il Feed prende subito i tasti freccia.
  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0 });
    viewportRef.current?.focus({ preventScroll: true });
  }, [data.area, total > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = total ? Math.min(active, total - 1) : 0;

  return (
    <main className="feed-screen">
      <header className="feed-top">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <p role="status" aria-live="polite" className="text-[1rem] font-bold tabular-nums text-feed-accent">
            {total > 0 && (
              <>
                <span aria-hidden="true">{pad(shown + 1)} / {pad(total)}</span>
                <span className="sr-only">Storia {shown + 1} di {total}</span>
              </>
            )}
          </p>
          <span className="wordmark">Eddy</span>
          <Link href="/" aria-label="Chiudi il Feed e torna a Oggi" className="feed-close">
            <X aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </Link>
        </div>
        <div role="group" aria-label="Notizie da mostrare" className="feed-filter">
          {areaFilters.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={data.area === id} onClick={() => setArea(id)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {total === 0 ? (
        <div className="flex min-h-[100dvh] items-center justify-center pt-24">
          <DataNotice
            tone="dark"
            kind={status === "loading" ? "loading" : status === "error" ? "error" : "empty"}
            message="Nessuna storia per questo filtro. Prova Tutto."
          />
        </div>
      ) : (
        <div
          ref={viewportRef}
          tabIndex={0}
          aria-label="Storie del Feed. Usa le frecce su e giù per passare da una storia all’altra."
          className="feed-viewport-dark"
          onScroll={onScroll}
          onKeyDown={onKeyDown}
        >
          {list.map((story, index) => (
            <FeedCard key={story.id} story={story} index={index} total={total} />
          ))}
        </div>
      )}
    </main>
  );
}

function FeedCard({ story, index, total }: { story: Story; index: number; total: number }) {
  const titleId = `feed-${story.id}`;
  return (
    <section aria-labelledby={titleId} aria-roledescription="storia" aria-label={`Storia ${index + 1} di ${total}`} className="feed-card">
      <div className="feed-media">
        <StoryImage src={story.image} credit={story.imageCredit} tone={toneOf(story.id)} />
        <span className="absolute bottom-3.5 left-3.5 rounded-full bg-[rgb(40_44_42/0.72)] px-4 py-2 text-[0.875rem] font-bold text-surface">
          {categoryLabel(story.category)}
        </span>
      </div>

      <div className="mt-6 min-h-0 flex-1">
        <h2 id={titleId} className="feed-title">{story.title}</h2>
        {story.summary[0] && <p className="mt-2.5 line-clamp-3 text-body text-feed-muted">{story.summary[0].text}</p>}
        <p className="mt-3 text-label font-semibold text-feed-subtle">
          {story.nSources > 1 ? `${story.nSources} fonti` : story.sources[0]?.name} ·{" "}
          {index === total - 1 ? "Fine della selezione" : "Scorri per la storia successiva"}
        </p>
      </div>

      <div className="mt-4 flex items-stretch gap-2.5">
        <Link href={storyHref(story.id)} className="feed-read">
          Leggi la storia
          <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-full bg-accent text-surface">
            <ArrowRight className="size-4.5" strokeWidth={2.4} />
          </span>
        </Link>
        <SaveLaterButtons storyId={story.id} card={snapshotOf(story)} look="dark" />
      </div>
    </section>
  );
}
