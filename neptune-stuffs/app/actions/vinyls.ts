"use server";

import { ObjectId } from "mongodb";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { normalizeBarcode } from "@/lib/barcode";
import { describeExternalError } from "@/lib/collections/errors";
import {
  barcodeField,
  barcodeFields,
  buildUpdate,
  definedFields,
  describeValidationError,
  releaseFields,
} from "@/lib/collections/fields";
import { findByBarcode } from "@/lib/collections/lookup";
import type {
  BarcodeLookupResult,
  OwnedMatch,
  ReleasePickResult,
  ReleaseSearchResult,
} from "@/lib/collections/types";
import { UNAUTHORIZED } from "@/lib/collections/types";
import { getMaster, lookupBarcode, searchMasters } from "@/lib/discogs";
import { describeDatabaseError, getDb, VINYLS_CACHE_TAG } from "@/lib/mongodb";
import { isSessionValid } from "@/lib/session";

const vinylSchema = z.object({
  artist: z.string().min(1, "Le nom de l'artiste est requis."),
  title: z.string().min(1, "Le titre est requis."),
  barcode: barcodeField,
  ...releaseFields,
});

const deleteVinylSchema = z.object({
  vinylId: z.string().min(1, "L'ID du vinyle est requis."),
});

const updateVinylSchema = z.object({
  vinylId: z.string().min(1, "L'ID du vinyle est requis."),
  artist: z.string().min(1, "Le nom de l'artiste est requis."),
  title: z.string().min(1, "Le titre est requis."),
  barcode: barcodeField,
  ...releaseFields,
});

/** Signale aux lecteurs et au routeur que la collection a changé. */
function announceChange() {
  updateTag(VINYLS_CACHE_TAG);
  revalidatePath("/vinyls");
}

export async function addVinylAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const parsed = vinylSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: "Veuillez remplir tous les champs." };
  }

  try {
    const db = await getDb();
    const { artist, title, barcode, ...release } = parsed.data;

    await db.collection("vinyls").insertOne({
      artist,
      title,
      ...barcodeFields(barcode),
      ...definedFields(release),
    });

    announceChange();
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout du vinyle:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

export async function deleteVinylAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const parsed = deleteVinylSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: "ID du vinyle manquant." };
  }

  try {
    const db = await getDb();

    await db
      .collection("vinyls")
      .deleteOne({ _id: new ObjectId(parsed.data.vinylId) });

    announceChange();
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du vinyle:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

export async function updateVinylAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const parsed = updateVinylSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: describeValidationError(parsed.error) };
  }

  try {
    const db = await getDb();
    const { vinylId, artist, title, barcode, ...release } = parsed.data;

    // Les champs de fiche absents du formulaire laissent l'existant intact.
    await db
      .collection("vinyls")
      .updateOne(
        { _id: new ObjectId(vinylId) },
        buildUpdate({ artist, title, ...definedFields(release) }, barcode),
      );

    announceChange();
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du vinyle:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

/**
 * Cherche un vinyle par code-barres : d'abord dans la collection, puis sur
 * Discogs pour pré-remplir le formulaire.
 */
export async function lookupVinylBarcodeAction(
  rawBarcode: string,
): Promise<BarcodeLookupResult> {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const barcode = normalizeBarcode(rawBarcode);

  if (!barcode) {
    return { success: false, error: "Saisissez un code-barres." };
  }

  let alreadyOwned: OwnedMatch | null = null;

  try {
    alreadyOwned = await findByBarcode("vinyls", barcode);
  } catch (error) {
    console.error("Erreur lors de la recherche du code-barres:", error);
    return { success: false, error: describeDatabaseError(error) };
  }

  try {
    return {
      success: true,
      alreadyOwned,
      metadata: await lookupBarcode(barcode),
    };
  } catch (error) {
    console.error("Erreur Discogs:", error);

    // La collection a répondu : on rend ce qu'on sait plutôt que rien.
    return {
      success: false,
      alreadyOwned,
      error: describeExternalError(error, "La recherche Discogs a échoué."),
    };
  }
}

/**
 * Recherche de vinyles par artiste et/ou titre. Complète la recherche par
 * code-barres, qui suppose d'avoir le disque en main.
 *
 * Les deux critères sont transmis séparément à Discogs : une recherche libre
 * sur un nom d'artiste saturait la liste avec les rééditions de son album
 * homonyme.
 */
export async function searchVinylsAction(
  artist: string,
  title: string,
): Promise<ReleaseSearchResult> {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  if (!artist.trim() && !title.trim()) {
    return { success: true, releases: [] };
  }

  try {
    return { success: true, releases: await searchMasters({ artist, title }) };
  } catch (error) {
    console.error("Erreur Discogs:", error);

    return {
      success: false,
      error: describeExternalError(error, "La recherche Discogs a échoué."),
    };
  }
}

/**
 * Lit la fiche de l'album choisi dans la liste. La recherche ne rend qu'un
 * artiste et un titre découpés approximativement ; la fiche les rend propres et
 * donne l'année de sortie d'origine.
 */
export async function pickVinylMasterAction(
  discogsMasterId: number,
): Promise<ReleasePickResult> {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  if (!Number.isInteger(discogsMasterId) || discogsMasterId <= 0) {
    return { success: false, error: "Référence Discogs invalide." };
  }

  try {
    return { success: true, metadata: await getMaster(discogsMasterId) };
  } catch (error) {
    console.error("Erreur Discogs:", error);

    return {
      success: false,
      error: describeExternalError(error, "La lecture de la fiche a échoué."),
    };
  }
}
