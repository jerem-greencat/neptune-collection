"use client";

import { useState, useTransition } from "react";
import {
  pickVinylMasterAction,
  searchVinylsAction,
} from "@/app/actions/vinyls";
import type { ReleaseMetadata, ReleaseSummary } from "@/lib/discogs";

interface InitialVinyl {
  artist: string;
  title: string;
}

/**
 * État de la recherche de disque, partagé par l'ajout et la modification.
 *
 * Deux voies mènent à la même fiche : le code-barres, qui identifie un pressage
 * précis, et la recherche par artiste ou titre. `attach` est le point commun,
 * pour que les deux produisent exactement la même donnée.
 *
 * Choisir dans la liste demande une seconde requête : la recherche ne rend
 * qu'un artiste et un titre découpés approximativement, la fiche les rend
 * propres et donne l'année de sortie d'origine.
 */
export function useVinylSearch(initial: InitialVinyl) {
  const [artist, setArtist] = useState(initial.artist);
  const [title, setTitle] = useState(initial.title);

  const [isSearching, startSearch] = useTransition();
  const [results, setResults] = useState<ReleaseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attached, setAttached] = useState<ReleaseMetadata | null>(null);

  const attach = (metadata: ReleaseMetadata) => {
    setAttached(metadata);
    setArtist(metadata.artist);
    setTitle(metadata.title);
    setResults(null);
  };

  const run = () => {
    if (!artist.trim() && !title.trim()) return;

    setError(null);

    startSearch(async () => {
      const result = await searchVinylsAction(artist, title);

      if (!result.success) {
        setError(result.error ?? "La recherche a échoué.");
        setResults(null);
        return;
      }

      setResults(result.releases ?? []);
    });
  };

  const pick = (masterId: string) => {
    setError(null);

    startSearch(async () => {
      const result = await pickVinylMasterAction(Number(masterId));

      if (!result.success || !result.metadata) {
        setError(result.error ?? "La lecture de la fiche a échoué.");
        return;
      }

      attach(result.metadata);
    });
  };

  const reset = (next: InitialVinyl) => {
    setArtist(next.artist);
    setTitle(next.title);
    setResults(null);
    setError(null);
    setAttached(null);
  };

  return {
    artist,
    setArtist,
    title,
    setTitle,
    isSearching,
    results,
    error,
    attached,
    attach,
    detach: () => setAttached(null),
    run,
    pick,
    reset,
  };
}
