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
