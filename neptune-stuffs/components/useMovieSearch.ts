"use client";

import { useState, useTransition } from "react";
import { findOwnedMovieAction, searchMoviesAction } from "@/app/actions/dvds";
import type { OwnedMatch } from "@/lib/collections/types";
import type { MovieSummary } from "@/lib/wikidata";

/** Résumé lisible d'une fiche, pour confirmer ce qui vient d'être associé. */
export function describeWork(work: MovieSummary): string {
  return [work.kind, work.year, work.directors].filter(Boolean).join(" · ");
}

/**
 * État de la recherche d'œuvre, partagé par l'ajout et la modification d'un
 * dvd : les deux formulaires cherchent sur le titre, listent les résultats et
 * en associent un.
 *
 * Associer une fiche déclenche une recherche de doublon sur l'identité de
 * l'œuvre. C'est le seul moment où on la connaît — un code-barres ne désigne
 * qu'une édition, et deux éditions du même film ont des codes différents.
 *
 * Modifier le titre à la main détache la fiche : elle ne correspondrait plus à
 * ce qui est saisi.
 *
 * `excludeDvdId` évite qu'un dvd en cours de modification se signale lui-même
 * comme doublon.
 */
export function useMovieSearch(initialTitle: string, excludeDvdId?: string) {
  const [title, setTitleValue] = useState(initialTitle);
  const [isSearching, startSearch] = useTransition();
  const [results, setResults] = useState<MovieSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<MovieSummary | null>(null);
  const [alreadyOwned, setAlreadyOwned] = useState<OwnedMatch | null>(null);

  const setTitle = (value: string) => {
    setTitleValue(value);
    setPicked(null);
    setAlreadyOwned(null);
  };

  const run = () => {
    if (!title.trim()) return;

    setError(null);

    startSearch(async () => {
      const result = await searchMoviesAction(title);

      if (!result.success) {
        setError(result.error ?? "La recherche a échoué.");
        setResults(null);
        return;
      }

      setResults(result.movies ?? []);
    });
  };

  const pick = (wikidataId: string) => {
    const movie = results?.find((entry) => entry.wikidataId === wikidataId);

    if (!movie) return;

    setPicked(movie);
    setTitleValue(movie.title);
    setResults(null);
    setAlreadyOwned(null);

    startSearch(async () => {
      const owned = await findOwnedMovieAction(
        movie.wikidataId,
        movie.imdbId ?? undefined,
        excludeDvdId,
      );

      // Un échec de cette vérification ne doit pas empêcher l'ajout.
      if (owned.success && owned.alreadyOwned) {
        setAlreadyOwned(owned.alreadyOwned);
      }
    });
  };

  const reset = (nextTitle: string) => {
    setTitleValue(nextTitle);
    setResults(null);
    setError(null);
    setPicked(null);
    setAlreadyOwned(null);
  };

  return {
    title,
    setTitle,
    isSearching,
    results,
    error,
    picked,
    alreadyOwned,
    run,
    pick,
    reset,
  };
}
