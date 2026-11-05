import { editorialInterests } from "../data/editorial-interests";

export const PERSONAL_DATA_KEY = "eddy:personal:v1";
// Chiave usata quando l'app si chiamava ALT: letta solo per migrare i dati.
export const LEGACY_PERSONAL_DATA_KEY = "alt:personal:v1";
export const storyFields = ["savedAt", "readingListAt", "readAt"] as const;
export type StoryField = (typeof storyFields)[number];
export type StoryActivity = Partial<Record<StoryField, number>>;
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

export type PersonalData = {
  version: 1;
  interests: string[];
  stories: Record<string, StoryActivity>;
  textSize: TextSize;
};

export const emptyPersonalData: PersonalData = {
  version: 1,
  interests: [],
  stories: {},
  textSize: defaultTextSize,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStoryId(id: string) {
  return /^[a-z0-9][a-z0-9_-]{0,127}$/.test(id);
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
      if (Object.keys(validated).length > 0) entries.push([id, validated]);
    }

    return {
      data: {
        version: 1,
        interests,
        stories: Object.fromEntries(entries),
        // Gli archivi salvati prima di questa impostazione non hanno il campo: si usa Medio.
        textSize: isTextSize(value.textSize) ? value.textSize : defaultTextSize,
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
