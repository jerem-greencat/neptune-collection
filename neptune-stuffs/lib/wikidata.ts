const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const TIMEOUT_MS = 15000;

/** Wikidata exige un User-Agent identifiable et bloque les requêtes anonymes. */
const USER_AGENT = "NeptuneCollects/0.1";

export interface MovieSummary {
  wikidataId: string;
  title: string;
  year: number | null;
  /**
   * Réalisateur, ou créateur à défaut : les séries n'ont généralement pas de
   * réalisateur au niveau de l'œuvre entière.
   */
  directors: string | null;
  /** « film », « série télévisée », « film d'animation »… tel que Wikidata le classe. */
  kind: string | null;
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
 * filtrage sur les œuvres audiovisuelles, puis année, générique, type et
 * identifiant IMDb.
 *
 * Quatre points méritent explication, tous tirés d'un usage réel :
 *
 * - Le `VALUES ?class` couvre film ET série : une série télévisée n'est pas
 *   une sous-classe de film, elle était donc invisible. Le `P279*` sous chaque
 *   classe rattrape documentaires, films d'animation, téléfilms et séries
 *   d'animation.
 * - `COALESCE` sur les dates : les séries n'ont pas de date de publication mais
 *   une date de début de diffusion. L'ordre compte — prendre la date de
 *   création en premier daterait un film à son début de tournage.
 * - Le générique retombe sur le créateur (P170) quand il n'y a pas de
 *   réalisateur (P57), ce qui est le cas courant des séries.
 * - Le titre retombe sur celui de l'article Wikipédia : certaines fiches, dont
 *   « Friends », n'ont aucun libellé en français ni en anglais alors que les
 *   articles existent.
 */
function buildQuery(search: string): string {
  return `SELECT ?item ?itemLabel
  (MIN(?anyYear) AS ?year)
  (SAMPLE(?frName) AS ?frTitle)
  (SAMPLE(?enName) AS ?enTitle)
  (GROUP_CONCAT(DISTINCT ?dirLabel; separator=", ") AS ?directors)
  (GROUP_CONCAT(DISTINCT ?creatorLabel; separator=", ") AS ?creators)
  (SAMPLE(?kindLabel) AS ?kind)
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
  VALUES ?class { wd:Q11424 wd:Q5398426 wd:Q15416 wd:Q1259759 }
  ?item wdt:P31/wdt:P279* ?class .
  OPTIONAL {
    ?item wdt:P31 ?kind .
    ?kind rdfs:label ?kindLabel .
    FILTER(LANG(?kindLabel) = "fr")
  }
  OPTIONAL { ?item wdt:P577 ?published . }
  OPTIONAL { ?item wdt:P580 ?started . }
  OPTIONAL { ?item wdt:P571 ?created . }
  BIND(YEAR(COALESCE(?published, ?started, ?created)) AS ?anyYear)
  OPTIONAL {
    ?item wdt:P57 ?director .
    ?director rdfs:label ?dirLabel .
    FILTER(LANG(?dirLabel) = "fr")
  }
  OPTIONAL {
    ?item wdt:P170 ?creator .
    ?creator rdfs:label ?creatorLabel .
    FILTER(LANG(?creatorLabel) = "fr")
  }
  OPTIONAL { ?item wdt:P345 ?imdb }
  OPTIONAL {
    ?frArticle schema:about ?item ;
      schema:isPartOf <https://fr.wikipedia.org/> ;
      schema:name ?frName .
  }
  OPTIONAL {
    ?enArticle schema:about ?item ;
      schema:isPartOf <https://en.wikipedia.org/> ;
      schema:name ?enName .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
GROUP BY ?item ?itemLabel
ORDER BY DESC(?year)
LIMIT 12`;
}

interface SparqlResponse {
  results?: {
    bindings?: Record<string, { value?: string }>[];
  };
}

/** Le service de libellés rend l'identifiant brut quand aucun libellé n'existe. */
function isRawIdentifier(label: string): boolean {
  return /^Q\d+$/.test(label);
}

function splitNames(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * Choisit le générique à afficher, et le borne.
 *
 * Wikidata attache à une série le réalisateur de *chaque épisode* : Breaking
 * Bad en compte 25. Au-delà de trois noms il s'agit donc d'une liste
 * d'épisodes, et le créateur de la série est plus parlant. On tronque ensuite,
 * parce qu'une ligne de liste n'a pas la place pour davantage.
 */
function pickCredits(
  directors: string | undefined,
  creators: string | undefined,
): string | null {
  const directorNames = splitNames(directors);
  const creatorNames = splitNames(creators);

  const chosen =
    directorNames.length > 3 && creatorNames.length > 0
      ? creatorNames
      : directorNames.length > 0
        ? directorNames
        : creatorNames;

  if (chosen.length === 0) {
    return null;
  }

  return chosen.length > 3
    ? `${chosen.slice(0, 3).join(", ")}…`
    : chosen.join(", ");
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

      if (!uri) {
        return [];
      }

      const label = row.itemLabel?.value?.trim() ?? "";
      const title =
        label && !isRawIdentifier(label)
          ? label
          : (row.frTitle?.value?.trim() ?? row.enTitle?.value?.trim() ?? "");

      if (!title) {
        return [];
      }

      const year = Number.parseInt(row.year?.value ?? "", 10);
      const directors = pickCredits(row.directors?.value, row.creators?.value);

      return [
        {
          wikidataId: uri.split("/").pop() ?? "",
          title,
          year: Number.isFinite(year) ? year : null,
          directors,
          kind: row.kind?.value?.trim() || null,
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
