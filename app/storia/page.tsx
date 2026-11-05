import type { Metadata } from "next";
import { Suspense } from "react";
import StoryDetail from "../components/StoryDetail";

export const metadata: Metadata = { title: "Storia · Eddy" };

// Una sola pagina per tutte le storie: l'id arriva dall'indirizzo (/storia?id=…).
export default function StoryPage() {
  return (
    <Suspense>
      <StoryDetail />
    </Suspense>
  );
}
