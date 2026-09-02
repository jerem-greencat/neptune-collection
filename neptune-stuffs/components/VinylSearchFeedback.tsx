"use client";

import PickList from "@/components/ui/PickList";
import type { useVinylSearch } from "./useVinylSearch";

interface VinylSearchFeedbackProps {
  search: ReturnType<typeof useVinylSearch>;
  /** Un bouton « Détacher » n'a de sens qu'au moment de l'ajout. */
  detachable?: boolean;
}

/** Retours de la recherche Discogs : erreur, liste de pressages, fiche associée. */
export default function VinylSearchFeedback({
  search,
  detachable = false,
}: VinylSearchFeedbackProps) {
  return (
    <>
      {search.error && (
        <p className="text-red-500 text-xs mb-4">{search.error}</p>
      )}

      {search.results?.length === 0 && (
        <p className="text-gray-500 text-xs mb-4">
          Aucune release trouvée, les champs saisis seront utilisés tels quels.
        </p>
      )}

      {search.results && search.results.length > 0 && (
        <div className="mb-4">
          <PickList
            options={search.results.map((release) => ({
              id: String(release.discogsMasterId),
              label: `${release.artist ? `${release.artist} — ` : ""}${release.title}${
                release.year ? ` (${release.year})` : ""
              }`,
              details: release.details,
            }))}
            onPick={search.pick}
          />
        </div>
      )}

      {search.attached && (
        <p className="text-green-700 text-xs mb-4">
          Fiche Discogs associée
          {search.attached.year ? ` — ${search.attached.year}` : ""}.
          {detachable && (
            <>
              {" "}
              <button
                type="button"
                onClick={search.detach}
                className="underline hover:no-underline"
              >
                Détacher
              </button>
            </>
          )}
        </p>
      )}
    </>
  );
}
