import { ObjectId } from "mongodb";
import { barcodeVariants } from "@/lib/barcode";
import { getDb } from "@/lib/mongodb";
import type { OwnedMatch } from "./types";

/** Le minimum nécessaire pour composer un libellé lisible. */
interface LabelledDocument {
  _id: ObjectId;
  artist?: string;
  title: string;
  year?: number;
}

function toOwnedMatch(document: LabelledDocument): OwnedMatch {
  const name = document.artist
    ? `${document.artist} — ${document.title}`
    : document.title;

  return {
    id: document._id.toString(),
    label: document.year ? `${name} (${document.year})` : name,
  };
}

/**
 * Cherche un disque déjà possédé à partir de son code-barres.
 *
 * Un code-barres désigne une **édition** précise. C'est la bonne réponse quand
 * on a l'objet en main, et elle ne dépend d'aucune source externe : elle
 * fonctionne même quand Discogs ou Wikidata ne connaissent pas le code.
 */
export async function findByBarcode(
  collection: "vinyls" | "dvds",
  barcode: string,
): Promise<OwnedMatch | null> {
  const db = await getDb();

  // Un même disque peut être enregistré en UPC-A ou en EAN-13 : on cherche les
  // deux écritures, sinon un scan ne reconnaîtrait pas ce qui vient de Discogs.
  const existing = await db
    .collection<LabelledDocument>(collection)
    .findOne({ barcode: { $in: barcodeVariants(barcode) } });

  return existing ? toOwnedMatch(existing) : null;
}

/**
 * Cherche une œuvre déjà possédée, quelle que soit son édition.
 *
 * Le code-barres ne peut pas répondre à « ai-je déjà ce film, ce disque ? » :
 * deux éditions de la même œuvre portent des codes différents — un film en DVD
 * et en Blu-ray, un album en pressage d'origine et en réédition. Ce qui
 * identifie l'œuvre, c'est son identifiant de référence : Wikidata ou IMDb pour
 * un film, le « master » Discogs pour un disque.
 *
 * `identity` accepte les champs propres à chaque collection ; n'importe lequel
 * qui correspond suffit à signaler le doublon.
 *
 * `excludeId` sert à la modification : sans lui, une fiche se reconnaîtrait
 * elle-même comme doublon.
 */
export async function findOwnedWork(
  collection: "vinyls" | "dvds",
  identity: Record<string, string | number | undefined>,
  excludeId?: string,
): Promise<OwnedMatch | null> {
  const identifiers = Object.entries(identity)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([field, value]) => ({ [field]: value }));

  if (identifiers.length === 0) {
    return null;
  }

  const db = await getDb();

  const existing = await db.collection<LabelledDocument>(collection).findOne({
    $or: identifiers,
    ...(excludeId && ObjectId.isValid(excludeId)
      ? { _id: { $ne: new ObjectId(excludeId) } }
      : {}),
  });

  return existing ? toOwnedMatch(existing) : null;
}
