const DISCOGS_API = "https://api.discogs.com";
// 12 s : sous limitation de débit, Discogs ralentit les réponses au lieu de
// renvoyer un 429, et 8 s ne suffisaient pas.
const TIMEOUT_MS = 12000;

/** Discogs rejette les requêtes sans User-Agent identifiable. */
const USER_AGENT = "NeptuneCollects/0.1";

export interface ReleaseMetadata {
  artist: string;
  title: string;
  year: number | null;
  coverUrl: string | null;
  /** Le pressage précis, connu quand on part d'un code-barres. */
  discogsReleaseId: number | null;
  /** L'album, indépendant du pressage. */
  discogsMasterId: number | null;
}

export class DiscogsError extends Error {
  rateLimited: boolean;

  constructor(message: string, rateLimited = false) {
    super(message);
    this.name = "DiscogsError";
    this.rateLimited = rateLimited;
  }
}

/**
 * Le jeton est facultatif : l'API répond sans, mais avec une limite de débit
 * plus basse. Définir DISCOGS_TOKEN si les recherches commencent à être
 * refusées.
 */
function buildHeaders(): HeadersInit {
  const token = process.env.DISCOGS_TOKEN;

  return {
    "User-Agent": USER_AGENT,
    ...(token ? { Authorization: `Discogs token=${token}` } : {}),
  };
}

async function discogsFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${DISCOGS_API}${path}`, {
      headers: buildHeaders(),
      signal: controller.signal,
      cache: "no-store",
    });

    if (response.status === 429) {
      throw new DiscogsError("Trop de recherches d'affilée.", true);
    }

    if (!response.ok) {
      throw new DiscogsError(`Discogs a répondu ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DiscogsError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new DiscogsError("Discogs met trop de temps à répondre.");
    }

    throw new DiscogsError("Discogs n'est pas joignable.");
  } finally {
    clearTimeout(timeout);
  }
}

function cleanArtistName(name: string): string {
  return name.replace(/\s*\(\d+\)$/, "").trim();
}

export function normalizeBarcode(barcode: string): string {
  return barcode.replace(/\D/g, "");
}

interface SearchResponse {
  results?: {
    id: number;
    title?: string;
    year?: number;
    format?: string[];
    country?: string;
  }[];
}

interface ReleaseResponse {
  id: number;
  title?: string;
  year?: number;
  master_id?: number;
  artists?: { name: string }[];
  images?: { uri?: string; type?: string }[];
  thumb?: string;
}

interface MasterResponse {
  id: number;
  title?: string;
  year?: number;
  main_release?: number;
  artists?: { name: string }[];
  images?: { uri?: string; type?: string }[];
}

/** Une entrée de la liste de résultats : un album, pas un pressage. */
export interface ReleaseSummary {
  discogsMasterId: number;
  artist: string;
  title: string;
  year: number | null;
  /** Support et pays quand Discogs les donne, pour départager deux éditions. */
  details: string | null;
}

/**
 * Les résultats de recherche collent artiste et titre dans un seul champ
 * (« Gorillaz - Demon Days »). On découpe sur le premier « - » : approximatif,
 * mais suffisant pour choisir. Les champs propres viennent de `getMaster`.
 */
function splitSearchTitle(combined: string): { artist: string; title: string } {
  const separator = combined.indexOf(" - ");

  if (separator === -1) {
    return { artist: "", title: combined.trim() };
  }

  return {
    artist: cleanArtistName(combined.slice(0, separator)),
    title: combined.slice(separator + 3).trim(),
  };
}

function pickImage(images?: { uri?: string; type?: string }[]): string | null {
  const primary =
    images?.find((image) => image.type === "primary") ?? images?.[0];

  return primary?.uri ?? null;
}

function joinArtists(artists?: { name: string }[]): string {
  return (
    artists
      ?.map((entry) => cleanArtistName(entry.name))
      .filter(Boolean)
      .join(", ") ?? ""
  );
}

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
