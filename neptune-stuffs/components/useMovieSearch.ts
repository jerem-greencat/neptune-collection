"use client";

import { useState, useTransition } from "react";
import { searchMoviesAction } from "@/app/actions/dvds";
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
 * Modifier le titre à la main détache la fiche : elle ne correspondrait plus à
 * ce qui est saisi.
 */
export function useMovieSearch(initialTitle: string) {
  const [title, setTitleValue] = useState(initialTitle);
  const [isSearching, startSearch] = useTransition();
  const [results, setResults] = useState<MovieSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<MovieSummary | null>(null);

  const setTitle = (value: string) => {
    setTitleValue(value);
    setPicked(null);
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
  };

  const reset = (nextTitle: string) => {
    setTitleValue(nextTitle);
    setResults(null);
    setError(null);
    setPicked(null);
  };

  return {
    title,
    setTitle,
    isSearching,
    results,
    error,
    picked,
    run,
    pick,
    reset,
  };
}
