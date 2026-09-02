import type { ReleaseMetadata, ReleaseSummary } from "@/lib/discogs";
import type { MovieSummary } from "@/lib/wikidata";

/** Un disque déjà présent dans la collection, repéré par son code-barres. */
export interface OwnedMatch {
  id: string;
  label: string;
}

/** Forme commune à toutes les server actions. */
export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * `alreadyOwned` répond à la question posée en magasin — « est-ce que je l'ai
 * déjà ? » — et se remplit même quand la source externe ne connaît pas le
 * code-barres.
 */
export interface BarcodeLookupResult extends ActionResult {
  alreadyOwned?: OwnedMatch | null;
  metadata?: ReleaseMetadata | null;
}

export interface MovieSearchResult extends ActionResult {
  movies?: MovieSummary[];
}

export interface ReleaseSearchResult extends ActionResult {
  releases?: ReleaseSummary[];
}

export interface ReleasePickResult extends ActionResult {
  metadata?: ReleaseMetadata | null;
}

export const UNAUTHORIZED = {
  success: false,
  error: "Session expirée, veuillez vous reconnecter.",
} as const;

/** Champs affichés par la liste des vinyles. */
export interface Vinyl {
  id: string;
  artist: string;
  title: string;
  barcode?: string;
  year?: number;
}

/** Champs affichés par la liste des dvds. */
export interface Dvd {
  id: string;
  title: string;
  barcode?: string;
  year?: number;
  directors?: string;
  kind?: string;
}
