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

/** Une entrée de la liste de résultats : un album, pas un pressage. */
export interface ReleaseSummary {
  discogsMasterId: number;
  artist: string;
  title: string;
  year: number | null;
  /** Support et pays quand Discogs les donne, pour départager deux éditions. */
  details: string | null;
}
