// Illustrazione segnaposto: sostituisce la foto finché non arrivano le immagini
// reali delle testate (che saranno in hotlink con credito "Foto: <testata>").

// Colori dai token di globals.css (--color-art-* e --color-thumb-*): scuri per le immagini grandi, chiari per le miniature.
const largePalettes = [0, 1, 2].map((n) => ["a", "b", "c", "d"].map((k) => `var(--color-art-${n}${k})`));
const thumbPalettes = [0, 1, 2].map((n) => ["a", "b", "c"].map((k) => `var(--color-thumb-${n}${k})`));

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
        <rect width="104" height="104" style={{ fill: background }} />
        <circle cx={tone % 2 ? 36 : 68} cy="38" r="24" style={{ fill: sun }} />
        <path d="M0 80 C28 62 56 92 104 70 V104 H0Z" style={{ fill: hill }} />
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
        <rect width="350" height="330" style={{ fill: background }} />
        <circle cx={tone % 2 ? 120 : 250} cy="130" r="100" style={{ fill: sun }} />
        <path d="M0 232 C70 190 140 270 215 232 S320 200 350 222 V330 H0Z" style={{ fill: hill }} />
        <path d="M0 284 C80 258 150 306 230 282 S320 266 350 276 V330 H0Z" style={{ fill: ground }} />
      </svg>
      {showLabel && (
        <span className="absolute right-3.5 top-3.5 rounded-full bg-overlay-strong px-2.5 py-1 text-caption text-on-photo">
          Immagine segnaposto
        </span>
      )}
    </>
  );
}
