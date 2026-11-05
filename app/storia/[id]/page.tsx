import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackButton from "../../components/BackButton";
import StoryActionBar from "../../components/StoryActionBar";
import StoryArtwork from "../../components/StoryArtwork";
import StorySummary from "../../components/StorySummary";
import { demoStories, findDemoStory } from "../../data/demo-stories";

type StoryPageProps = {
  params: Promise<{ id: string }>;
};

// Il sito è statico: si crea una pagina per ogni storia al momento della build.
// Gli indirizzi di storie che non esistono mostrano la pagina "non trovata".
export const dynamicParams = false;

export function generateStaticParams() {
  return demoStories.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: StoryPageProps): Promise<Metadata> {
  const story = findDemoStory((await params).id);
  return { title: story ? `${story.title} · Eddy` : "Eddy" };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { id } = await params;
  const story = findDemoStory(id);
  if (!story) notFound();

  // Stessa posizione = stessi colori dell'illustrazione usati nelle altre schermate.
  const tone = demoStories.findIndex((demo) => demo.id === story.id);
  const sourcesLabel = story.sources.length === 1 ? "1 fonte" : `${story.sources.length} fonti`;

  return (
    <main className="navigation-page reading-container">
      <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
        <BackButton />
        <span className="wordmark text-center">Eddy</span>
        <span aria-hidden="true" />
      </header>

      <article aria-labelledby="story-title" className="mt-5">
        <div className="relative h-67.5 overflow-hidden rounded-card bg-media shadow-[0_14px_34px_rgb(23_25_28/0.14)]">
          {story.image ? (
            // Foto in hotlink dalla testata: mai riscaricata né ospitata da Eddy.
            // eslint-disable-next-line @next/next/no-img-element -- next/image la ricopierebbe sul nostro server
            <img
              src={story.image}
              alt=""
              referrerPolicy="no-referrer"
              className="block size-full object-cover"
            />
          ) : (
            <StoryArtwork tone={tone} showLabel={false} />
          )}
          <span className="absolute left-3.5 top-3.5 rounded-full bg-[rgb(30_34_32/0.62)] px-3.5 py-1.5 text-label text-surface">
            {story.category}
          </span>
          <span className="absolute bottom-3.5 left-3.5 rounded-full bg-[rgb(0_0_0/0.55)] px-2.5 py-1 text-caption text-surface">
            {story.image ? `Foto: ${story.imageCredit ?? "testata originale"}` : "Immagine segnaposto"}
          </span>
        </div>

        <h1 id="story-title" className="mb-2 mt-5.5 text-center">
          {story.title}
        </h1>
        <p className="text-center text-secondary font-semibold text-muted-strong">
          {sourcesLabel} · lettura breve · contenuti dimostrativi
        </p>

        <h2 className="mb-3 mt-6.5 text-center text-section">In breve</h2>
        <StorySummary paragraphs={story.summary} />

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
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-label text-accent">Leggi su {source.name}</span>
                  <span className="mt-0.5 block text-[0.9375rem] font-bold leading-snug">
                    {source.title}
                  </span>
                  <span className="sr-only"> (si apre in un’altra scheda)</span>
                </span>
                <ArrowUpRight aria-hidden="true" className="size-5 flex-none text-muted-strong" strokeWidth={2.2} />
              </a>
            </li>
          ))}
        </ul>
      </article>

      <StoryActionBar storyId={story.id} />
    </main>
  );
}
