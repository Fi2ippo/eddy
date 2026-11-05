"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Torna alla schermata da cui si è arrivati (Oggi o Feed).
// Se la pagina è stata aperta direttamente (es. da un link), porta a Oggi.
export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Torna indietro"
      className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-surface text-foreground shadow-[0_1px_3px_rgb(23_25_28/0.12)]"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
    >
      <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.2} />
    </button>
  );
}
