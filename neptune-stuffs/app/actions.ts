"use server";

import { z } from "zod";
import {
  DiscogsError,
  lookupBarcode,
  normalizeBarcode,
  type ReleaseMetadata,
} from "@/lib/discogs";
import { type MovieSummary, searchMovies, WikidataError } from "@/lib/wikidata";
import getMongoClient, {
  describeDatabaseError,
  DVDS_CACHE_TAG,
  VINYLS_CACHE_TAG,
} from "@/lib/mongodb";
import { createSession, destroySession, isSessionValid } from "@/lib/session";
import { revalidatePath, updateTag } from "next/cache";
import { ObjectId } from "mongodb";

const UNAUTHORIZED = {
  success: false,
  error: "Session expirée, veuillez vous reconnecter.",
} as const;

export async function loginAction(formData: FormData) {
  const identifiant = formData.get("identifier");
  const motDePasse = formData.get("password");

  const correctIdentifiant = process.env.APP_IDENTIFIANT;
  const correctMotDePasse = process.env.APP_MOT_DE_PASSE;

  if (identifiant === correctIdentifiant && motDePasse === correctMotDePasse) {
    await createSession();
    return { success: true, message: "Connexion réussie !" };
  }

  return {
    success: false,
    message: "Identifiant ou mot de passe incorrect.",
  };
}

export async function logoutAction() {
  await destroySession();
  return { success: true };
}

/** Facultatif : un disque saisi à la main n'a pas forcément de code-barres. */
const barcodeField = z.string().optional();

const vinylSchema = z.object({
  artist: z.string().min(1, "Le nom de l'artiste est requis."),
  title: z.string().min(1, "Le titre est requis."),
  barcode: barcodeField,
});

/**
 * Champs issus de Wikidata : absents si le dvd est saisi entièrement à la main.
 * Pas de jaquette pour l'instant — aucune source librement réutilisable n'en
 * fournit, une photo de la jaquette réelle viendra plus tard.
 */
const filmFields = {
  year: z.coerce.number().int().min(1880).max(2200).optional(),
  wikidataId: z
    .string()
    .regex(/^Q\d+$/, "Identifiant Wikidata invalide.")
    .optional(),
  imdbId: z
    .string()
    .regex(/^tt\d+$/, "Identifiant IMDb invalide.")
    .optional(),
};

const dvdSchema = z.object({
  title: z.string().min(1, "Le titre du dvd est requis."),
  barcode: barcodeField,
  ...filmFields,
});

function barcodeFields(raw: string | undefined): { barcode?: string } {
  const barcode = normalizeBarcode(raw ?? "");

  return barcode ? { barcode } : {};
}

function buildUpdate(
  fields: Record<string, string>,
  rawBarcode: string | undefined,
) {
  const barcode = normalizeBarcode(rawBarcode ?? "");

  return barcode
    ? { $set: { ...fields, barcode } }
    : { $set: fields, $unset: { barcode: "" } };
}

