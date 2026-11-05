// Illustrazione segnaposto: sostituisce la foto finché non arrivano le immagini
// reali delle testate (che saranno in hotlink con credito "Foto: <testata>").

// Colori presi dai design: scuri per le immagini grandi, chiari per le miniature.
const largePalettes = [
  ["#17302A", "#E9B872", "#2F5A49", "#10231E"],
  ["#1D2B3A", "#CFE7D6", "#2D4A5F", "#14212D"],
  ["#2A2A1E", "#E4C9A0", "#4A4A33", "#1B1B13"],
] as const;

const thumbPalettes = [
  ["#D9E4DA", "#2F5443", "#A9C4B1"],
  ["#EDE2CC", "#17302A", "#D8C39A"],
  ["#E2E6EE", "#1D2B3A", "#B9C6D8"],
] as const;

type StoryArtworkProps = {
  /** Posizione della storia: storie vicine ricevono colori diversi. */
  tone?: number;
  size?: "large" | "thumb";
  /** Etichetta "Immagine segnaposto" in alto a destra (la pagina Storia la mostra altrove). */
  showLabel?: boolean;
};

export default function StoryArtwork({ tone = 0, size = "large", showLabel = true }: StoryArtworkProps) {
  if (size === "thumb") {
    const [background, sun, hill] = thumbPalettes[tone % thumbPalettes.length];
    return (
      <svg viewBox="0 0 104 104" aria-hidden="true" className="block size-full">
        <rect width="104" height="104" fill={background} />
        <circle cx={tone % 2 ? 36 : 68} cy="38" r="24" fill={sun} />
        <path d="M0 80 C28 62 56 92 104 70 V104 H0Z" fill={hill} />
      </svg>
    );
  }

  const [background, sun, hill, ground] = largePalettes[tone % largePalettes.length];
  return (
    <>
      <svg
        viewBox="0 0 350 330"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="block size-full"
      >
        <rect width="350" height="330" fill={background} />
        <circle cx={tone % 2 ? 120 : 250} cy="130" r="100" fill={sun} />
        <path d="M0 232 C70 190 140 270 215 232 S320 200 350 222 V330 H0Z" fill={hill} />
        <path d="M0 284 C80 258 150 306 230 282 S320 266 350 276 V330 H0Z" fill={ground} />
      </svg>
      {showLabel && (
        <span className="absolute right-3.5 top-3.5 rounded-full bg-[rgb(0_0_0/0.5)] px-2.5 py-1 text-caption text-surface">
          Immagine segnaposto
        </span>
      )}
    </>
  );
}
