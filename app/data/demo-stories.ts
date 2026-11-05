export type EditorialStory = {
  id: string;
  category: string;
  title: string;
  description: string;
  insight?: string;
};

export type StorySource = {
  name: string;
  title: string;
  url: string;
};

// Dati completi per la pagina Storia (stessi campi che arriveranno da stories.json).
export type StoryDetail = EditorialStory & {
  /** "In breve": estratti brevi delle testate, al massimo 3 frasi. */
  summary: readonly string[];
  sources: readonly StorySource[];
  /** Foto in hotlink dalla testata; se manca si mostra un'illustrazione segnaposto. */
  image?: string;
  imageCredit?: string;
};

// Fonti di esempio: example.com è un dominio riservato agli esempi, non una testata.
function demoSources(story: string, titles: readonly [string, string, string]) {
  return titles.map((title, index) => {
    const letter = "ABC"[index];
    return {
      name: `Testata ${letter}`,
      title: `${title} (titolo di esempio)`,
      url: `https://example.com/testata-${letter.toLowerCase()}/${story}`,
    };
  });
}

// Esempi editoriali temporanei: non rappresentano notizie di attualità.
export const demoStories = [
  {
    id: "intelligenza-artificiale",
    category: "Tecnologia e società",
    title: "Che spazio vogliamo dare all’intelligenza artificiale?",
    description:
      "Lavoro, creatività e responsabilità: un percorso per ragionare sulle scelte che accompagnano l’uso di questi strumenti, oltre l’entusiasmo e i timori.",
    insight:
      "Un punto di partenza: distinguere ciò che vogliamo delegare da ciò su cui desideriamo mantenere un giudizio personale. Quali scelte vorremmo poter comprendere e discutere?",
    summary: [
      "Lavoro, creatività e responsabilità: un percorso per ragionare sulle scelte che accompagnano l’uso di questi strumenti.",
      "Un punto di partenza: distinguere ciò che vogliamo delegare da ciò su cui desideriamo mantenere un giudizio personale.",
      "Quali scelte vorremmo poter comprendere e discutere?",
    ],
    sources: demoSources("intelligenza-artificiale", [
      "Che cosa deleghiamo alle macchine",
      "Creatività e strumenti automatici",
      "Chi è responsabile delle scelte di un algoritmo",
    ]),
  },
  {
    id: "valore-del-lavoro",
    category: "Economia",
    title: "Come cambia il nostro modo di dare valore al lavoro",
    description:
      "Tempo, competenze e benessere: tre prospettive per esplorare il rapporto tra economia e vita quotidiana.",
    insight:
      "Possiamo guardare al lavoro attraverso domande diverse: che cosa ci permette di imparare? Quanto spazio lascia alla vita fuori dall’ufficio? Il valore personale e quello economico possono raccontare aspetti differenti.",
    summary: [
      "Tempo, competenze e benessere: tre prospettive per esplorare il rapporto tra economia e vita quotidiana.",
      "Possiamo guardare al lavoro attraverso domande diverse: che cosa ci permette di imparare? Quanto spazio lascia alla vita fuori dall’ufficio?",
      "Il valore personale e quello economico possono raccontare aspetti differenti.",
    ],
    sources: demoSources("valore-del-lavoro", [
      "Il tempo come misura del lavoro",
      "Competenze che cambiano",
      "Benessere e vita fuori dall’ufficio",
    ]),
  },
  {
    id: "attenzione",
    category: "Cultura",
    title: "L’attenzione è anche una scelta",
    description:
      "Una riflessione sulle abitudini di lettura e sugli spazi che possiamo riservare a ciò che merita tempo.",
    insight:
      "Scegliere una domanda da approfondire, fermarsi su un passaggio, confrontare prospettive: piccoli modi per dare una direzione alla lettura. Non occorre arrivare subito a una conclusione.",
    summary: [
      "Una riflessione sulle abitudini di lettura e sugli spazi che possiamo riservare a ciò che merita tempo.",
      "Scegliere una domanda da approfondire, fermarsi su un passaggio, confrontare prospettive: piccoli modi per dare una direzione alla lettura.",
      "Non occorre arrivare subito a una conclusione.",
    ],
    sources: demoSources("attenzione", [
      "Come leggiamo oggi",
      "Lo spazio per ciò che merita tempo",
      "Confrontare prospettive diverse",
    ]),
  },
] as const satisfies readonly [StoryDetail, StoryDetail, StoryDetail];

export function findDemoStory(id: string): StoryDetail | undefined {
  return demoStories.find((story) => story.id === id);
}
