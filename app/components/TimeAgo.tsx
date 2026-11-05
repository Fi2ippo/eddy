"use client";

import { timeAgo, useNow } from "../lib/stories";

type TimeAgoProps = {
  iso: string | null | undefined;
  prefix?: string;
  suffix?: string;
  className?: string;
};

// Orario relativo ("ora", "5 min fa", "2 h fa", "ieri 18:30", "4 nov"), aggiornato da solo ogni minuto.
export default function TimeAgo({ iso, prefix = "", suffix = "", className }: TimeAgoProps) {
  const now = useNow();
  if (!iso) return null;
  const text = now ? timeAgo(iso, now) : "";
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text ? prefix + text + suffix : " "}
    </time>
  );
}
