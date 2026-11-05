import { editorialInterests } from "../data/editorial-interests";

export const PERSONAL_DATA_KEY = "eddy:personal:v1";
// Chiave usata quando l'app si chiamava ALT: letta solo per migrare i dati.
export const LEGACY_PERSONAL_DATA_KEY = "alt:personal:v1";
export const storyFields = ["savedAt", "readingListAt", "readAt"] as const;
export type StoryField = (typeof storyFields)[number];

// Piccola scheda della storia, salvata quando la si legge o la si mette da parte:
// le storie escono dai dati dopo 72 ore, ma Libreria e Profilo devono poterle ancora mostrare.
export type StorySnapshot = {
  title: string;
  category: string;
  image: string | null;
  /** credito della foto, es. "Foto: ANSA" */
  credit: string | null;
  source: string;
  updated: string;
  /** quante testate raccontavano la storia */
  outlets?: number;
};
export type StoryActivity = Partial<Record<StoryField, number>> & { snapshot?: StorySnapshot };

// Dimensione del testo di lettura ("In breve" nella pagina Storia).
export const textSizes = [
  { id: "piccolo", label: "Piccolo", fontSize: "0.9375rem" }, // 15px
  { id: "medio", label: "Medio", fontSize: "1.0625rem" }, // 17px
  { id: "grande", label: "Grande", fontSize: "1.25rem" }, // 20px
] as const;
export type TextSize = (typeof textSizes)[number]["id"];
export const defaultTextSize: TextSize = "medio";

export function isTextSize(value: unknown): value is TextSize {
  return textSizes.some(({ id }) => id === value);
}

// Filtro delle notizie: Italia, Mondo o Tutto.
export const areaFilters = [
  { id: "tutto", label: "Tutto" },
  { id: "italia", label: "Italia" },
  { id: "mondo", label: "Mondo" },
] as const;
export type AreaFilter = (typeof areaFilters)[number]["id"];
export const defaultArea: AreaFilter = "tutto";

export function isAreaFilter(value: unknown): value is AreaFilter {
  return areaFilters.some(({ id }) => id === value);
}

export type PersonalData = {
  version: 1;
  interests: string[];
  stories: Record<string, StoryActivity>;
  textSize: TextSize;
  area: AreaFilter;
};

export const emptyPersonalData: PersonalData = {
  version: 1,
  interests: [],
  stories: {},
  textSize: defaultTextSize,
  area: defaultArea,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStoryId(id: string) {
  return /^[a-z0-9][a-z0-9_-]{0,127}$/.test(id);
}

function shortText(value: unknown, max: number): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= max ? value : null;
}

function decodeSnapshot(value: unknown): StorySnapshot | undefined {
  if (!isRecord(value)) return undefined;
  const title = shortText(value.title, 400);
  const category = shortText(value.category, 40);
  const source = shortText(value.source, 120);
  const updated = shortText(value.updated, 40);
  const image = shortText(value.image, 2000);
  const credit = shortText(value.credit, 160);
  if (!title || !category || !source || !updated) return undefined;
  const safeImage = image && /^https?:\/\//.test(image) ? image : null;
  const outlets = typeof value.outlets === "number" && Number.isInteger(value.outlets) && value.outlets > 0 && value.outlets < 1000 ? value.outlets : undefined;
  return { title, category, source, updated, image: safeImage, credit: safeImage ? credit : null, ...(outlets ? { outlets } : {}) };
}

export function hasActivity(activity: StoryActivity | undefined) {
  return Boolean(activity && storyFields.some((field) => activity[field]));
}

export function decodePersonalData(raw: string | null): {
  data: PersonalData;
  notice: string | null;
} {
  if (raw === null) return { data: emptyPersonalData, notice: null };

  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      value.version !== 1 ||
      !Array.isArray(value.interests) ||
      !isRecord(value.stories)
    ) {
      throw new Error("Invalid personal data");
    }

    const selectedInterests = value.interests;
    const interests = editorialInterests
      .filter(({ id }) => selectedInterests.includes(id))
      .map(({ id }) => id);
    const entries: [string, StoryActivity][] = [];
    for (const [id, activity] of Object.entries(value.stories)) {
      if (!isStoryId(id) || !isRecord(activity)) continue;
      const validated: StoryActivity = {};
      for (const field of storyFields) {
        const timestamp = activity[field];
        if (
          typeof timestamp === "number" &&
          Number.isSafeInteger(timestamp) &&
          timestamp > 0
        ) {
          validated[field] = timestamp;
        }
      }
      const snapshot = decodeSnapshot(activity.snapshot);
      if (snapshot) validated.snapshot = snapshot;
      if (hasActivity(validated)) entries.push([id, validated]);
    }

    return {
      data: {
        version: 1,
        interests,
        stories: Object.fromEntries(entries),
        // Gli archivi salvati prima di queste impostazioni non hanno i campi: si usano i valori predefiniti.
        textSize: isTextSize(value.textSize) ? value.textSize : defaultTextSize,
        area: isAreaFilter(value.area) ? value.area : defaultArea,
      },
      notice: null,
    };
  } catch {
    return {
      data: emptyPersonalData,
      notice:
        "I dati locali non sono validi. È stato aperto un archivio vuoto; puoi cancellare i dati dal Profilo o iniziare nuove selezioni.",
    };
  }
}
