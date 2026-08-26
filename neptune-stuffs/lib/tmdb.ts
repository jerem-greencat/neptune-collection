const TMDB_API = "https://api.themoviedb.org/3";
const TIMEOUT_MS = 8000;

/** Taille de vignette utilisée dans la liste de résultats. */
const POSTER_SIZE = "w154";
const POSTER_BASE = `https://image.tmdb.org/t/p/${POSTER_SIZE}`;

export interface MovieSummary {
  tmdbId: number;
  title: string;
  /** Rempli seulement s'il diffère du titre français, pour lever une ambiguïté. */
  originalTitle: string | null;
  year: number | null;
  posterUrl: string | null;
}

export class TmdbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TmdbError";
  }
}

/**
 * TMDB accepte deux authentifications : un jeton v4 (en-tête Bearer) ou une
 * clé v3 (paramètre d'URL). On accepte les deux, le jeton d'abord.
 */
function buildRequest(path: string): { url: string; headers: HeadersInit } {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (accessToken) {
    return {
      url: `${TMDB_API}${path}`,
      headers: { Authorization: `Bearer ${accessToken}` },
    };
  }

  if (apiKey) {
    const separator = path.includes("?") ? "&" : "?";
    return {
      url: `${TMDB_API}${path}${separator}api_key=${encodeURIComponent(apiKey)}`,
      headers: {},
    };
  }

  throw new TmdbError(
    "TMDB n'est pas configuré : définissez TMDB_ACCESS_TOKEN ou TMDB_API_KEY.",
  );
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const { url, headers } = buildRequest(path);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { ...headers, accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (response.status === 401) {
      throw new TmdbError("Clé TMDB refusée.");
    }

    if (response.status === 429) {
      throw new TmdbError("Trop de recherches d'affilée.");
    }

    if (!response.ok) {
      throw new TmdbError(`TMDB a répondu ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TmdbError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new TmdbError("TMDB met trop de temps à répondre.");
    }

    throw new TmdbError("TMDB n'est pas joignable.");
  } finally {
    clearTimeout(timeout);
  }
}

interface SearchResponse {
  results?: {
    id: number;
    title?: string;
    original_title?: string;
    release_date?: string;
    poster_path?: string | null;
  }[];
}

/**
 * Recherche un film par titre. `language=fr-FR` renvoie le titre de sortie
 * français quand il existe — c'est justement ce qui manque aux bases de
 * codes-barres.
 */
export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const data = await tmdbFetch<SearchResponse>(
    `/search/movie?query=${encodeURIComponent(trimmed)}&language=fr-FR&include_adult=false`,
  );

  return (data.results ?? []).slice(0, 8).map((result) => {
    const title = result.title?.trim() || result.original_title?.trim() || "";
    const originalTitle = result.original_title?.trim() ?? "";
    const year = Number.parseInt(result.release_date?.slice(0, 4) ?? "", 10);

    return {
      tmdbId: result.id,
      title,
      originalTitle:
        originalTitle && originalTitle !== title ? originalTitle : null,
      year: Number.isFinite(year) ? year : null,
      posterUrl: result.poster_path ? `${POSTER_BASE}${result.poster_path}` : null,
    };
  });
}
