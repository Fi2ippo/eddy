import type { Metadata } from "next";
import AboutView, { type AboutSource } from "../components/AboutView";
import sources from "../../data/sources.json";

export const metadata: Metadata = { title: "Chi siamo · Eddy" };

// L'elenco delle testate si genera da data/sources.json al momento della costruzione del sito:
// compaiono solo le fonti attive (enabled), con il sito ufficiale.
type Raw = { name: string; site: string; area: string; enabled?: boolean; via?: string | null; mode?: string };

export default function AboutPage() {
  const list: AboutSource[] = (sources as Raw[])
    .filter((s) => s.enabled && s.mode === "news")
    .map((s) => ({ name: s.name, site: s.site, area: (s.area === "italia" ? "italia" : "mondo") as AboutSource["area"], feed: s.via !== "google_news" }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
  return <AboutView sources={list} />;
}
