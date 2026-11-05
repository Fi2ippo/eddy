"use client";

import DataNotice from "./components/DataNotice";
import StoryPreview from "./components/StoryPreview";
import TodayDate from "./components/TodayDate";
import { usePersonalData } from "./lib/personal-store";
import { todayPicks, useStories } from "./lib/stories";

export default function Home() {
  const { status, stories } = useStories();
  const { data } = usePersonalData();
  const [primaryStory, ...secondaryStories] = todayPicks(stories, data.area);

  return (
    <main className="navigation-page reading-container">
      <header className="text-center">
        <span className="wordmark">Eddy</span>
        <TodayDate className="mt-5.5 text-display" />
        {data.area !== "tutto" && (
          <p className="mt-3 text-label text-muted">Solo notizie {data.area === "italia" ? "dall’Italia" : "dal mondo"}</p>
        )}
      </header>

      {status === "loading" && stories.length === 0 ? (
        <DataNotice kind="loading" />
      ) : status === "error" && stories.length === 0 ? (
        <DataNotice kind="error" />
      ) : !primaryStory ? (
        <DataNotice kind="empty" message="Nessuna storia per il filtro scelto: puoi cambiarlo nelle Impostazioni del Profilo." />
      ) : (
        <>
          <section aria-label="Storia principale" className="mt-5.5">
            <StoryPreview story={primaryStory} variant="hero" />
          </section>
          {secondaryStories.length > 0 && (
            <section aria-labelledby="other-stories" className="mt-7.5">
              <h2 id="other-stories" className="mb-3.5 text-center text-section">
                {secondaryStories.length === 1 ? "Un’altra storia" : "Altre due storie"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {secondaryStories.map((story) => (
                  <StoryPreview key={story.id} story={story} variant="compact" />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
