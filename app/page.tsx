import StoryPreview from "./components/StoryPreview";
import TodayDate from "./components/TodayDate";
import { demoStories } from "./data/demo-stories";

export default function Home() {
  const [primaryStory, ...secondaryStories] = demoStories;

  return (
    <main className="navigation-page reading-container">
      <header className="text-center">
        <span className="wordmark">Eddy</span>
        <TodayDate className="mt-5.5 text-display" />
        <p className="mt-3 text-label text-muted">Contenuti dimostrativi</p>
      </header>

      <section aria-label="Storia principale" className="mt-5.5">
        <StoryPreview story={primaryStory} variant="hero" tone={0} />
      </section>

      <section aria-labelledby="other-stories" className="mt-7.5">
        <h2 id="other-stories" className="mb-3.5 text-center text-section">
          Altre due storie
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {secondaryStories.map((story, index) => (
            <StoryPreview key={story.id} story={story} variant="compact" tone={index + 1} />
          ))}
        </div>
      </section>
    </main>
  );
}
