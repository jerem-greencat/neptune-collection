import type { ReactNode } from "react";

interface CollectionHeaderProps {
  overline: string;
  title: string;
  count: number;
  accent: "groove" | "reel";
  action: ReactNode;
}

/**
 * En-tête de collection : intitulé, titre, décompte, action.
 *
 * Le décompte est affiché en chiffres de catalogue, à côté du titre : c'est
 * l'information qu'on cherche en arrivant sur la page.
 */
export default function CollectionHeader({
  overline,
  title,
  count,
  accent,
  action,
}: CollectionHeaderProps) {
  const rule = accent === "groove" ? "bg-groove-500/60" : "bg-reel-500/60";

  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <span className={`h-px w-8 ${rule}`} />
        <p className="label-caps">{overline}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="flex items-baseline gap-3 font-display text-4xl leading-none text-paper-50 sm:text-5xl">
          {title}
          <span className="catalog-num text-sm font-sans text-paper-600">
            {String(count).padStart(2, "0")}
          </span>
        </h1>

        {action}
      </div>
    </header>
  );
}