export async function addDvdAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const data = Object.fromEntries(formData);
  const parsed = dvdSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Veuillez remplir tous les champs." };
  }

  try {
    const client = await getMongoClient();
    const db = client.db("neptune-collection");

    const { title, barcode, year, wikidataId, imdbId } = parsed.data;

    await db.collection("dvds").insertOne({
      title,
      ...barcodeFields(barcode),
      ...(year ? { year } : {}),
      ...(wikidataId ? { wikidataId } : {}),
      ...(imdbId ? { imdbId } : {}),
    });

    updateTag(DVDS_CACHE_TAG);
    revalidatePath("/dvds");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout du dvd:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

const deleteDvdSchema = z.object({
  dvdId: z.string().min(1, "L'ID du dvd est requis."),
});

export async function deleteDvdAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const data = Object.fromEntries(formData);
  const parsed = deleteDvdSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "ID du dvd manquant." };
  }

  try {
    const client = await getMongoClient();
    const db = client.db("neptune-collection");

    await db.collection("dvds").deleteOne({
      _id: new ObjectId(parsed.data.dvdId),
    });

    updateTag(DVDS_CACHE_TAG);
    revalidatePath("/dvds");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du dvd:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

const updateDvdSchema = z.object({
  dvdId: z.string().min(1, "L'ID du dvd est requis."),
  title: z.string().min(1, "Le titre est requis."),
  barcode: barcodeField,
});

export async function updateDvdAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const data = Object.fromEntries(formData);
  const parsed = updateDvdSchema.safeParse(data);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => issue.message)
      .join(", ");
    return { success: false, error: errorMessages };
  }

  try {
    const client = await getMongoClient();
    const db = client.db("neptune-collection");

    const { dvdId, title, barcode } = parsed.data;

    await db
      .collection("dvds")
      .updateOne({ _id: new ObjectId(dvdId) }, buildUpdate({ title }, barcode));

    updateTag(DVDS_CACHE_TAG);
    revalidatePath("/dvds");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du dvd:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

export async function addVinylAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const data = Object.fromEntries(formData);
  const parsed = vinylSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Veuillez remplir tous les champs." };
  }

  try {
    const client = await getMongoClient();
    const db = client.db("neptune-collection");

    await db.collection("vinyls").insertOne({
      artist: parsed.data.artist,
      title: parsed.data.title,
      ...barcodeFields(parsed.data.barcode),
    });

    updateTag(VINYLS_CACHE_TAG);
    revalidatePath("/vinyls");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout du vinyle:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

const deleteVinylSchema = z.object({
  vinylId: z.string().min(1, "L'ID du vinyle est requis."),
});

export async function deleteVinylAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const data = Object.fromEntries(formData);
  const parsed = deleteVinylSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "ID du vinyle manquant." };
  }

  try {
    const client = await getMongoClient();
    const db = client.db("neptune-collection");

    await db.collection("vinyls").deleteOne({
      _id: new ObjectId(parsed.data.vinylId),
    });

    updateTag(VINYLS_CACHE_TAG);
    revalidatePath("/vinyls");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du vinyle:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

const updateVinylSchema = z.object({
  vinylId: z.string().min(1, "L'ID du vinyle est requis."),
  artist: z.string().min(1, "Le nom de l'artiste est requis."),
  title: z.string().min(1, "Le titre est requis."),
  barcode: barcodeField,
});

export async function updateVinylAction(formData: FormData) {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const data = Object.fromEntries(formData);
  const parsed = updateVinylSchema.safeParse(data);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues
      .map((issue) => issue.message)
      .join(", ");
    return { success: false, error: errorMessages };
  }

  try {
    const client = await getMongoClient();
    const db = client.db("neptune-collection");

    const { vinylId, artist, title, barcode } = parsed.data;

    await db
      .collection("vinyls")
      .updateOne(
        { _id: new ObjectId(vinylId) },
        buildUpdate({ artist, title }, barcode),
      );

    updateTag(VINYLS_CACHE_TAG);
    revalidatePath("/vinyls");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du vinyle:", error);
    return { success: false, error: describeDatabaseError(error) };
  }
}

export interface BarcodeLookupResult {
  success: boolean;
  error?: string;
  alreadyOwned?: { id: string; label: string } | null;
  metadata?: ReleaseMetadata | null;
}

async function findByBarcode(
  collection: "vinyls" | "dvds",
  barcode: string,
): Promise<{ id: string; label: string } | null> {
  const client = await getMongoClient();
  const db = client.db("neptune-collection");

  const existing = await db
    .collection<{ _id: ObjectId; artist?: string; title: string }>(collection)
    .findOne({ barcode });

  if (!existing) {
    return null;
  }

  return {
    id: existing._id.toString(),
    label: existing.artist
      ? `${existing.artist} — ${existing.title}`
      : existing.title,
  };
}

export async function lookupVinylBarcodeAction(
  rawBarcode: string,
): Promise<BarcodeLookupResult> {
  if (!(await isSessionValid())) return UNAUTHORIZED;

  const barcode = normalizeBarcode(rawBarcode);

  if (!barcode) {
    return { success: false, error: "Saisissez un code-barres." };
  }

  let alreadyOwned: { id: string; label: string } | null = null;

  try {
    alreadyOwned = await findByBarcode("vinyls", barcode);
  } catch (error) {
    console.error("Erreur lors de la recherche du code-barres:", error);
    return { success: false, error: describeDatabaseError(error) };
  }

  try {
    const metadata = await lookupBarcode(barcode);
    return { success: true, alreadyOwned, metadata };
  } catch (error) {
    console.error("Erreur Discogs:", error);

    return {
      success: false,
      alreadyOwned,
      error:
        error instanceof DiscogsError
          ? error.message
          : "La recherche Discogs a échoué.",
    };
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

export interface MovieSearchResult {
  success: boolean;
  error?: string;
  movies?: MovieSummary[];
}

/**
 * Recherche un film par titre sur Wikidata (CC0). Rend le titre français,
 * l'année et le réalisateur — ce dernier étant ce qui départage les homonymes
 * en l'absence de jaquette.
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
      error:
        error instanceof WikidataError
          ? error.message
          : "La recherche de film a échoué.",
    };
  }
}
