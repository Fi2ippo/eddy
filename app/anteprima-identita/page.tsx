import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChartLine,
  ChevronLeft,
  Clock,
  Cpu,
  FlaskConical,
  House,
  Landmark,
  Layers,
  Leaf,
  Newspaper,
  PenTool,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import StoryArtwork from "../components/StoryArtwork";

// Pagina di prova (fase E): 3 direzioni di identità visiva affiancate, per scegliere. Solo in sviluppo.
// I colori sono scritti qui apposta: quando Filippo sceglie, la direzione diventa token in globals.css (fase F).

export const metadata: Metadata = { title: "Anteprima identità · Eddy", robots: { index: false } };

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600", "700", "800"], display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], display: "swap" });

type Theme = { id: string; label: string; icon: LucideIcon; solid: string; tint: string; text: string };

const THEME_META: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "tecnologia", label: "Tecnologia", icon: Cpu },
  { id: "economia", label: "Economia", icon: ChartLine },
  { id: "politica", label: "Politica", icon: Landmark },
  { id: "scienza", label: "Scienza", icon: FlaskConical },
  { id: "cultura", label: "Cultura", icon: BookOpen },
  { id: "societa", label: "Società", icon: Users },
  { id: "ambiente", label: "Ambiente", icon: Leaf },
  { id: "design", label: "Design", icon: PenTool },
];

// tonalità calcolate per avere contrasto ≥ 4.5:1 (testo bianco sulle etichette piene, testo colorato sui chip tenui)
const SHADES: Record<string, Record<string, [string, string, string]>> = {
  edicola: {
    tecnologia: ["#2563EB", "#E5EBF6", "#235DDD"], economia: ["#0F766E", "#E2EDE7", "#0F726B"], politica: ["#DC2626", "#FBE3DF", "#C82323"],
    scienza: ["#7C3AED", "#EFE6F7", "#7C3AED"], cultura: ["#B45309", "#F6E9DB", "#A94E08"], societa: ["#D42673", "#FBE3E9", "#C12269"],
    ambiente: ["#12863D", "#E3F2E3", "#107736"], design: ["#C74B0A", "#FCE9DC", "#B24309"],
  },
  inchiostro: {
    tecnologia: ["#2563EB", "#E5ECFD", "#235DDD"], economia: ["#0F766E", "#E2EFEE", "#0F766E"], politica: ["#DC2626", "#FBE5E5", "#C82323"],
    scienza: ["#7C3AED", "#EFE7FD", "#7C3AED"], cultura: ["#B45309", "#F6EAE1", "#A94E08"], societa: ["#D42673", "#FBE5EF", "#C12269"],
    ambiente: ["#12863D", "#E3F4E9", "#117C38"], design: ["#C74B0A", "#FCEBE2", "#B94609"],
  },
  notte: {
    tecnologia: ["#2563EB", "#1E2941", "#6692F1"], economia: ["#0F766E", "#1A2C2B", "#579F9A"], politica: ["#DC2626", "#3F1E1E", "#E66767"],
    scienza: ["#7C3AED", "#2D2142", "#A77BF3"], cultura: ["#B45309", "#372619", "#C8814B"], societa: ["#D42673", "#3E1E2C", "#E668A0"],
    ambiente: ["#12863D", "#1B3424", "#32AE60"], design: ["#C74B0A", "#412719", "#EE7638"],
  },
};

type Direction = {
  id: string;
  name: string;
  motto: string;
  heading: CSSProperties;
  vars: Record<string, string>;
  radius: number;
};

