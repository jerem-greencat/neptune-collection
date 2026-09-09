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
        <p className="mt-2 text-xs text-alert-400">{search.error}</p>
      )}

      {search.results?.length === 0 && (
        <p className="mt-2 text-xs text-paper-500">
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
        <p className="mt-2 text-xs text-reel-300">
          Fiche associée : {describeWork(search.picked)}
        </p>
      )}

      {/*
        Un avertissement, pas un blocage : posséder le même film en DVD et en
        Blu-ray est légitime, et c'est à toi de trancher.
      */}
      {search.alreadyOwned && (
        <p className="mt-2 text-xs text-warn-400">
          Tu as déjà ce film, dans une autre édition :{" "}
          {search.alreadyOwned.label}
        </p>
      )}
    </>
  );
}
