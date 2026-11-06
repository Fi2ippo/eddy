import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import BottomNavigation from "./components/BottomNavigation";
import Onboarding from "./components/Onboarding";
import "./globals.css";

// Manrope viene scaricato da Next al momento della build e servito dal sito stesso.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eddy",
  description:
    "Informarsi attraverso più fonti, fuori dal rumore dei social network.",
  // Icona: app/icon.svg (scheda del browser) e app/apple-icon.png (schermata Home di iPhone).
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={manrope.variable}>
      <body>
        <div className="app-content">{children}</div>
        <BottomNavigation />
        <Onboarding />
      </body>
    </html>
  );
}
