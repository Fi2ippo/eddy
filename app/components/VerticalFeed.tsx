"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type VerticalFeedProps = {
  children: ReactNode;
  total: number;
};

export default function VerticalFeed({ children, total }: VerticalFeedProps) {
  const viewportRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const stories = Array.from(
      viewport.querySelectorAll<HTMLElement>("[data-feed-story]"),
    );
    let intersectionObserver: IntersectionObserver | undefined;
    let observedHeight = 0;

    const updateActiveStory = () => {
      const bounds = viewport.getBoundingClientRect();
      const center = bounds.top + viewport.clientHeight / 2;
      const index = stories.findIndex((story) => {
        const rect = story.getBoundingClientRect();
        return rect.top <= center && rect.bottom > center;
      });
      if (index >= 0) setActiveIndex(index);
    };

    const measure = () => {
      const height = viewport.clientHeight;
      if (height <= 0) return;

      // Se una storia è più alta della viewport, lascia libera la lettura.
      viewport.dataset.longContent = String(
        stories.some((story) => story.getBoundingClientRect().height > height + 1),
      );

      if (height === observedHeight) return;
      observedHeight = height;
      intersectionObserver?.disconnect();

      // Una fascia centrale di 1px cambia storia solo al suo attraversamento.
      // I margini verticali sono in pixel: le percentuali IO dipendono dalla larghezza.
      const top = Math.floor(height / 2);
      intersectionObserver = new IntersectionObserver(updateActiveStory, {
        root: viewport,
        rootMargin: `-${top}px 0px -${height - top - 1}px 0px`,
        threshold: 0,
      });
      stories.forEach((story) => intersectionObserver?.observe(story));
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    stories.forEach((story) => resizeObserver.observe(story));
    measure();

    return () => {
      intersectionObserver?.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <main className="feed-shell">
      <header className="feed-header reading-container">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-heading-3">Feed</h1>
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-secondary text-accent tabular-nums"
          >
            <span aria-hidden="true">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </span>
            <span className="sr-only">
              Storia {activeIndex + 1} di {total}
            </span>
          </p>
        </div>
        <p className="mt-2 text-caption text-muted">Contenuti dimostrativi</p>
        <p id="feed-instructions" className="sr-only">
          Scorri per leggere le tre storie. Puoi usare anche i tasti Pagina giù e
          Pagina su dopo aver portato il focus nell’area di lettura.
        </p>
      </header>
      <section
        ref={viewportRef}
        tabIndex={0}
        aria-label="Storie del Feed"
        aria-describedby="feed-instructions"
        className="feed-viewport"
      >
        {children}
      </section>
    </main>
  );
}
