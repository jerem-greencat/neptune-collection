import { discogsFetch, normalizeBarcode } from "./client";
import {
  joinArtists,
  type MasterResponse,
  pickImage,
  type ReleaseResponse,
  type SearchResponse,
  splitSearchTitle,
} from "./mapping";
import type { ReleaseMetadata, ReleaseSummary } from "./types";

export { normalizeBarcode } from "./client";
export type { ReleaseMetadata, ReleaseSummary } from "./types";
export { DiscogsError } from "./types";

/**
 * Recherche des albums par artiste et/ou titre.
 *
 * Deux choix importants ici, tirés d'un usage réel :
 *
 * - `type=master` plutôt que `type=release` : une recherche sur « Gorillaz »
 *   en releases rendait huit pressages du seul album homonyme. Les masters
 *   sont les albums, un par entrée.
 * - `artist=` et `release_title=` plutôt que le `q=` générique : `q` classe la
 *   correspondance exacte en tête et sature la liste avec ses rééditions.
 */
export async function searchMasters(criteria: {
  artist?: string;
  title?: string;
}): Promise<ReleaseSummary[]> {
  const artist = criteria.artist?.trim() ?? "";
  const title = criteria.title?.trim() ?? "";

  if (!artist && !title) {
    return [];
  }

  const params = new URLSearchParams({
    type: "master",
    // On est dans la collection de vinyles, les CD sont du bruit.
    format: "Vinyl",
    per_page: "12",
  });

  if (artist) params.set("artist", artist);
  if (title) params.set("release_title", title);

  const search = await discogsFetch<SearchResponse>(
    `/database/search?${params.toString()}`,
  );

  return (search.results ?? []).flatMap((result) => {
    const combined = result.title?.trim();

    if (!combined) {
      return [];
    }

    const parts = [result.format?.join(", "), result.country].filter(Boolean);

    return [
      {
        discogsMasterId: result.id,
        ...splitSearchTitle(combined),
        year: result.year && result.year > 0 ? result.year : null,
        details: parts.length > 0 ? parts.join(" · ") : null,
      },
    ];
  });
}

/**
 * Lit la fiche d'un album. L'année d'un master est celle de la sortie
 * d'origine, ce qui est exactement ce qu'on veut afficher.
 */
export async function getMaster(
  masterId: number,
): Promise<ReleaseMetadata | null> {
  const master = await discogsFetch<MasterResponse>(`/masters/${masterId}`);

  if (!master.id) {
    return null;
  }

  return {
    artist: joinArtists(master.artists),
    title: master.title?.trim() ?? "",
    year: master.year && master.year > 0 ? master.year : null,
    coverUrl: pickImage(master.images),
    discogsReleaseId: master.main_release ?? null,
    discogsMasterId: master.id,
  };
}

/**
 * Lit la fiche d'un pressage précis, puis remonte au master pour l'année de
 * l'album : Mezzanine réédité en 2013 porte `year: 2013` sur la release et
 * 1998 sur le master.
 */
export async function getRelease(
  releaseId: number,
): Promise<ReleaseMetadata | null> {
  const release = await discogsFetch<ReleaseResponse>(`/releases/${releaseId}`);

  if (!release.id) {
    return null;
  }

  let year = release.year && release.year > 0 ? release.year : null;

  if (release.master_id) {
    try {
      const master = await discogsFetch<MasterResponse>(
        `/masters/${release.master_id}`,
      );

      if (master.year && master.year > 0) {
        year = master.year;
      }
    } catch {
      // Sans master, l'année du pressage fait l'affaire.
    }
  }

  return {
    artist: joinArtists(release.artists),
    title: release.title?.trim() ?? "",
    year,
    coverUrl: pickImage(release.images) ?? release.thumb ?? null,
    discogsReleaseId: release.id,
    discogsMasterId: release.master_id ?? null,
  };
}

/** Trouve le pressage correspondant à un code-barres, puis lit sa fiche. */
export async function lookupBarcode(
  barcode: string,
): Promise<ReleaseMetadata | null> {
  const normalized = normalizeBarcode(barcode);

  if (!normalized) {
    return null;
  }

  const search = await discogsFetch<SearchResponse>(
    `/database/search?barcode=${encodeURIComponent(normalized)}&type=release&per_page=5`,
  );

  const firstMatch = search.results?.[0];

  if (!firstMatch) {
    return null;
  }

  return getRelease(firstMatch.id);
}
