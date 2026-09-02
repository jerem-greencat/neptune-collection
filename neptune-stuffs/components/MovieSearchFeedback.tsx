"use client";

import PickList from "@/components/ui/PickList";
import { describeWork, type useMovieSearch } from "./useMovieSearch";

/** Retours de la recherche : erreur, absence de résultat, liste, fiche choisie. */
export default function MovieSearchFeedback({
  search,
}: {
  search: ReturnType<typeof useMovieSearch>;
}) {
  return (
    <>
      {search.error && (
        <p className="text-red-500 text-xs mt-2">{search.error}</p>
      )}

      {search.results?.length === 0 && (
        <p className="text-gray-500 text-xs mt-2">
          Aucun résultat, le titre saisi sera utilisé tel quel.
        </p>
      )}

      {search.results && search.results.length > 0 && (
        <PickList
          options={search.results.map((movie) => ({
            id: movie.wikidataId,
            label: `${movie.title}${movie.year ? ` (${movie.year})` : ""}`,
            details: [movie.kind, movie.directors].filter(Boolean).join(" · "),
          }))}
          onPick={search.pick}
        />
      )}

      {search.picked && (
        <p className="text-green-700 text-xs mt-2">
          Fiche associée : {describeWork(search.picked)}
        </p>
      )}
    </>
  );
}
