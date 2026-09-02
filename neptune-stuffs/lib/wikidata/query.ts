/** Wikidata exige un User-Agent identifiable et bloque les requêtes anonymes. */
export const USER_AGENT = "NeptuneCollects/0.1";

export const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

// 20 s : l'endpoint public est très variable. La même recherche mesurée à
// 1,4 s peut prendre 11 s quelques minutes plus tard, sans que la requête
// change. Mieux vaut attendre qu'échouer alors que la réponse arrivait.
export const TIMEOUT_MS = 20000;

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
export function buildQuery(search: string): string {
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
