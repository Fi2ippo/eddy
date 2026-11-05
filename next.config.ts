import type { NextConfig } from "next";

// Sito statico (cartella out/), pubblicabile gratis su GitHub Pages.
// Il percorso del sito si sceglie con EDDY_BASE_PATH: vuoto in locale, "/eddy" su https://fi2ippo.github.io/eddy.
// Le notizie non sono dentro il sito: l'app le scarica dal ramo "dati", quindi non serve ricostruirlo ogni ora.
const basePath = process.env.EDDY_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // ogni pagina diventa cartella/index.html: funziona su GitHub Pages e su qualsiasi server di file
  trailingSlash: true,
  devIndicators: false,
};

export default nextConfig;
