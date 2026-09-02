import { z } from "zod";
import { normalizeBarcode } from "@/lib/barcode";

/** Facultatif : un disque saisi à la main n'a pas forcément de code-barres. */
export const barcodeField = z.string().optional();

/** Champs issus de Discogs : absents si le vinyle est saisi entièrement à la main. */
export const releaseFields = {
  year: z.coerce.number().int().min(1880).max(2200).optional(),
  discogsReleaseId: z.coerce.number().int().positive().optional(),
  discogsMasterId: z.coerce.number().int().positive().optional(),
};

/**
 * Champs issus de Wikidata : absents si le dvd est saisi entièrement à la main.
 * Pas de jaquette pour l'instant — aucune source librement réutilisable n'en
 * fournit, une photo de la jaquette réelle viendra plus tard.
 */
export const filmFields = {
  year: z.coerce.number().int().min(1880).max(2200).optional(),
  wikidataId: z
    .string()
    .regex(/^Q\d+$/, "Identifiant Wikidata invalide.")
    .optional(),
  imdbId: z
    .string()
    .regex(/^tt\d+$/, "Identifiant IMDb invalide.")
    .optional(),
  directors: z.string().max(300).optional(),
  kind: z.string().max(80).optional(),
};

/**
 * Ne retient que les champs réellement fournis, pour ne pas écrire des
 * `undefined` ni effacer une fiche déjà associée quand le formulaire ne la
 * transmet pas.
 */
export function definedFields(
  fields: Record<string, string | number | undefined>,
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number>;
}

/** Le code-barres n'est écrit que s'il contient quelque chose. */
export function barcodeFields(raw: string | undefined): { barcode?: string } {
  const barcode = normalizeBarcode(raw ?? "");

  return barcode ? { barcode } : {};
}

/**
 * Construit le document de mise à jour. Le code-barres doit être fusionné dans
 * le même `$set` que les autres champs : deux `$set` dans le même objet, et le
 * second écrase silencieusement le premier.
 *
 * Vider le champ retire le code-barres du document.
 */
export function buildUpdate(
  fields: Record<string, string | number>,
  rawBarcode: string | undefined,
) {
  const barcode = normalizeBarcode(rawBarcode ?? "");

  return barcode
    ? { $set: { ...fields, barcode } }
    : { $set: fields, $unset: { barcode: "" } };
}

/** Rassemble les messages de validation en une phrase affichable. */
export function describeValidationError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(", ");
}
