import ProfilePreferences from "../components/ProfilePreferences";

export default function ProfilePage() {
  return (
    <main className="navigation-page reading-container">
      <header>
        <h1 className="text-display">Profilo</h1>
        <p className="mt-3 text-body text-muted">Il tuo spazio, le tue preferenze.</p>
      </header>
      <ProfilePreferences />
    </main>
  );
}
