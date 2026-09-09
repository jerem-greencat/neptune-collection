"use client";

import { useState, useTransition } from "react";
import {
  findOwnedVinylAction,
  pickVinylMasterAction,
  searchVinylsAction,
} from "@/app/actions/vinyls";
import type { OwnedMatch } from "@/lib/collections/types";
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
 *
 * Associer une fiche déclenche une recherche de doublon sur l'album lui-même
 * (le « master » Discogs). Un code-barres ne désigne qu'un pressage : le
 * pressage d'origine et une réédition du même album ont des codes différents.
 *
 * `excludeVinylId` évite qu'un disque en cours de modification se signale
 * lui-même comme doublon.
 */
export function useVinylSearch(initial: InitialVinyl, excludeVinylId?: string) {
  const [artist, setArtist] = useState(initial.artist);
  const [title, setTitle] = useState(initial.title);

  const [isSearching, startSearch] = useTransition();
  const [results, setResults] = useState<ReleaseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attached, setAttached] = useState<ReleaseMetadata | null>(null);
  const [alreadyOwned, setAlreadyOwned] = useState<OwnedMatch | null>(null);

  /**
   * Point de passage unique des deux voies. La vérification de doublon vit ici
   * pour couvrir aussi bien le scan que la recherche par artiste ou titre.
   */
  const attach = (metadata: ReleaseMetadata) => {
    setAttached(metadata);
    setArtist(metadata.artist);
    setTitle(metadata.title);
    setResults(null);
    setAlreadyOwned(null);

    startSearch(async () => {
      const owned = await findOwnedVinylAction(
        metadata.discogsMasterId ?? undefined,
        excludeVinylId,
      );

      // Un échec de cette vérification ne doit pas empêcher l'ajout.
      if (owned.success && owned.alreadyOwned) {
        setAlreadyOwned(owned.alreadyOwned);
      }
    });
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
    setAlreadyOwned(null);
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
    alreadyOwned,
    attach,
    detach: () => {
      setAttached(null);
      setAlreadyOwned(null);
    },
    run,
    pick,
    reset,
  };
}
