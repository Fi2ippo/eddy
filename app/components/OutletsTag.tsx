import { Newspaper } from "lucide-react";
import { outletsLabel } from "../lib/stories";

type OutletsTagProps = {
  count: number;
  /** "light": su fondo chiaro; "photo": sopra una foto. */
  look?: "light" | "photo";
};

const LOOKS = {
  light: "bg-accent-soft text-accent-soft-foreground",
  photo: "bg-overlay text-on-photo",
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
