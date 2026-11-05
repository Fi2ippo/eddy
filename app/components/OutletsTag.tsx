import { Newspaper } from "lucide-react";
import { outletsLabel } from "../lib/stories";

type OutletsTagProps = {
  count: number;
  /** "light": su fondo chiaro; "dark": nel Feed scuro; "photo": sopra una foto. */
  look?: "light" | "dark" | "photo";
};

const LOOKS = {
  light: "bg-accent-soft text-accent-soft-foreground",
  dark: "bg-[rgb(255_255_255/0.1)] text-feed-accent",
  photo: "bg-[rgb(30_34_32/0.62)] text-surface",
};

// Pillola "4 testate": quante testate diverse raccontano la storia.
export default function OutletsTag({ count, look = "light" }: OutletsTagProps) {
  return (
    <span className={`inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-label ${LOOKS[look]}`}>
      <Newspaper aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
      {outletsLabel(count)}
    </span>
  );
}
