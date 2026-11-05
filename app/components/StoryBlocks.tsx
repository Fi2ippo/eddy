import { ArrowUpRight, BookOpenText } from "lucide-react";
import type { ReactNode } from "react";
import type { StoryCompare, StoryContext, StorySummary, StoryTimeline } from "../lib/stories";

// Blocchi di approfondimento della pagina Storia. Tutti i testi sono frasi brevi delle testate (o di Wikipedia),
// sempre con il nome della fonte e il link all'originale.

const dateTime = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 text-center text-section">{title}</h2>
      <div className="rounded-card bg-surface p-5 shadow-card-sm">{children}</div>
    </section>
  );
}

export function SourceLink({ name, url, translated }: { name: string; url: string | null; translated?: boolean }) {
  return (
    <span className="text-label text-muted-strong">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center gap-0.5 text-accent underline-offset-2 hover:underline">
          {name}
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
          <span className="sr-only"> (si apre in un’altra scheda)</span>
        </a>
      ) : (
        name
      )}
      {translated && <span className="font-semibold text-muted"> · tradotto automaticamente</span>}
    </span>
  );
}

export function KeyPoints({ items }: { items: StorySummary[] }) {
  return (
    <Block title="Punti chiave">
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {items.map((item, i) => (
          <li key={i} className="grid grid-cols-[0.5rem_1fr] gap-3">
            <span aria-hidden="true" className="mt-2.5 size-2 rounded-full bg-accent" />
            <div>
              <p className="text-body leading-relaxed">{item.text}</p>
              <SourceLink name={item.source} url={item.url} translated={item.translated} />
            </div>
          </li>
        ))}
      </ul>
    </Block>
  );
}

export function ContextBox({ context }: { context: StoryContext }) {
  return (
    <Block title="Per capire">
      <p className="flex items-center gap-2 text-heading-3">
        <BookOpenText aria-hidden="true" className="size-5 text-accent" />
        {context.title}
      </p>
      <p className="mt-2 text-body leading-relaxed">{context.summary}</p>
      <p className="mt-3 text-label text-muted">
        Da{" "}
        <a href={context.url} target="_blank" rel="noopener noreferrer" className="font-bold text-accent underline underline-offset-2">
          Wikipedia<span className="sr-only"> (si apre in un’altra scheda)</span>
        </a>{" "}
        · licenza{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.it" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          CC BY-SA
        </a>
      </p>
    </Block>
  );
}

export function CompareBlock({ compare }: { compare: StoryCompare }) {
  return (
    <Block title="Confronto tra le testate">
      {compare.common.length > 0 && (
        <>
          <h3 className="text-label font-extrabold uppercase tracking-[0.06em] text-muted-strong">In comune nei titoli</h3>
          <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
            {compare.common.map((c) => (
              <li key={c.word} className="rounded-full bg-accent-soft px-3 py-1.5 text-secondary font-bold text-accent-soft-foreground">
                {c.word} <span className="font-semibold text-muted-strong">{c.count}/{compare.outlets}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {compare.unique.length > 0 && (
        <>
          <h3 className={`${compare.common.length ? "mt-5" : ""} text-label font-extrabold uppercase tracking-[0.06em] text-muted-strong`}>
            Solo in alcune testate
          </h3>
          <ul className="mt-2 flex list-none flex-col gap-2.5 p-0">
            {compare.unique.map((u) => (
              <li key={u.text} className="border-b border-divider pb-2.5 last:border-0 last:pb-0">
                <p className="text-body font-bold">{u.text}</p>
                <p className="flex flex-wrap gap-x-2">
                  {u.sources.map((s) => (
                    <SourceLink key={s.name} name={s.name} url={s.url} />
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-4 text-label font-medium text-muted">
        Confronto automatico dei titoli: mostra cosa dicono tutte e cosa solo alcune, non stabilisce chi ha ragione.
      </p>
    </Block>
  );
}

const KIND_LABEL = { first: "Prima notizia", new: "Nuovi elementi", correction: "Rettifica o smentita", last: "Ultimo aggiornamento" };

export function TimelineBlock({ timeline }: { timeline: StoryTimeline }) {
  return (
    <Block title="Cronologia">
      <ol className="m-0 list-none p-0">
        {timeline.items.map((item, i) => (
          <li key={i} className="relative border-l-2 border-accent-soft pb-4 pl-4 last:pb-0">
            <span aria-hidden="true" className={`absolute -left-[0.4375rem] top-1 size-3 rounded-full ${item.kind === "new" ? "bg-accent" : "border-2 border-accent bg-surface"}`} />
            <p className="flex flex-wrap items-center gap-x-2 text-label">
              <time dateTime={item.time} className="font-bold text-muted-strong">{dateTime.format(new Date(item.time))}</time>
              <span className={item.kind === "new" ? "rounded-full bg-accent px-2 py-0.5 font-bold text-on-accent" : "font-semibold text-muted"}>
                {KIND_LABEL[item.kind]}
              </span>
            </p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-body">
              <strong>{item.source}</strong> {item.title}
              <span className="sr-only"> (si apre in un’altra scheda)</span>
            </a>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-label font-medium text-muted">
        Ricostruita dai titoli in ordine di pubblicazione
        {timeline.repeats > 0 && `; altri ${timeline.repeats} ${timeline.repeats === 1 ? "articolo riprende" : "articoli riprendono"} quanto già noto`}.
        «Nuovi elementi» indica un titolo con nomi o numeri che i precedenti non avevano.
      </p>
    </Block>
  );
}
