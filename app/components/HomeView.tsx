"use client";

import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { editorialInterests } from "../data/editorial-interests";
import { toggleStoryList, usePersonalData } from "../lib/personal-store";
import {
  byArea,
  byRecency,
  byRelevance,
  categoryLabel,
  frontPage,
  outletCount,
  outletNames,
  outletsShort,
  snapshotOf,
  storyHref,
  timeAgo,
  toneOf,
  useNow,
  useStories,
  type Story,
} from "../lib/stories";
import DataNotice from "./DataNotice";
import OutletsTag from "./OutletsTag";
import StoryImage from "./StoryImage";
import TimeAgo from "./TimeAgo";

const PAGE = 20;
const longDate = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function greeting(now: number) {
  const h = new Date(now).getHours();
  return h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
}

// Home "Oggi": intestazione con saluto e chip, carosello "Prima pagina", fila dei temi, "Ultime notizie".
export default function HomeView() {
  const { status, stories, generated } = useStories();
  const { data } = usePersonalData();
  const now = useNow();
  const [theme, setTheme] = useState("tutti");
  const [shown, setShown] = useState(PAGE);
  const ref = now ?? (generated ? Date.parse(generated) : 0);

  const visible = byArea(stories, data.area);
  const top = ref ? frontPage(stories, data.area, ref) : [];
  const topIds = new Set(top.map((t) => t.story.id));
  const list =
    theme === "tutti"
      ? byRecency(visible.filter((s) => !topIds.has(s.id)))
      : byRelevance(visible.filter((s) => s.category === theme), ref); // solo la categoria principale: i temi secondari sono meno affidabili
  const outlets = new Set(visible.flatMap(outletNames)).size;

  const pickTheme = (id: string) => {
    setTheme(id);
    setShown(PAGE);
  };

  return (
    <main className="navigation-page reading-container">
      <header className="text-center">
        <span className="wordmark">Eddy</span>
        <p className="mt-5 text-label font-bold uppercase tracking-[0.08em] text-accent" suppressHydrationWarning>
          {now ? capitalize(longDate.format(new Date(now))) : " "}
        </p>
        <h1 className="mt-1.5 text-display" suppressHydrationWarning>{now ? greeting(now) : "Oggi"}</h1>
        {generated && stories.length > 0 && (
          <div className="mt-3.5 flex flex-wrap justify-center gap-2">
            <span className="home-chip">
              <TimeAgo iso={generated} prefix="Aggiornato " />
            </span>
            <span className="home-chip">
              {visible.length} storie · {outlets} testate
            </span>
          </div>
        )}
        {data.area !== "tutto" && (
          <p className="mt-2.5 text-label text-muted">Solo notizie {data.area === "italia" ? "dall’Italia" : "dal mondo"} · si cambia nel Profilo</p>
        )}
      </header>

      {stories.length === 0 ? (
        <DataNotice kind={status === "error" ? "error" : "loading"} />
      ) : (
        <>
          {top.length > 0 && (
            <section aria-labelledby="front-title" className="mt-7">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id="front-title" className="text-section">Prima pagina</h2>
                <span className="text-label text-muted">{top.length} storie</span>
              </div>
              <FrontPage items={top.map((t) => t.story)} now={now} />
            </section>
          )}

          <div role="toolbar" aria-label="Filtra per tema" className="theme-rail mt-7">
            {[{ id: "tutti", label: "Tutti" }, ...editorialInterests].map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={theme === id} onClick={() => pickTheme(id)}>
                {label}
              </button>
            ))}
          </div>

          <section aria-labelledby="latest-title" className="mt-4">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 id="latest-title" className="text-section">
                {theme === "tutti" ? "Ultime notizie" : `${categoryLabel(theme)}: le più rilevanti`}
              </h2>
              <span className="text-label text-muted">{list.length} storie</span>
            </div>
            {list.length === 0 ? (
              <DataNotice kind="empty" message={theme === "tutti" ? "Per ora non ci sono altre storie." : "Nessuna storia su questo tema in questo momento."} />
            ) : (
              <>
                <ul className="flex flex-col gap-2.5">
                  {list.slice(0, shown).map((story) => (
                    <li key={story.id}>
                      <NewsRow story={story} />
                    </li>
                  ))}
                </ul>
                {list.length > shown && (
                  <button type="button" className="more-button mt-4" onClick={() => setShown((n) => n + PAGE)}>
                    Mostra altre {Math.min(PAGE, list.length - shown)} storie
                    <span className="font-semibold text-muted"> (ne restano {list.length - shown})</span>
                  </button>
                )}
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}

// ------------------------------------------------------------ carosello "Prima pagina"
function FrontPage({ items, now }: { items: Story[]; now: number | null }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const step = () => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    return card ? card.offsetWidth + 12 : 1;
  };
  const go = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(items.length - 1, i));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: target * step(), behavior: reduce ? "auto" : "smooth" });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    go(index + (event.key === "ArrowRight" ? 1 : -1));
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carosello"
        aria-label={`Prima pagina, storia ${index + 1} di ${items.length}. Usa le frecce sinistra e destra.`}
        className="front-track"
        onKeyDown={onKeyDown}
        onScroll={(e) => setIndex(Math.max(0, Math.min(items.length - 1, Math.round(e.currentTarget.scrollLeft / step()))))}
      >
        {items.map((story, i) => (
          <article key={story.id} aria-label={`${i + 1} di ${items.length}`} className="front-card">
            <Link href={storyHref(story.id)} className="block">
              <div className="relative h-52 overflow-hidden rounded-media bg-media">
                <StoryImage src={story.image} credit={story.imageCredit} tone={toneOf(story.id)} creditPosition="bottom-left" />
                <span className="absolute left-3 top-3 rounded-full bg-[rgb(30_34_32/0.62)] px-3 py-1.5 text-label text-surface">
                  {categoryLabel(story.category)}
                </span>
                <span className="absolute right-3 top-3">
                  <OutletsTag count={outletCount(story)} look="photo" />
                </span>
              </div>
              <div className="px-2 pb-2 pt-3.5">
                <p className="truncate text-label text-accent">{outletsShort(story)}</p>
                <h3 className="mt-1 line-clamp-3 text-heading-3 text-[1.1875rem]">{story.title}</h3>
                <p className="mt-2 text-label font-semibold text-muted" suppressHydrationWarning>
                  {now ? `Aggiornata ${timeAgo(story.updated, now)}` : " "}
                </p>
              </div>
            </Link>
          </article>
        ))}
      </div>
      <button type="button" aria-label="Storia precedente" className="front-arrow left-1" disabled={index === 0} onClick={() => go(index - 1)}>
        <ChevronLeft aria-hidden="true" className="size-5" />
      </button>
      <button type="button" aria-label="Storia successiva" className="front-arrow right-1" disabled={index >= items.length - 1} onClick={() => go(index + 1)}>
        <ChevronRight aria-hidden="true" className="size-5" />
      </button>
      <div aria-hidden="true" className="mt-3 flex justify-center gap-1.5">
        {items.map((s, i) => (
          <i key={s.id} className={`block h-2 rounded-full transition-all ${i === index ? "w-5 bg-accent" : "w-2 bg-[#cfd8cf]"}`} />
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ riga di "Ultime notizie"
function NewsRow({ story }: { story: Story }) {
  const { data, ready } = usePersonalData();
  const saved = Boolean(data.stories[story.id]?.savedAt);
  const titleId = `row-${story.id}`;
  return (
    <article aria-labelledby={titleId} className="relative rounded-card-sm bg-surface p-4 shadow-card-sm">
      <p className="flex items-center gap-2 text-label">
        <span className="min-w-0 truncate text-accent">{outletsShort(story)}</span>
        <span aria-hidden="true" className="text-muted">·</span>
        <TimeAgo iso={story.updated} className="flex-none font-semibold text-muted" />
      </p>
      <h3 id={titleId} className="mt-1.5 text-heading-3">
        <Link href={storyHref(story.id)} className="after:absolute after:inset-0 after:rounded-card-sm">
          {story.title}
        </Link>
      </h3>
      {story.summary[0] && <p className="mt-1.5 line-clamp-2 text-secondary text-muted">{story.summary[0].text}</p>}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-label text-muted-strong">{categoryLabel(story.category)}</span>
        <OutletsTag count={outletCount(story)} />
        <button
          type="button"
          disabled={!ready}
          aria-pressed={saved}
          aria-label={`Salva: ${story.title}`}
          className="round-toggle relative z-10 ml-auto size-11"
          onClick={() => toggleStoryList(story.id, "savedAt", snapshotOf(story))}
        >
          <Bookmark aria-hidden="true" className="size-5" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
