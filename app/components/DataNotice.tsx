"use client";

import { CloudOff, LoaderCircle, Newspaper } from "lucide-react";
import Link from "next/link";
import { loadStories } from "../lib/stories";

type DataNoticeProps = {
  kind: "loading" | "error" | "empty";
  /** Testo per lo stato "empty" (es. nessuna storia per il filtro scelto). */
  message?: string;
  tone?: "light" | "dark";
};

// Messaggi comuni quando le storie non ci sono: in caricamento, non raggiungibili, nessuna per il filtro.
export default function DataNotice({ kind, message, tone = "light" }: DataNoticeProps) {
  const dark = tone === "dark";
  const Icon = kind === "loading" ? LoaderCircle : kind === "error" ? CloudOff : Newspaper;
  const title =
    kind === "loading" ? "Carico le notizie…" : kind === "error" ? "Le notizie non si sono caricate" : "Nessuna storia qui";
  const text =
    kind === "loading"
      ? "Un momento: Eddy sta raccogliendo le storie di oggi."
      : kind === "error"
        ? "Controlla la connessione e riprova. Le tue storie salvate restano nella Libreria."
        : message ?? "Prova a cambiare il filtro Italia / Mondo.";
  return (
    <div role={kind === "error" ? "alert" : "status"} className="flex flex-col items-center px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className={`flex size-16 items-center justify-center rounded-full ${dark ? "bg-feed-fill text-feed-accent" : "bg-accent-soft text-accent"}`}
      >
        <Icon className={`size-7 ${kind === "loading" ? "animate-spin" : ""}`} />
      </span>
      <h2 className={`mt-5 text-heading-3 ${dark ? "text-feed-fg" : ""}`}>{title}</h2>
      <p className={`mt-2 max-w-xs text-body ${dark ? "text-feed-muted" : "text-muted"}`}>{text}</p>
      {kind === "error" && (
        <button type="button" onClick={() => void loadStories()} className="pill-button mt-6 cursor-pointer border-0">
          Riprova
        </button>
      )}
      {kind === "empty" && !dark && (
        <Link href="/feed" className="pill-button mt-6">
          Vai al Feed
        </Link>
      )}
    </div>
  );
}
