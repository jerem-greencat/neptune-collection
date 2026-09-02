import type { MovieSummary } from "./types";

export interface SparqlResponse {
  results?: {
    bindings?: Record<string, { value?: string }>[];
  };
}

/** Le service de libellés rend l'identifiant brut quand aucun libellé n'existe. */
export function isRawIdentifier(label: string): boolean {
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
export function pickCredits(
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
export function parseSeasonQuery(
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
export function buildSeasonLabel(base: string, seasonNumber: number): string {
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

/** Une saison est classée après les œuvres, comme dans le tri de la requête. */
export function isSeasonEntry(entry: MovieSummary): boolean {
  return /saison/i.test(entry.kind ?? "");
}

/** Convertit une ligne de résultat SPARQL, ou l'écarte si elle est inexploitable. */
export function toMovieSummary(
  row: Record<string, { value?: string }>,
): MovieSummary | null {
  const uri = row.item?.value;
  const title = row.itemLabel?.value?.trim() ?? "";

  // Sans identifiant ni libellé exploitable, la fiche n'est pas présentable.
  if (!uri || !title || isRawIdentifier(title)) {
    return null;
  }

  const year = Number.parseInt(row.year?.value ?? "", 10);

  return {
    wikidataId: uri.split("/").pop() ?? "",
    title,
    year: Number.isFinite(year) ? year : null,
    directors: pickCredits(
      row.directors?.value,
      row.creators?.value,
      row.parentCreators?.value,
    ),
    kind: row.kind?.value?.trim() || null,
    imdbId: row.imdbId?.value?.trim() || null,
  };
}
