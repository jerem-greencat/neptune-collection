const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
// 20 s : l'endpoint public est très variable. La même recherche mesurée à
// 1,4 s peut prendre 11 s quelques minutes plus tard, sans que la requête
// change. Mieux vaut attendre qu'échouer alors que la réponse arrivait.
const TIMEOUT_MS = 20000;

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
 * - Le `VALUES ?class` couvre film, série ET saison : une série télévisée
 *   n'est pas une sous-classe de film, et une saison n'est pas une sous-classe
 *   de série. Le `P279*` sous chaque classe rattrape documentaires, films
 *   d'animation, téléfilms et séries d'animation.
 * - Le tri met les œuvres avant les saisons, puis va du plus ancien au plus
 *   récent. Une série longue ne peut donc pas évincer sa propre fiche de la
 *   liste, et les saisons sortent dans l'ordre — chronologique et numérique à
 *   la fois.
 * - Les deux limites sont hautes à dessein. Les fiches de saison sont mal
 *   classées par la recherche : pour Supernatural elles occupent les rangs 20
 *   à 48, donc plafonner les candidats à 30 en perdait la moitié. Et une série
 *   de 15 saisons a besoin de place dans le résultat final.
 * - `COALESCE` sur les dates : les séries n'ont pas de date de publication mais
 *   une date de début de diffusion. L'ordre compte — prendre la date de
 *   création en premier daterait un film à son début de tournage.
 * - Le générique retombe sur le créateur (P170) quand il n'y a pas de
 *   réalisateur (P57), ce qui est le cas courant des séries, puis sur le
 *   créateur de la série parente (P179) : une fiche de saison ne porte
 *   généralement aucun générique.
 * - Le service de libellés couvre plusieurs langues : certaines fiches, dont
 *   « Friends », n'ont aucun libellé français ni anglais. Passer par le titre
 *   de l'article Wikipédia donnait un français plus sûr, mais coûtait deux
 *   jointures par ligne et faisait grimper la requête à sept secondes sur une
 *   série longue — trop près du délai d'attente pour un endpoint aussi
 *   variable.
 */
function buildQuery(search: string): string {
  return `SELECT ?item ?itemLabel
  (MAX(?seasonFlag) AS ?isSeason)
  (MIN(?anyYear) AS ?year)
  (GROUP_CONCAT(DISTINCT ?dirLabel; separator=", ") AS ?directors)
  (GROUP_CONCAT(DISTINCT ?creatorLabel; separator=", ") AS ?creators)
  (GROUP_CONCAT(DISTINCT ?parentCreatorLabel; separator=", ") AS ?parentCreators)
  (SAMPLE(?kindLabel) AS ?kind)
  (SAMPLE(?imdb) AS ?imdbId)
WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:api "EntitySearch" .
    bd:serviceParam wikibase:endpoint "www.wikidata.org" .
    bd:serviceParam mwapi:search "${escapeSparqlString(search)}" .
    bd:serviceParam mwapi:language "fr" .
    bd:serviceParam mwapi:limit "50" .
    ?item wikibase:apiOutputItem mwapi:item .
  }
  VALUES ?class { wd:Q11424 wd:Q5398426 wd:Q15416 wd:Q1259759 wd:Q3464665 }
  ?item wdt:P31/wdt:P279* ?class .
  BIND(IF(?class = wd:Q3464665, 1, 0) AS ?seasonFlag)
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
  OPTIONAL {
    ?item wdt:P179 ?parentSeries .
    ?parentSeries wdt:P170 ?parentCreator .
    ?parentCreator rdfs:label ?parentCreatorLabel .
    FILTER(LANG(?parentCreatorLabel) = "fr")
  }
  OPTIONAL { ?item wdt:P345 ?imdb }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en,es,it,pt,nl,de". }
}
GROUP BY ?item ?itemLabel
ORDER BY ?isSeason ?year
LIMIT 25`;
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
  parentCreators: string | undefined,
): string | null {
  const directorNames = splitNames(directors);
  const creatorNames = splitNames(creators);
  const parentNames = splitNames(parentCreators);

  const chosen =
    directorNames.length > 3 && creatorNames.length > 0
      ? creatorNames
      : directorNames.length > 0
        ? directorNames
        : creatorNames.length > 0
          ? creatorNames
          : parentNames;

  if (chosen.length === 0) {
    return null;
  }

  return chosen.length > 3
    ? `${chosen.slice(0, 3).join(", ")}…`
    : chosen.join(", ");
}

/**
 * Reconnaît une saisie qui désigne une saison : « supernatural 15 »,
 * « supernatural saison 15 », « supernatural s15 ».
 *
 * Le numéro doit être en fin de chaîne. Une saisie déjà canonique
 * (« saison 15 de supernatural ») n'est donc pas reconnue ici — elle marche
 * telle quelle.
 */
function parseSeasonQuery(
  query: string,
): { base: string; seasonNumber: number } | null {
  const match = query.match(
    /^(.*?)[\s,]+(?:saisons?|seasons?|s)?\s*(\d{1,3})$/i,
  );

  if (!match) {
    return null;
  }

  const base = match[1].trim();
  const seasonNumber = Number.parseInt(match[2], 10);

  if (!base || !Number.isFinite(seasonNumber) || seasonNumber < 1) {
    return null;
  }

  return { base, seasonNumber };
}

/**
 * Reconstruit le libellé canonique d'une saison, forme française.
 *
 * La recherche Wikidata fonctionne par préfixe de libellé : seule la forme
 * exacte trouve la fiche. Or l'article se contracte avec le titre — « saison 15
 * de Supernatural » mais « saison 20 des Simpson », et le titre perd son
 * article dans le libellé. D'où ce petit travail de grammaire.
 */
function buildSeasonLabel(base: string, seasonNumber: number): string {
  const article = base.match(/^(les|le|la|l')\s*/i);

  if (!article) {
    return `saison ${seasonNumber} de ${base}`;
  }

  const rest = base.slice(article[0].length).trim();
  const kind = article[1].toLowerCase();

  if (kind === "les") return `saison ${seasonNumber} des ${rest}`;
  if (kind === "le") return `saison ${seasonNumber} du ${rest}`;
  if (kind === "la") return `saison ${seasonNumber} de la ${rest}`;

  return `saison ${seasonNumber} de l'${rest}`;
}

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
      const uri = row.item?.value;

      if (!uri) {
        return [];
      }

      const title = row.itemLabel?.value?.trim() ?? "";

      // Sans libellé exploitable, la fiche n'est pas présentable.
      if (!title || isRawIdentifier(title)) {
        return [];
      }

      const year = Number.parseInt(row.year?.value ?? "", 10);
      const directors = pickCredits(
        row.directors?.value,
        row.creators?.value,
        row.parentCreators?.value,
      );

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

/** Une saison est classée après les œuvres, comme dans le tri de la requête. */
function isSeasonEntry(entry: MovieSummary): boolean {
  return /saison/i.test(entry.kind ?? "");
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

  // Même règle que la requête : les œuvres d'abord, puis les saisons par année.
  return merged.sort((left, right) => {
    const bySeason = Number(isSeasonEntry(left)) - Number(isSeasonEntry(right));

    if (bySeason !== 0) {
      return bySeason;
    }

    return (
      (left.year ?? Number.POSITIVE_INFINITY) -
      (right.year ?? Number.POSITIVE_INFINITY)
    );
  });
}
