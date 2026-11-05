"use client";

import { BookOpen, House, Layers, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

const destinations = [
  { label: "Oggi", href: "/", icon: House },
  { label: "Feed", href: "/feed", icon: Layers },
  { label: "Libreria", href: "/libreria", icon: BookOpen },
  { label: "Profilo", href: "/profilo", icon: User },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const navigationRef = useRef<HTMLElement>(null);
  // La pagina Storia ha la sua barra (Salva / Da leggere); il Feed è a tutto schermo, senza navigazione.
  const hidden = pathname.startsWith("/storia") || pathname.startsWith("/feed") || pathname.startsWith("/anteprima");

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (hidden || !navigation) return;

    // Riserva l'altezza reale della barra (anche con etichette a capo)
    // più la distanza dal bordo inferiore, perché la barra galleggia.
    const reserveSpace = () => {
      const { height } = navigation.getBoundingClientRect();
      const offset = parseFloat(getComputedStyle(navigation).bottom) || 0;
      document.documentElement.style.setProperty(
        "--bottom-navigation-height",
        `${height + offset}px`,
      );
    };

    reserveSpace();
    const observer = new ResizeObserver(reserveSpace);
    observer.observe(navigation);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--bottom-navigation-height");
    };
  }, [hidden]);

  if (hidden) return null;

  return (
    <nav
      ref={navigationRef}
      aria-label="Navigazione principale"
      className="floating-bar"
    >
      <ul className="bottom-navigation-list">
        {destinations.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;

          return (
            <li key={href} className="flex min-w-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="bottom-navigation-link"
              >
                <Icon
                  aria-hidden="true"
                  focusable="false"
                  className="size-6 shrink-0"
                  strokeWidth={2}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
