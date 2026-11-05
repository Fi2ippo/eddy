import type { ReactNode } from "react";

type LibraryEmptyStateProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

export default function LibraryEmptyState({
  title,
  description,
  icon,
}: LibraryEmptyStateProps) {
  return (
    <div className="max-w-md py-8">
      <div aria-hidden="true" className="text-accent">
        {icon}
      </div>
      <h2 className="mt-6 text-heading-2">{title}</h2>
      <p className="mt-3 text-body text-muted">{description}</p>
    </div>
  );
}