const DIRECTIONS: Direction[] = [
  {
    id: "edicola",
    name: "1 · Edicola",
    motto: "Carta e inchiostro: editoriale e caldo",
    heading: { fontFamily: fraunces.style.fontFamily, fontWeight: 700, letterSpacing: "-0.01em" },
    radius: 14,
    vars: {
      "--bg": "#F4EFE6", "--surface": "#FFFDF8", "--text": "#141414", "--muted": "#5B5650", "--line": "#E4DCCD",
      "--primary": "#D7392B", "--on-primary": "#FFFFFF", "--primary-text": "#C63528", "--soft": "#F6E3DF", "--on-soft": "#8F2419",
      "--second": "#1F3A93", "--feed-bg": "#151413", "--feed-text": "#F4EFE6", "--feed-muted": "#C9C2B6", "--feed-accent": "#F4A396",
    },
  },
  {
    id: "inchiostro",
    name: "2 · Inchiostro blu",
    motto: "Moderno e deciso",
    heading: { fontWeight: 800, letterSpacing: "-0.035em" },
    radius: 22,
    vars: {
      "--bg": "#F6F5F1", "--surface": "#FFFFFF", "--text": "#101322", "--muted": "#4B5068", "--line": "#E3E2DC",
      "--primary": "#2B3FD6", "--on-primary": "#FFFFFF", "--primary-text": "#2B3FD6", "--soft": "#E6E9FB", "--on-soft": "#1F2E9E",
      "--second": "#FF7A3D", "--feed-bg": "#0E1230", "--feed-text": "#F6F5F1", "--feed-muted": "#C3C7DA", "--feed-accent": "#FF9E70",
    },
  },
  {
    id: "notte",
    name: "3 · Notte",
    motto: "Scuro e grafico, da app",
    heading: { fontFamily: grotesk.style.fontFamily, fontWeight: 700, letterSpacing: "-0.02em" },
    radius: 18,
    vars: {
      "--bg": "#111111", "--surface": "#1C1C1C", "--text": "#F2F0EA", "--muted": "#A7A49C", "--line": "#2C2C2C",
      "--primary": "#E8FF5A", "--on-primary": "#111111", "--primary-text": "#E8FF5A", "--soft": "#2A2E14", "--on-soft": "#E8FF5A",
      "--second": "#E8FF5A", "--feed-bg": "#000000", "--feed-text": "#F2F0EA", "--feed-muted": "#BDBAB2", "--feed-accent": "#E8FF5A",
    },
  },
];

function themes(dir: string): Theme[] {
  return THEME_META.map((t) => {
    const [solid, tint, text] = SHADES[dir][t.id];
    return { ...t, solid, tint, text };
  });
}

export default function IdentityPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main className="min-h-screen bg-[#e9e9e6] px-4 py-6">
      <h1 className="mb-1 text-center text-heading-2">Anteprima identità di Eddy</h1>
      <p className="mb-6 text-center text-secondary text-muted">3 direzioni a confronto · pagina visibile solo in sviluppo</p>
      <div className="flex flex-wrap items-start justify-center gap-6">
        {DIRECTIONS.map((d) => (
          <Column key={d.id} d={d} />
        ))}
      </div>
    </main>
  );
}

