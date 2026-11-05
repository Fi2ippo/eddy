import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type LibraryEmptyStateProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

// Stato vuoto delle sezioni della Libreria (design/Libreria.dc.html).
export default function LibraryEmptyState({ title, description, icon }: LibraryEmptyStateProps) {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center px-7 py-8 text-center">
      <span aria-hidden="true" className="flex size-19 items-center justify-center rounded-full bg-[#e6efe8] text-accent">
        {icon}
      </span>
      <h2 className="mt-5.5 text-[1.375rem] font-extrabold leading-tight">{title}</h2>
      <p className="mt-2 max-w-[17rem] text-body text-muted">{description}</p>
      <Link href="/feed" className="pill-button mt-6 min-h-13 px-7">
        Vai al Feed
        <ArrowRight aria-hidden="true" className="size-4.5" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
