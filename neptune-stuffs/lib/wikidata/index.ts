import {
  buildSeasonLabel,
  isSeasonEntry,
  parseSeasonQuery,
  type SparqlResponse,
  toMovieSummary,
} from "./parsing";
import { buildQuery, SPARQL_ENDPOINT, TIMEOUT_MS, USER_AGENT } from "./query";
import { type MovieSummary, WikidataError } from "./types";

export type { MovieSummary } from "./types";
export { WikidataError } from "./types";

/** Exécute une recherche et convertit les lignes en fiches présentables. */
async function runQuery(search: string): Promise<MovieSummary[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(buildQuery(search))}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/sparql-results+json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (response.status === 429) {
      throw new WikidataError("Trop de recherches d'affilée.");
    }

    if (!response.ok) {
      throw new WikidataError(`Wikidata a répondu ${response.status}.`);
    }

    const data = (await response.json()) as SparqlResponse;

    return (data.results?.bindings ?? []).flatMap((row) => {
      const movie = toMovieSummary(row);

      return movie ? [movie] : [];
    });
  } catch (error) {
    if (error instanceof WikidataError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new WikidataError("Wikidata met trop de temps à répondre.");
    }

    throw new WikidataError("Wikidata n'est pas joignable.");
  } finally {
    clearTimeout(timeout);
  }
}

/** Œuvres d'abord, puis saisons par année — même règle que le tri SPARQL. */
function byKindThenYear(left: MovieSummary, right: MovieSummary): number {
  const bySeason = Number(isSeasonEntry(left)) - Number(isSeasonEntry(right));

  if (bySeason !== 0) {
    return bySeason;
  }

  return (
    (left.year ?? Number.POSITIVE_INFINITY) -
    (right.year ?? Number.POSITIVE_INFINITY)
  );
}

/**
 * Recherche par titre.
 *
 * Quand la saisie désigne une saison, deux recherches partent en parallèle : le
 * titre seul, qui trouve la série et ses films, et le libellé canonique de la
 * saison, qui trouve la fiche exacte. C'est nécessaire parce que la recherche
 * Wikidata ne fait que du préfixe de libellé : « supernatural 15 » ne
 * correspond à rien, et la saison 15 est trop mal classée pour ressortir d'une
 * recherche sur « supernatural » seul.
 *
 * Les deux requêtes sont concurrentes, donc le coût en temps est celui de la
 * plus lente, pas leur somme. Regrouper les deux recherches dans une seule
 * requête SPARQL a été tenté : le planificateur s'effondre, au-delà d'une
 * minute.
 */
export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const parsed = parseSeasonQuery(trimmed);

  if (!parsed) {
    return runQuery(trimmed);
  }

  const [baseResults, seasonResults] = await Promise.all([
    runQuery(parsed.base),
    // Une saisie du type « dune 2 » désigne une suite, pas une saison : cette
    // recherche ne rend alors rien, ce qui est sans conséquence.
    runQuery(buildSeasonLabel(parsed.base, parsed.seasonNumber)).catch(
      () => [] as MovieSummary[],
    ),
  ]);

  const merged = [...baseResults];
  const seen = new Set(merged.map((entry) => entry.wikidataId));

  for (const entry of seasonResults) {
    if (!seen.has(entry.wikidataId)) {
      seen.add(entry.wikidataId);
      merged.push(entry);
    }
  }

  return merged.sort(byKindThenYear);
}
