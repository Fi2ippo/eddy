"use client";

import { BarChart3, Check, ChevronRight, Compass, SlidersHorizontal, Type, X } from "lucide-react";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { editorialInterests } from "../data/editorial-interests";
import { areaFilters, textSizes } from "../lib/personal-data";
import { clearPersonalData, setArea, setTextSize, toggleInterest, usePersonalData } from "../lib/personal-store";
import { categoryLabel } from "../lib/stories";

// Profilo (design/Profilo.dc.html): numeri veri dalla memoria del browser e due pannelli dal basso.
export default function ProfileView() {
  const { data, ready, notice } = usePersonalData();
  const interestsRef = useRef<HTMLDialogElement>(null);
  const settingsRef = useRef<HTMLDialogElement>(null);
  const [confirming, setConfirming] = useState(false);

  const read = Object.values(data.stories).filter((a) => a.readAt);
  const perTopic = new Map<string, number>();
  for (const a of read) {
    if (a.snapshot) perTopic.set(a.snapshot.category, (perTopic.get(a.snapshot.category) ?? 0) + 1);
  }
  const top = [...perTopic.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3);
  const max = top[0]?.[1] ?? 1;

  const picked = editorialInterests.filter(({ id }) => data.interests.includes(id)).map(({ label }) => label);
  const summary =
    picked.length === 0 ? "Nessun tema selezionato"
      : picked.length === 1 ? picked[0]
        : picked.length === 2 ? `${picked[0]}, ${picked[1]}`
          : `${picked[0]}, ${picked[1]} e altri ${picked.length - 2}`;
  const preview = textSizes.find(({ id }) => id === data.textSize)?.fontSize;

  const open = (ref: RefObject<HTMLDialogElement | null>) => {
    setConfirming(false);
    ref.current?.showModal();
  };

  return (
    <main className="navigation-page reading-container">
      <header className="text-center">
        <div className="relative flex h-11 items-center justify-center">
          <span className="wordmark">Eddy</span>
          <button type="button" aria-label="Impostazioni" onClick={() => open(settingsRef)}
            className="absolute right-0 top-0 flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-surface text-foreground shadow-[0_1px_3px_rgb(23_25_28/0.12)]">
            <SlidersHorizontal aria-hidden="true" className="size-5" />
          </button>
        </div>
        <h1 className="mt-3.5 text-display">Profilo</h1>
        <p className="mx-auto mt-2.5 max-w-[19rem] text-body text-muted">Le tue letture e i tuoi temi, custoditi su questo dispositivo.</p>
      </header>

      <section aria-labelledby="p-cur" className="mt-5.5 rounded-card bg-surface p-5 shadow-card">
        <h2 id="p-cur" className="text-center text-[1.375rem] font-extrabold">La tua curiosità</h2>
        <dl className="mt-4 grid grid-cols-2 gap-2.5">
          {[
            { label: "Storie lette", value: read.length },
            { label: "Argomenti esplorati", value: perTopic.size },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col-reverse justify-end rounded-[1.375rem] bg-[#eef3ee] p-4">
              <dt className="mt-2 text-secondary font-semibold text-muted-strong">{label}</dt>
              <dd className="m-0 text-[2.375rem] font-extrabold leading-none tracking-tight text-accent-soft-foreground">
                {ready ? value : "–"}
              </dd>
            </div>
          ))}
        </dl>
        <h3 className="mb-2.5 mt-5 text-[0.9375rem] font-extrabold">I tuoi temi più letti</h3>
        {top.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {top.map(([topic, count]) => (
              <li key={topic} className="grid grid-cols-[6.25rem_minmax(0,1fr)_1.5rem] items-center gap-2.5 text-secondary font-semibold">
                <span>{categoryLabel(topic)}</span>
                <span aria-hidden="true" className="block h-2.5 rounded-full bg-accent-soft">
                  <span className="block h-2.5 rounded-full bg-accent" style={{ width: `${(count / max) * 100}%` }} />
                </span>
                <span className="text-right text-muted-strong">{count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-3 rounded-[1.25rem] bg-background p-3.5">
            <span aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-full bg-accent-soft text-accent">
              <BarChart3 className="size-5.5" />
            </span>
            <p className="text-secondary text-muted-strong">Le tue letture costruiranno qui una panoramica essenziale.</p>
          </div>
        )}
      </section>

      <h2 className="mb-3 mt-7 text-center text-label font-extrabold uppercase tracking-[0.1em] text-accent">Personalizza l’esperienza</h2>
      <div className="flex flex-col gap-2.5">
        <ProfileRow icon={<Compass className="size-6" />} title="I tuoi interessi" detail={ready ? summary : "…"} onClick={() => open(interestsRef)} />
        <ProfileRow icon={<Type className="size-6" />} title="Impostazioni" detail="Testo di lettura, notizie, privacy e dati" onClick={() => open(settingsRef)} />
      </div>
      {notice && <p role="status" className="mt-4 text-center text-secondary text-muted">{notice}</p>}

      <Sheet dialogRef={interestsRef} title="I tuoi interessi">
        <p className="mt-1.5 text-center text-[0.9375rem] text-muted">Scegli i temi che vuoi vedere di più nel Feed. Puoi cambiarli quando vuoi.</p>
        <div role="group" aria-label="Interessi" className="mt-4.5 grid grid-cols-2 gap-2.5">
          {editorialInterests.map(({ id, label }) => {
            const on = data.interests.includes(id);
            return (
              <button key={id} type="button" disabled={!ready} aria-pressed={on} className="interest-chip" onClick={() => toggleInterest(id)}>
                {on && <Check aria-hidden="true" className="size-4.5" strokeWidth={2.6} />}
                {label}
              </button>
            );
          })}
        </div>
        <button type="button" className="pill-button mt-4.5 w-full cursor-pointer border-0" onClick={() => interestsRef.current?.close()}>
          Fatto
        </button>
      </Sheet>

      <Sheet dialogRef={settingsRef} title="Impostazioni">
        <h3 id="set-size" className="mb-2.5 mt-4.5 text-[0.9375rem] font-extrabold">Dimensione del testo di lettura</h3>
        <div role="group" aria-labelledby="set-size" className="grid grid-cols-3 gap-2">
          {textSizes.map(({ id, label }) => (
            <button key={id} type="button" disabled={!ready} aria-pressed={data.textSize === id} className="choice" onClick={() => setTextSize(id)}>
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2.5 rounded-[1.125rem] bg-background p-3.5 leading-normal" style={{ fontSize: preview }}>
          Scegliere una domanda da approfondire, fermarsi su un passaggio, confrontare prospettive.
        </p>
        <p className="mt-2 text-label font-medium text-muted">Cambia solo il testo delle storie, non il resto dell’app.</p>

        <h3 id="set-area" className="mb-2.5 mt-5 text-[0.9375rem] font-extrabold">Notizie da mostrare</h3>
        <div role="group" aria-labelledby="set-area" className="grid grid-cols-3 gap-2">
          {areaFilters.map(({ id, label }) => (
            <button key={id} type="button" disabled={!ready} aria-pressed={data.area === id} className="choice" onClick={() => setArea(id)}>
              {label}
            </button>
          ))}
        </div>

        <h3 className="mb-1.5 mt-5 text-[0.9375rem] font-extrabold">Privacy e dati</h3>
        <p className="text-[0.9375rem] text-muted">
          Non hai un account Eddy e nessuno ti traccia. I tuoi interessi, le storie salvate e quelle lette restano solo in
          questo browser: non arrivano a noi e non passano da un dispositivo all’altro.
        </p>
        {!confirming ? (
          <button type="button" disabled={!ready} className="danger-button mt-4" onClick={() => setConfirming(true)}>
            Cancella i dati di Eddy
          </button>
        ) : (
          <div role="alertdialog" aria-labelledby="del-q" aria-describedby="del-d" className="mt-4 rounded-[1.25rem] bg-[#fbf3f3] p-4">
            <p id="del-q" className="font-extrabold">Cancellare tutti i dati di Eddy?</p>
            <p id="del-d" className="mt-1 text-secondary text-muted">
              Spariranno interessi, storie salvate, lista Da leggere, letture e impostazioni. Non si può annullare.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" autoFocus className="choice" onClick={() => setConfirming(false)}>Annulla</button>
              <button type="button" className="danger-button solid" onClick={() => { if (clearPersonalData()) setConfirming(false); }}>
                Sì, cancella
              </button>
            </div>
          </div>
        )}
        {notice && <p role="status" className="mt-3 text-secondary text-muted">{notice}</p>}
      </Sheet>
    </main>
  );
}

function ProfileRow({ icon, title, detail, onClick }: { icon: ReactNode; title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-haspopup="dialog"
      className="flex w-full cursor-pointer items-center gap-3.5 rounded-card-sm border-0 bg-surface p-3.5 text-left text-foreground shadow-card-sm">
      <span aria-hidden="true" className="flex size-13 flex-none items-center justify-center rounded-[1.125rem] bg-accent-soft text-accent">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.0625rem] font-extrabold">{title}</span>
        <span className="mt-0.5 block text-secondary text-muted-strong">{detail}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 flex-none text-muted-strong" strokeWidth={2.2} />
    </button>
  );
}

// Pannello dal basso: si chiude con Esc (comportamento del <dialog>), toccando fuori o con la X.
function Sheet({ dialogRef, title, children }: { dialogRef: RefObject<HTMLDialogElement | null>; title: string; children: ReactNode }) {
  const titleId = `sheet-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="sheet"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close(); // tocco sullo sfondo scuro
      }}
    >
      <div className="sheet-body">
        <div aria-hidden="true" className="sheet-handle" />
        <div className="relative flex min-h-11 items-center justify-center">
          <h2 id={titleId} className="text-[1.375rem] font-extrabold">{title}</h2>
          <button type="button" aria-label="Chiudi" className="sheet-close" onClick={() => dialogRef.current?.close()}>
            <X aria-hidden="true" className="size-5" strokeWidth={2.2} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
