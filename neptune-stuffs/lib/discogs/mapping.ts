/** Discogs suffixe les homonymes : "Nirvana (2)" -> "Nirvana". */
function cleanArtistName(name: string): string {
  return name.replace(/\s*\(\d+\)$/, "").trim();
}

export interface SearchResponse {
  results?: {
    id: number;
    title?: string;
    year?: number;
    format?: string[];
    country?: string;
  }[];
}

export interface ReleaseResponse {
  id: number;
  title?: string;
  year?: number;
  master_id?: number;
  artists?: { name: string }[];
  images?: { uri?: string; type?: string }[];
  thumb?: string;
}

export interface MasterResponse {
  id: number;
  title?: string;
  year?: number;
  main_release?: number;
  artists?: { name: string }[];
  images?: { uri?: string; type?: string }[];
}

/**
 * Les résultats de recherche collent artiste et titre dans un seul champ
 * (« Gorillaz - Demon Days »). On découpe sur le premier « - » : approximatif,
 * mais suffisant pour choisir. Les champs propres viennent de `getMaster`.
 */
export function splitSearchTitle(combined: string): {
  artist: string;
  title: string;
} {
  const separator = combined.indexOf(" - ");

  if (separator === -1) {
    return { artist: "", title: combined.trim() };
  }

  return {
    artist: cleanArtistName(combined.slice(0, separator)),
    title: combined.slice(separator + 3).trim(),
  };
}

export function pickImage(
  images?: { uri?: string; type?: string }[],
): string | null {
  const primary =
    images?.find((image) => image.type === "primary") ?? images?.[0];

  return primary?.uri ?? null;
}

export function joinArtists(artists?: { name: string }[]): string {
  return (
    artists
      ?.map((entry) => cleanArtistName(entry.name))
      .filter(Boolean)
      .join(", ") ?? ""
  );
}