function Column({ d }: { d: Direction }) {
  const t = themes(d.id);
  const pol = t.find((x) => x.id === "politica")!;
  const eco = t.find((x) => x.id === "economia")!;
  const r = d.radius;
  return (
    <section
      data-direzione={d.id}
      aria-label={d.name}
      style={{ ...(d.vars as CSSProperties), width: 390, background: "var(--bg)", color: "var(--text)", borderRadius: 24 }}
      className="overflow-hidden pb-6 shadow-[0_10px_40px_rgb(0_0_0/0.12)]"
    >
      {/* intestazione della direzione */}
      <div className="px-5 pt-5 text-center">
        <p className="text-label font-bold uppercase tracking-[0.1em]" style={{ color: "var(--muted)" }}>{d.name}</p>
        <p className="text-caption" style={{ color: "var(--muted)" }}>{d.motto}</p>
      </div>

      {/* HOME */}
      <div className="px-5 pt-5 text-center">
        <span className="block text-[1.75rem] leading-none" style={d.heading}>Eddy</span>
        <p className="mt-4 text-label font-bold uppercase tracking-[0.08em]" style={{ color: "var(--primary-text)" }}>Giovedì 5 novembre</p>
        <p className="mt-1 text-[2.25rem] leading-[1.05]" style={d.heading}>Buonasera</p>
        <div className="mt-3 flex justify-center gap-2">
          {["Aggiornato 12 min fa", "300 storie · 74 testate"].map((c) => (
            <span key={c} className="rounded-full border px-3 py-1 text-label font-bold" style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--muted)" }}>{c}</span>
          ))}
        </div>
      </div>

      <div className="px-5">
        <SectionTitle d={d}>Prima pagina</SectionTitle>
        <article style={{ background: "var(--surface)", borderRadius: r + 6, border: "1px solid var(--line)" }} className="p-2">
          <div className="relative h-44 overflow-hidden" style={{ borderRadius: r }}>
            <StoryArtwork tone={1} showLabel={false} />
            <PhotoLabel th={pol} />
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[rgb(20_20_20/0.7)] px-2.5 py-1 text-label text-[#ffffff]">
              <Newspaper className="size-3.5" aria-hidden="true" /> 15 testate
            </span>
          </div>
          <div className="px-2 pb-2 pt-3">
            <p className="text-label font-bold" style={{ color: "var(--primary-text)" }}>la Repubblica, ANSA +13</p>
            <p className="mt-1 text-[1.1875rem] leading-tight" style={d.heading}>Hong Kong, l’attivista pro-democrazia Joshua Wong condannato a 10 anni di carcere</p>
            <p className="mt-2 text-label font-semibold" style={{ color: "var(--muted)" }}>Aggiornata 2 h fa</p>
          </div>
        </article>
        <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden="true">
          <i className="block h-2 w-5 rounded-full" style={{ background: "var(--primary)" }} />
          {[1, 2, 3, 4].map((i) => <i key={i} className="block size-2 rounded-full" style={{ background: "var(--line)" }} />)}
        </div>

        <SectionTitle d={d}>Temi</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {t.map((th) => (
            <span key={th.id} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-secondary font-bold" style={{ background: th.tint, color: th.text }}>
              <th.icon className="size-4" aria-hidden="true" /> {th.label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-caption" style={{ color: "var(--muted)" }}>Sulle foto:</p>
        <div className="mt-1 flex flex-wrap gap-1.5 rounded-xl p-2" style={{ background: "#2a2f2c" }}>
          {t.map((th) => (
            <span key={th.id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label text-[#ffffff]" style={{ background: th.solid }}>
              <th.icon className="size-3.5" aria-hidden="true" /> {th.label}
            </span>
          ))}
        </div>

        <SectionTitle d={d}>Ultime notizie</SectionTitle>
        <article className="p-4" style={{ background: "var(--surface)", borderRadius: r, border: "1px solid var(--line)" }}>
          <p className="text-label font-bold"><span style={{ color: "var(--primary-text)" }}>Il Sole 24 Ore, ANSA +2</span> <span style={{ color: "var(--muted)" }}>· 34 min fa</span></p>
          <p className="mt-1.5 text-[1.125rem] leading-tight" style={d.heading}>Banca d’Inghilterra, primo aumento dei tassi da oltre tre anni</p>
          <p className="mt-1.5 text-secondary" style={{ color: "var(--muted)" }}>I tassi salgono al 4%: la Banca d’Inghilterra torna ad alzarli per frenare i prezzi.</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-label font-bold" style={{ color: eco.text }}>
              <i className="block h-3.5 w-1 rounded-full" style={{ background: eco.solid }} aria-hidden="true" /> Economia
            </span>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label font-bold" style={{ background: "var(--soft)", color: "var(--on-soft)" }}>
              <Newspaper className="size-3.5" aria-hidden="true" /> 4 testate
            </span>
            <span className="ml-auto flex size-11 items-center justify-center rounded-full" style={{ background: "var(--soft)", color: "var(--on-soft)" }}>
              <Bookmark className="size-5" aria-hidden="true" />
            </span>
          </div>
        </article>

        <NavMock />
      </div>

      {/* FEED (scuro) */}
      <div className="mx-5 mt-6 overflow-hidden px-4 pb-4 pt-3" style={{ background: "var(--feed-bg)", color: "var(--feed-text)", borderRadius: r + 6 }}>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <span className="text-secondary font-bold" style={{ color: "var(--feed-accent)" }}>01 / 30</span>
          <span className="text-[1.375rem]" style={d.heading}>Eddy</span>
          <span className="flex size-9 items-center justify-self-end rounded-full bg-[rgb(255_255_255/0.1)]"><X className="m-auto size-4" aria-hidden="true" /></span>
        </div>
        <div className="relative mt-3 h-36 overflow-hidden" style={{ borderRadius: r }}>
          <StoryArtwork tone={0} showLabel={false} />
          <PhotoLabel th={pol} bottom />
        </div>
        <p className="mt-3 text-[1.375rem] leading-tight" style={d.heading}>Hong Kong, 10 anni di carcere all’attivista Joshua Wong</p>
        <p className="mt-1.5 text-secondary" style={{ color: "var(--feed-muted)" }}>Si tratta della seconda condanna in base a una legge sulla sicurezza nazionale imposta da Pechino.</p>
        <div className="mt-3 flex gap-2">
          <span className="flex min-h-12 flex-1 items-center justify-between rounded-full pl-4 pr-1.5 text-secondary font-extrabold" style={{ background: "var(--feed-text)", color: "#141414" }}>
            Leggi la storia
            <span className="flex size-8 items-center justify-center rounded-full" style={{ background: "var(--primary)", color: "var(--on-primary)" }}><ArrowRight className="size-4" aria-hidden="true" /></span>
          </span>
          {[["Salva", Bookmark], ["Da leggere", Clock]].map(([l, I]) => {
            const Icon = I as LucideIcon;
            return (
              <span key={l as string} className="flex w-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-2xl text-center border border-[rgb(255_255_255/0.2)] bg-[rgb(255_255_255/0.05)] text-caption font-bold">
                <Icon className="size-4" aria-hidden="true" />{l as string}
              </span>
            );
          })}
        </div>
      </div>

      {/* STORIA (inizio) */}
      <div className="px-5 pt-6">
        <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center">
          <span className="flex size-11 items-center justify-center rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}><ChevronLeft className="size-5" aria-hidden="true" /></span>
          <span className="text-center text-[1.75rem] leading-none" style={d.heading}>Eddy</span>
        </div>
        <div className="relative mt-4 h-44 overflow-hidden" style={{ borderRadius: r + 6 }}>
          <StoryArtwork tone={2} showLabel={false} />
          <PhotoLabel th={pol} />
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-[rgb(0_0_0/0.55)] px-2.5 py-1 text-caption text-[#ffffff]">Foto: la Repubblica</span>
        </div>
        <p className="mt-4 text-center text-[1.625rem] leading-tight" style={d.heading}>Hong Kong, l’attivista Joshua Wong condannato a 10 anni</p>
        <p className="mt-2 text-center text-secondary font-semibold" style={{ color: "var(--muted)" }}>Raccontata da la Repubblica, ANSA e altre 11 testate</p>
        <SectionTitle d={d} center>In breve</SectionTitle>
        <div className="p-4" style={{ background: "var(--surface)", borderRadius: r, border: "1px solid var(--line)" }}>
          <p className="text-[1.0625rem] leading-relaxed">Si tratta della seconda sentenza in base a una legge sulla sicurezza nazionale imposta da Pechino.</p>
          <p className="mt-1.5 text-label font-bold" style={{ color: "var(--primary-text)" }}>la Repubblica ↗</p>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ d, children, center = false }: { d: Direction; children: ReactNode; center?: boolean }) {
  return (
    <h2 className={`mb-2.5 mt-6 text-[1.1875rem] ${center ? "text-center" : ""}`} style={d.heading}>
      {children}
    </h2>
  );
}

function PhotoLabel({ th, bottom = false }: { th: Theme; bottom?: boolean }) {
  return (
    <span className={`absolute left-2.5 ${bottom ? "bottom-2.5" : "top-2.5"} inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label text-[#ffffff]`} style={{ background: th.solid }}>
      <th.icon className="size-3.5" aria-hidden="true" /> {th.label}
    </span>
  );
}

function NavMock() {
  const items: [string, LucideIcon][] = [["Oggi", House], ["Feed", Layers], ["Libreria", BookOpen], ["Profilo", User]];
  return (
    <div className="mt-6 grid grid-cols-4 gap-1 p-1.5" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 30, boxShadow: "0 8px 28px rgb(0 0 0 / 0.14)" }}>
      {items.map(([label, Icon], i) => (
        <span
          key={label}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-3xl text-label"
          style={i === 0 ? { background: "var(--primary)", color: "var(--on-primary)", fontWeight: 800 } : { color: "var(--muted)", fontWeight: 600 }}
        >
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  );
}
