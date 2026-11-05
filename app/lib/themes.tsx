import { BookOpen, ChartLine, Cpu, FlaskConical, Landmark, Leaf, PenTool, Users, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { editorialInterests } from "../data/editorial-interests";

// Colori e icone degli 8 temi. I colori stanno in globals.css (--color-t-<tema>, -soft, -ink):
// qui si passano al componente come variabili --t, --t-soft, --t-ink, che le classi .theme-* usano.
const ICONS: Record<string, LucideIcon> = {
  tecnologia: Cpu,
  economia: ChartLine,
  politica: Landmark,
  scienza: FlaskConical,
  cultura: BookOpen,
  societa: Users,
  ambiente: Leaf,
  design: PenTool,
};

const KNOWN = new Set<string>(editorialInterests.map(({ id }) => id));

export function themeStyle(id: string): CSSProperties {
  const t = KNOWN.has(id) ? id : "societa";
  return {
    "--t": `var(--color-t-${t})`,
    "--t-soft": `var(--color-t-${t}-soft)`,
    "--t-ink": `var(--color-t-${t}-ink)`,
  } as CSSProperties;
}

export function ThemeIcon({ id, className = "size-4" }: { id: string; className?: string }) {
  const Icon = ICONS[id] ?? Users;
  return <Icon aria-hidden="true" className={className} strokeWidth={2.2} />;
}

function labelOf(id: string) {
  return editorialInterests.find((i) => i.id === id)?.label ?? id;
}

type ThemeTagProps = {
  id: string;
  /** "solid": sopra le foto (fondo pieno, testo bianco); "soft": su fondo chiaro; "mark": riga sottile + nome. */
  look?: "solid" | "soft" | "mark";
  className?: string;
};

// Etichetta del tema con il suo colore e la sua icona.
export function ThemeTag({ id, look = "soft", className = "" }: ThemeTagProps) {
  return (
    <span className={`theme-${look} ${className}`} style={themeStyle(id)}>
      {look !== "mark" && <ThemeIcon id={id} className="size-3.5" />}
      {labelOf(id)}
    </span>
  );
}
