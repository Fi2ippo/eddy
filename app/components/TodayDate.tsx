"use client";

import { useSyncExternalStore } from "react";

const formatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "short",
  day: "numeric",
  month: "long",
});

// La data non cambia mentre la pagina è aperta: nessun aggiornamento da ascoltare.
const subscribe = () => () => {};

function getTodayLabel() {
  const label = formatter.format(new Date()); // es. "mer 4 novembre"
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Il sito è statico: la data va calcolata nel browser, non al momento della build.
// Prima che sia pronta (e per chi usa uno screen reader) il titolo dice "Oggi".
export default function TodayDate({ className }: { className?: string }) {
  const label = useSyncExternalStore(subscribe, getTodayLabel, () => null);

  return (
    <h1 className={className}>
      {label ? (
        <>
          <span className="sr-only">Oggi, </span>
          {label}
        </>
      ) : (
        "Oggi"
      )}
    </h1>
  );
}
