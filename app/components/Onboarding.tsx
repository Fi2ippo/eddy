"use client";

import { ArrowLeft, Check, Link2, Newspaper } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { editorialInterests } from "../data/editorial-interests";
import { areaFilters } from "../lib/personal-data";
import { setArea, setOnboardingDone, toggleInterest, usePersonalData } from "../lib/personal-store";
import { ThemeIcon, themeStyle } from "../lib/themes";

const STEPS = 3;

// Introduzione al primo avvio: tre schermi a tutto schermo (Benvenuto, Interessi, Italia/Mondo).
// Si vede una volta sola (onboardingDone nei dati del browser) e si può rivedere dal Profilo.
// È un <dialog> modale: la tastiera resta dentro, Esc vale come "Salta".
export default function Onboarding() {
  const { data, ready } = usePersonalData();
  const pathname = usePathname();
  // Chi arriva da un link a una storia la legge subito: l'introduzione aspetta la prossima visita.
  const skipHere = pathname.startsWith("/storia");
  const show = ready && !data.onboardingDone && !skipHere;
  return show ? <OnboardingDialog /> : null;
}

function OnboardingDialog() {
  const { data } = usePersonalData();
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // A ogni schermo il lettore di schermo (e la tastiera) ripartono dal titolo.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const finish = () => {
    setOnboardingDone(true);
    window.scrollTo(0, 0);
  };
  const picked = data.interests.length;
  const next = step === 0 ? "Avanti" : step === 1 ? (picked ? "Avanti" : "Scegli almeno un tema") : "Inizia a leggere";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="onb-title"
      className="onboarding"
      onCancel={(event) => {
        event.preventDefault();
        finish();
      }}
    >
      <div className="onboarding-body">
        <div className="flex min-h-11 items-center justify-between">
          {step > 0 ? (
            <button type="button" className="onboarding-link" onClick={() => setStep(step - 1)}>
              <ArrowLeft aria-hidden="true" className="size-4.5" strokeWidth={2.4} />
              Indietro
            </button>
          ) : (
            <span className="wordmark">Eddy</span>
          )}
          <button type="button" className="onboarding-link" onClick={finish}>
            Salta
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-6">
          <p className="text-center text-label font-bold text-muted">Passo {step + 1} di {STEPS}</p>

          {step === 0 && (
            <>
              <div aria-hidden="true" className="onboarding-art">
                {["ANSA", "Il Post", "BBC"].map((name, i) => (
                  <span key={name} className="onboarding-outlet" style={{ rotate: `${(i - 1) * 6}deg` }}>
                    <Newspaper className="size-4" strokeWidth={2.2} />
                    {name}
                  </span>
                ))}
                <span className="onboarding-story">
                  <Link2 className="size-4" strokeWidth={2.4} />
                  Un fatto, 3 testate
                </span>
              </div>
              <h1 id="onb-title" ref={headingRef} tabIndex={-1} className="outline-none mt-6 text-center">
                Benvenuto su Eddy
              </h1>
              <p className="mx-auto mt-3 max-w-sm text-center text-body text-muted-strong">
                Eddy raccoglie in un solo posto lo stesso fatto raccontato da più testate, con i link agli articoli
                originali.
              </p>
              <p className="mx-auto mt-2 max-w-sm text-center text-body text-muted-strong">
                Nessun testo è scritto dall’intelligenza artificiale: leggi solo brevi frasi delle testate, ognuna con il
                suo nome.
              </p>
            </>
          )}

          {step === 1 && (
            <>
              <h1 id="onb-title" ref={headingRef} tabIndex={-1} className="outline-none mt-2 text-center">
                Cosa ti interessa?
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-center text-body text-muted-strong">
                Scegli almeno un tema: lo vedrai di più nel Feed. Puoi cambiarli dal Profilo.
              </p>
              <div role="group" aria-label="Temi" className="mt-5 grid grid-cols-2 gap-2.5">
                {editorialInterests.map(({ id, label }) => {
                  const on = data.interests.includes(id);
                  return (
                    <button key={id} type="button" aria-pressed={on} className="interest-chip" style={themeStyle(id)} onClick={() => toggleInterest(id)}>
                      {on ? <Check aria-hidden="true" className="size-4.5" strokeWidth={2.6} /> : <ThemeIcon id={id} className="size-4.5" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 id="onb-title" ref={headingRef} tabIndex={-1} className="outline-none mt-2 text-center">
                Italia, Mondo o tutto?
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-center text-body text-muted-strong">
                Quali notizie vuoi vedere? Puoi cambiarlo quando vuoi dal Profilo.
              </p>
              <div role="group" aria-label="Notizie da mostrare" className="mt-5 flex flex-col gap-2.5">
                {areaFilters.map(({ id, label }) => (
                  <button key={id} type="button" aria-pressed={data.area === id} className="choice" onClick={() => setArea(id)}>
                    {label === "Tutto" ? "Tutto: Italia e Mondo" : label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div aria-hidden="true" className="flex gap-1.5">
            {Array.from({ length: STEPS }, (_, i) => (
              <i key={i} className={`block h-2 rounded-full transition-all ${i === step ? "w-5 bg-accent" : "w-2 bg-track"}`} />
            ))}
          </div>
          <button
            type="button"
            disabled={step === 1 && picked === 0}
            className="pill-button w-full cursor-pointer border-0 disabled:cursor-default disabled:opacity-60"
            onClick={() => (step < STEPS - 1 ? setStep(step + 1) : finish())}
          >
            {next}
          </button>
        </div>
      </div>
    </dialog>
  );
}
