/**
 * Affiché pendant que la page interroge MongoDB. Sans ça, sur réseau faible,
 * l'utilisateur reste sur la page précédente sans aucun retour visuel.
 *
 * Le squelette reprend la géométrie réelle de la liste — index, pochette, deux
 * lignes de texte — pour qu'il n'y ait pas de saut à l'arrivée des données.
 */
export default function LoadingVinyls() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse px-5 py-10 sm:px-8">
      <div className="mb-8">
        <div className="h-px w-8 bg-groove-500/40" />
        <div className="mt-4 h-10 w-48 rounded bg-ink-850" />
      </div>

      <div className="h-11 w-full rounded-md bg-ink-900" />

      <ul className="mt-6 border-t border-ink-800">
        {[0, 1, 2, 3].map((index) => (
          <li
            key={index}
            className="flex items-center gap-4 border-b border-ink-800 py-4"
          >
            <div className="hidden h-3 w-6 shrink-0 rounded bg-ink-850 sm:block" />
            <div className="h-12 w-12 shrink-0 rounded-sm bg-ink-850" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-2/5 rounded bg-ink-850" />
              <div className="h-3.5 w-3/5 rounded bg-ink-900" />
            </div>
          </li>
        ))}
      </ul>

      <span className="sr-only">Chargement de la collection…</span>
    </div>
  );
}
