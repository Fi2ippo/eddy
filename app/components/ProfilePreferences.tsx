"use client";

import { Check } from "lucide-react";
import { useRef } from "react";
import { editorialInterests } from "../data/editorial-interests";
import { textSizes } from "../lib/personal-data";
import { clearPersonalData, setTextSize, toggleInterest, usePersonalData } from "../lib/personal-store";

export default function ProfilePreferences() {
  const { data, ready, notice } = usePersonalData();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activities = [
    { label: "Storie salvate", field: "savedAt" },
    { label: "Storie da leggere", field: "readingListAt" },
    { label: "Letture recenti", field: "readAt" },
  ] as const;

  return (
    <div className="mt-12 space-y-12">
      <section aria-labelledby="profile-interests">
        <h2 id="profile-interests">I tuoi interessi</h2>
        <p className="mt-3 text-body text-muted">Scegli gli argomenti che ti interessano di più.</p>
        <div role="group" aria-label="Interessi editoriali" className="mt-6 flex flex-wrap gap-2">
          {editorialInterests.map(({ id, label }) => {
            const selected = data.interests.includes(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                disabled={!ready}
                className={`interest-button text-secondary ${selected ? "border-accent bg-accent-soft font-semibold text-accent-soft-foreground" : "border-border text-muted"}`}
                onClick={() => toggleInterest(id)}
              >
                <Check aria-hidden="true" className={`size-4 shrink-0 ${selected ? "" : "invisible"}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-secondary text-muted">
          {!ready ? "Caricamento delle preferenze…" : data.interests.length === 0 ? "Nessun interesse selezionato." : "Puoi modificare le tue scelte in qualsiasi momento."}
        </p>
        <p className="mt-3 text-secondary text-muted">
          Le tue preferenze sono salvate in questo browser. La personalizzazione delle notizie arriverà in una fase successiva.
        </p>
      </section>

      {/* Provvisorio: diventerà il pannello Impostazioni quando ridisegneremo il Profilo. */}
      <section aria-labelledby="profile-text-size">
        <h2 id="profile-text-size">Dimensione del testo di lettura</h2>
        <div role="group" aria-labelledby="profile-text-size" className="mt-4 grid grid-cols-3 gap-2">
          {textSizes.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              disabled={!ready}
              aria-pressed={data.textSize === id}
              className="toggle-pill min-h-12.5"
              onClick={() => setTextSize(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-background p-3.5 text-body" style={{ fontSize: textSizes.find(({ id }) => id === data.textSize)?.fontSize }}>
          Scegliere una domanda da approfondire, fermarsi su un passaggio, confrontare prospettive.
        </p>
        <p className="mt-2 text-secondary text-muted">Cambia solo il testo delle storie, non il resto dell’app.</p>
      </section>

      <section aria-labelledby="profile-activity">
        <h2 id="profile-activity">La tua attività</h2>
        <dl className="mt-4 divide-y divide-border">
          {activities.map(({ label, field }) => (
            <div key={field} className="flex items-baseline justify-between gap-6 py-4">
              <dt className="text-body text-muted">{label}</dt>
              <dd className="text-heading-3 tabular-nums">
                {ready ? Object.values(data.stories).filter((story) => story[field]).length : "—"}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="profile-privacy">
        <h2 id="profile-privacy">Dati e privacy</h2>
        <p className="mt-3 text-body text-muted">
          Non hai un account Eddy. Interessi, salvataggi, lista Da leggere e letture che contrassegni sono conservati localmente in questo browser, senza sincronizzazione fra dispositivi.
        </p>
        <p className="mt-3 text-body text-muted">
          Se cancelli la memoria del sito o cambi browser o dispositivo, questi dati possono andare persi.
        </p>
        <button type="button" disabled={!ready} className="story-action mt-6 text-secondary font-semibold text-accent underline underline-offset-4" onClick={() => dialogRef.current?.showModal()}>
          Cancella i dati locali di Eddy
        </button>
        {notice && <p role="status" className="mt-3 text-secondary text-muted">{notice}</p>}
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-local-title"
        aria-describedby="delete-local-description"
        className="local-data-dialog"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <h2 id="delete-local-title">Cancellare i dati locali di Eddy?</h2>
        <p id="delete-local-description" className="mt-4 text-body text-muted">
          Verranno cancellati gli interessi selezionati, le storie salvate, la lista Da leggere e la cronologia delle letture di Eddy in questo browser. L’operazione non può essere annullata.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="confirmation-button border-border text-body" onClick={() => dialogRef.current?.close()}>
            Annulla
          </button>
          <button type="button" className="confirmation-button border-accent text-body font-semibold text-accent" onClick={() => {
            if (clearPersonalData()) dialogRef.current?.close();
          }}>
            Conferma cancellazione
          </button>
        </div>
        {notice && <p role="status" className="mt-3 text-secondary text-muted">{notice}</p>}
      </dialog>
    </div>
  );
}
