"use client";

import { Bookmark, ChevronLeft, ChevronRight, ChevronUp, Clock, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent, type WheelEvent } from "react";
import type { StoryField } from "../lib/personal-data";
import { toggleStoryList, usePersonalData } from "../lib/personal-store";
import { ThemeTag, themeStyle } from "../lib/themes";
import { feedOrder, leadText, outletCount, outletNames, outletsShort, snapshotOf, storyHref, toneOf, translatedFrom, useStories, type Story } from "../lib/stories";
import DataNotice from "./DataNotice";
import StoryImage from "./StoryImage";
import TimeAgo from "./TimeAgo";

const OPEN_DISTANCE = 70; // px verso l'alto per aprire la storia

// L'ordine del Feed resta lo stesso per tutta la visita (anche tornando da una storia), finché non arrivano dati nuovi
// o non cambiano gli interessi: così si riprende dal punto in cui si era.
let session: { key: string; ids: string[]; index: number } | null = null;

function sessionOrder(key: string, stories: Story[], compute: () => Story[]) {
  if (session?.key === key) {
    const byId = new Map(stories.map((s) => [s.id, s]));
    return session.ids.map((id) => byId.get(id)).filter((s): s is Story => Boolean(s));
  }
  const ordered = compute();
  session = { key, ids: ordered.map((s) => s.id), index: 0 };
  return ordered;
}

function rememberIndex(i: number) {
  if (session) session.index = i;
}

