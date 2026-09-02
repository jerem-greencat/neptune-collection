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
  filmFields,
} from "@/lib/collections/fields";
import { findByBarcode } from "@/lib/collections/lookup";
import type {
  BarcodeLookupResult,
  MovieSearchResult,
} from "@/lib/collections/types";
import { UNAUTHORIZED } from "@/lib/collections/types";
import { DVDS_CACHE_TAG, describeDatabaseError, getDb } from "@/lib/mongodb";
import { isSessionValid } from "@/lib/session";
import { searchMovies } from "@/lib/wikidata";

const dvdSchema = z.object({
  title: z.string().min(1, "Le titre du dvd est requis."),
  barcode: barcodeField,
  ...filmFields,
});

const deleteDvdSchema = z.object({
  dvdId: z.string().min(1, "L'ID du dvd est requis."),
});

const updateDvdSchema = z.object({
  dvdId: z.string().min(1, "L'ID du dvd est requis."),
  title: z.string().min(1, "Le titre est requis."),
  barcode: barcodeField,
  ...filmFields,
});

/** Signale aux lecteurs et au routeur que la collection a changé. */
function announceChange() {
  updateTag(DVDS_CACHE_TAG);
  revalidatePath("/dvds");
}

export async function addDvdAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const parsed = dvdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: "Veuillez remplir tous les champs." };
  }

  try {
    const db = await getDb();
    const { title, barcode, ...film } = parsed.data;

    await db.collection("dvds").insertOne({
      title,
      ...barcodeFields(barcode),
      ...definedFields(film),
    });

    announceChange();
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout du dvd:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

export async function deleteDvdAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const parsed = deleteDvdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: "ID du dvd manquant." };
  }

  try {
    const db = await getDb();

    await db
      .collection("dvds")
      .deleteOne({ _id: new ObjectId(parsed.data.dvdId) });

    announceChange();
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du dvd:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

export async function updateDvdAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const parsed = updateDvdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: describeValidationError(parsed.error) };
  }

  try {
    const db = await getDb();
    const { dvdId, title, barcode, ...film } = parsed.data;

    // Les champs film absents du formulaire laissent la fiche existante intacte.
    await db
      .collection("dvds")
      .updateOne(
        { _id: new ObjectId(dvdId) },
        buildUpdate({ title, ...definedFields(film) }, barcode),
      );

    announceChange();
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du dvd:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

/**
 * Les DVD n'ont pas d'équivalent Discogs exploitable : le code-barres sert
 * uniquement à repérer un disque déjà présent dans la collection.
 */
export async function findDvdByBarcodeAction(
  rawBarcode: string,
): Promise<BarcodeLookupResult> {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const barcode = normalizeBarcode(rawBarcode);

  if (!barcode) {
    return { success: false, error: "Saisissez un code-barres." };
  }

  try {
    return {
      success: true,
      alreadyOwned: await findByBarcode("dvds", barcode),
    };
  } catch (error) {
    console.error("Erreur lors de la recherche du code-barres:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

/**
 * Recherche une œuvre par titre sur Wikidata (CC0) : films, séries, saisons,
 * documentaires et animation. Rend le titre français, l'année, le type et le
 * générique.
 */
export async function searchMoviesAction(
  query: string,
): Promise<MovieSearchResult> {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  if (!query.trim()) {
    return { success: true, movies: [] };
  }

  try {
    return { success: true, movies: await searchMovies(query) };
  } catch (error) {
    console.error("Erreur Wikidata:", error);

    return {
      success: false,
      error: describeExternalError(error, "La recherche de film a échoué."),
    };
  }
}
