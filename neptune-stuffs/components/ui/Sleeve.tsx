/**
 * Vignette d'objet, à défaut de visuel.
 *
 * Aucune source librement réutilisable ne fournit de pochette ni de jaquette,
 * et une case vide donnerait un air d'interface inachevée. Un disque dans sa
 * pochette, un boîtier avec sa tranche : on reconnaît l'objet avant de lire
 * l'étiquette, et la liste reste lisible en un coup d'œil.
 */
export default function Sleeve({ kind }: { kind: "vinyl" | "dvd" }) {
  if (kind === "vinyl") {
    return (
      <span
        aria-hidden="true"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-sm border border-ink-700 bg-gradient-to-br from-ink-800 to-ink-900"
      >
        {/* Le disque occupe presque toute la pochette, comme en vrai. */}
        <span className="grid h-9 w-9 place-items-center rounded-full border border-groove-500/60 bg-ink-950">
          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-groove-500/70">
            <span className="h-1 w-1 rounded-full bg-ink-950" />
          </span>
        </span>
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 overflow-hidden rounded-sm border border-ink-700 bg-gradient-to-br from-ink-800 to-ink-900"
    >
      {/* La tranche du boîtier, la partie qu'on voit sur une étagère. */}
      <span className="h-full w-2 shrink-0 border-r border-reel-400/40 bg-reel-500/60" />

      {/* Deux filets pour suggérer le texte de la jaquette. */}
      <span className="flex flex-1 flex-col justify-center gap-1.5 px-2">
        <span className="h-px w-full bg-reel-400/35" />
        <span className="h-px w-2/3 bg-reel-400/20" />
      </span>
    </span>
  );
}
