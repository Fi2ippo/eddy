import { Bookmark, BookOpen, History } from "lucide-react";
import LibraryEmptyState from "../components/LibraryEmptyState";
import LibrarySections from "../components/LibrarySections";
import { demoStories } from "../data/demo-stories";

export default function LibraryPage() {
  return (
    <main className="navigation-page reading-container">
      <header>
        <h1 className="text-display">Libreria</h1>
        <p className="mt-3 text-body text-muted">
          Uno spazio per ritrovare ciò che conta.
        </p>
      </header>
      <LibrarySections
        stories={demoStories.map(({ id, category, title, description }) => ({ id, category, title, description }))}
        panels={[
          <LibraryEmptyState
            key="salvati"
            title="Non hai ancora salvato nessuna storia."
            description="Le storie che sceglierai di conservare saranno disponibili qui."
            icon={<Bookmark className="size-8" focusable="false" />}
          />,
          <LibraryEmptyState
            key="recenti"
            title="Nessuna lettura recente."
            description="Qui potrai ritrovare le storie che hai letto."
            icon={<History className="size-8" focusable="false" />}
          />,
          <LibraryEmptyState
            key="da-leggere"
            title="La tua lista di lettura è vuota."
            description="Le storie che vorrai leggere più tardi saranno raccolte qui."
            icon={<BookOpen className="size-8" focusable="false" />}
          />,
        ]}
      />
    </main>
  );
}
