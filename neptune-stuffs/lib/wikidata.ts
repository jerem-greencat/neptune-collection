const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const TIMEOUT_MS = 15000;

/** Wikidata exige un User-Agent identifiable et bloque les requêtes anonymes. */
const USER_AGENT = "NeptuneCollects/0.1";

export interface MovieSummary {
  wikidataId: string;
  title: string;
  year: number | null;
  /** Réalisateurs joints par ", " : sans affiche, c'est ce qui départage les homonymes. */
  directors: string | null;
  imdbId: string | null;
}

export class WikidataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WikidataError";
  }
}

/**
 * La saisie de l'utilisateur est interpolée dans la requête SPARQL : il faut
 * neutraliser les caractères qui termineraient la chaîne littérale.
 */
function escapeSparqlString(value: string): string {
  const withoutControlChars = Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
    .join("");

  return withoutControlChars.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Une seule requête fait tout : recherche par libellé via le service MWAPI,
 * filtrage sur les films, puis récupération de l'année, des réalisateurs et de
 * l'identifiant IMDb.
 *
 * `P31/P279*` suit les sous-classes de « film » (Q11424), ce qui rattrape les
 * films d'animation, documentaires et téléfilms.
 *
 * `MIN(?year)` est nécessaire : un film porte souvent plusieurs dates de
 * publication (une par pays), ce qui le ferait apparaître en double.
 */
function buildQuery(search: string): string {
  return `SELECT ?item ?itemLabel
  (MIN(?releaseYear) AS ?year)
  (GROUP_CONCAT(DISTINCT ?dirLabel; separator=", ") AS ?directors)
  (SAMPLE(?imdb) AS ?imdbId)
WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:api "EntitySearch" .
    bd:serviceParam wikibase:endpoint "www.wikidata.org" .
    bd:serviceParam mwapi:search "${escapeSparqlString(search)}" .
    bd:serviceParam mwapi:language "fr" .
    bd:serviceParam mwapi:limit "15" .
    ?item wikibase:apiOutputItem mwapi:item .
  }
  ?item wdt:P31/wdt:P279* wd:Q11424 .
  OPTIONAL { ?item wdt:P577 ?date . BIND(YEAR(?date) AS ?releaseYear) }
  OPTIONAL {
    ?item wdt:P57 ?director .
    ?director rdfs:label ?dirLabel .
    FILTER(LANG(?dirLabel) = "fr")
  }
  OPTIONAL { ?item wdt:P345 ?imdb }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
GROUP BY ?item ?itemLabel
ORDER BY DESC(?year)
LIMIT 10`;
}

interface SparqlResponse {
  results?: {
    bindings?: Record<string, { value?: string }>[];
  };
}

export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(buildQuery(trimmed))}`;

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
      const uri = row.item?.value;
      const title = row.itemLabel?.value?.trim();

      if (!uri || !title) {
        return [];
      }

      const wikidataId = uri.split("/").pop() ?? "";
      const year = Number.parseInt(row.year?.value ?? "", 10);
      const directors = row.directors?.value?.trim();

      // Un libellé encore sous forme d'identifiant signale un item sans nom utile.
      if (/^Q\d+$/.test(title)) {
        return [];
      }

      return [
        {
          wikidataId,
          title,
          year: Number.isFinite(year) ? year : null,
          directors: directors ? directors : null,
          imdbId: row.imdbId?.value?.trim() || null,
        },
      ];
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