// Feed a tutto schermo, come le storie di Instagram: si scorre verso sinistra per la storia successiva
// e verso l'alto per leggerla. In fondo: Salva e Da leggere.
export default function FeedView() {
  const { status, stories, generated } = useStories();
  const { data, ready } = usePersonalData();
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; slide: HTMLElement | null; dy: number; dx: number } | null>(null);
  const wheel = useRef({ sum: 0, at: 0 });

  const key = `${generated}|${data.area}|${data.interests.join(",")}`;
  const list = useMemo(() => {
    if (!ready || !stories.length) return [];
    return sessionOrder(key, stories, () => {
      const read = new Set(Object.entries(data.stories).filter(([, a]) => a.readAt).map(([id]) => id));
      const ref = generated ? Date.parse(generated) : 0; // ora dei dati, non dell'orologio: l'ordine non cambia mentre si guarda
      return feedOrder(stories, data.interests, data.area, read, ref);
    });
  }, [key, ready, stories]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = list.length;
  const [active, setActive] = useState(0);
  const shown = Math.min(active, Math.max(0, total - 1));

  // Si riprende dalla storia a cui si era arrivati; il Feed prende subito i tasti freccia.
  useLayoutEffect(() => {
    const t = trackRef.current;
    if (!t || !total) return;
    const start = Math.min(session?.index ?? 0, total - 1);
    t.scrollLeft = start * t.clientWidth;
    setActive(start);
    t.focus({ preventScroll: true });
  }, [total]);

  const goTo = (index: number) => {
    const t = trackRef.current;
    if (!t) return;
    const target = Math.max(0, Math.min(total - 1, index));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollTo({ left: target * t.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };
  const open = (story: Story | undefined) => {
    if (story) router.push(storyHref(story.id));
  };

  const onScroll = () => {
    const t = trackRef.current;
    if (!t || !t.clientWidth) return;
    const i = Math.max(0, Math.min(total - 1, Math.round(t.scrollLeft / t.clientWidth)));
    setActive(i);
    rememberIndex(i);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a, button") && (event.key === " " || event.key === "Enter")) return;
    const k = event.key;
    if (!["ArrowRight", "ArrowLeft", "ArrowUp", "Enter", "Home", "End"].includes(k)) return;
    event.preventDefault();
    if (k === "ArrowUp" || k === "Enter") open(list[shown]);
    else if (k === "Home") goTo(0);
    else if (k === "End") goTo(total - 1);
    else goTo(shown + (k === "ArrowRight" ? 1 : -1));
  };

  // Scorrere verso l'alto: la storia sale con il dito e, oltre OPEN_DISTANCE, si apre.
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const p = event.touches[0];
    touch.current = { x: p.clientX, y: p.clientY, dx: 0, dy: 0, slide: (event.target as HTMLElement).closest(".feed-slide") };
  };
  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const t = touch.current;
    if (!t) return;
    const p = event.touches[0];
    t.dx = p.clientX - t.x;
    t.dy = p.clientY - t.y;
    if (t.slide && t.dy < 0 && Math.abs(t.dy) > Math.abs(t.dx)) t.slide.style.transform = `translateY(${t.dy * 0.45}px)`;
  };
  const onTouchEnd = () => {
    const t = touch.current;
    touch.current = null;
    if (!t?.slide) return;
    const up = -t.dy > OPEN_DISTANCE && Math.abs(t.dy) > Math.abs(t.dx) * 1.5;
    t.slide.style.transition = "transform 200ms ease-out";
    t.slide.style.transform = up ? "translateY(-30%)" : "";
    const slide = t.slide;
    window.setTimeout(() => {
      slide.style.transition = "";
      slide.style.transform = "";
    }, 260);
    if (up) open(list[shown]);
  };
  // Con la rotella o il trackpad: un movimento deciso verso il basso apre la storia.
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || event.deltaY <= 0) return;
    const w = wheel.current;
    const now = Date.now();
    w.sum = now - w.at > 400 ? event.deltaY : w.sum + event.deltaY;
    w.at = now;
    if (w.sum > 120) {
      w.sum = -1e9; // una sola apertura per gesto
      open(list[shown]);
    }
  };

  return (
    <main className="feed-screen">
      {total > 0 && (
        <div className="feed-progress" aria-hidden="true">
          {list.map((s, i) => (
            <i key={s.id} className={i <= shown ? "on" : ""} />
          ))}
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {total > 0 ? `Storia ${shown + 1} di ${total}` : ""}
      </p>
      <Link href="/" aria-label="Chiudi il Feed e torna a Oggi" className="feed-close">
        <X aria-hidden="true" className="size-5" strokeWidth={2.4} />
      </Link>

      {total === 0 ? (
        <div className="flex min-h-[100dvh] items-center justify-center">
          <DataNotice tone="dark" kind={status === "loading" || !ready ? "loading" : status === "error" ? "error" : "empty"} message="Per ora non ci sono storie." />
        </div>
      ) : (
        <>
          <div
            ref={trackRef}
            tabIndex={0}
            aria-label="Storie del Feed. Frecce destra e sinistra per cambiare storia, freccia su per leggerla."
            className="feed-track"
            onScroll={onScroll}
            onKeyDown={onKeyDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onWheel={onWheel}
          >
            {list.map((story, index) => (
              <FeedSlide key={story.id} story={story} index={index} total={total} onOpen={() => open(story)} />
            ))}
          </div>
          <button type="button" aria-label="Storia precedente" className="feed-arrow left-3" disabled={shown === 0} onClick={() => goTo(shown - 1)}>
            <ChevronLeft aria-hidden="true" className="size-6" />
          </button>
          <button type="button" aria-label="Storia successiva" className="feed-arrow right-3" disabled={shown >= total - 1} onClick={() => goTo(shown + 1)}>
            <ChevronRight aria-hidden="true" className="size-6" />
          </button>
        </>
      )}
    </main>
  );
}

function FeedSlide({ story, index, total, onOpen }: { story: Story; index: number; total: number; onOpen: () => void }) {
  const titleId = `feed-${story.id}`;
  const names = outletNames(story);
  return (
    <section aria-labelledby={titleId} aria-roledescription="storia" aria-label={`Storia ${index + 1} di ${total}`} className="feed-slide" style={themeStyle(story.category)}>
      <div className="feed-outlets">
        <span aria-hidden="true" className="flex flex-none">
          {names.slice(0, 4).map((n) => (
            <span key={n} className="feed-mono">{n.replace(/^(the|il|la|lo|l’|l')\s*/i, "").charAt(0).toUpperCase()}</span>
          ))}
        </span>
        <span className="min-w-0 truncate">{outletsShort(story)}</span>
      </div>

      <div className="feed-media">
        <StoryImage src={story.image} credit={story.imageCredit} tone={toneOf(story.id)} />
        <ThemeTag id={story.category} look="solid" className="absolute bottom-3.5 left-3.5" />
      </div>

      <p className="mt-4 text-label font-semibold text-feed-muted">
        {outletCount(story)} {outletCount(story) === 1 ? "testata" : "testate"} · <TimeAgo iso={story.updated} prefix="aggiornata " />
      </p>
      <h2 id={titleId} className="feed-title">{story.title}</h2>
      {translatedFrom(story) && (
        <p className="mt-1.5 truncate text-caption text-feed-subtle">
          {translatedFrom(story)} · Titolo originale: <span lang={story.originalLang ?? "en"}>{story.titleOriginal}</span>
        </p>
      )}
      {leadText(story) && <p className="feed-lead">{leadText(story)}</p>}

      <div className="feed-bottom">
        <FeedToggle story={story} field="savedAt" />
        <button type="button" className="feed-up" onClick={onOpen}>
          <ChevronUp aria-hidden="true" className="feed-up-icon" strokeWidth={2.6} />
          Scorri su per leggere
        </button>
        <FeedToggle story={story} field="readingListAt" />
      </div>
    </section>
  );
}

// Pulsante tondo semplice: Salva oppure Da leggere.
function FeedToggle({ story, field }: { story: Story; field: Extract<StoryField, "savedAt" | "readingListAt"> }) {
  const { data, ready } = usePersonalData();
  const on = Boolean(data.stories[story.id]?.[field]);
  const save = field === "savedAt";
  const Icon = save ? Bookmark : Clock;
  return (
    <button type="button" disabled={!ready} aria-pressed={on} className="feed-round" onClick={() => toggleStoryList(story.id, field, snapshotOf(story))}>
      <span className="feed-round-disc">
        <Icon aria-hidden="true" className="size-5.5" fill={on && save ? "currentColor" : "none"} />
      </span>
      {save ? (on ? "Salvata" : "Salva") : on ? "In lista" : "Da leggere"}
    </button>
  );
}
