import type { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { OwnedMatch } from "./types";

/** Le minimum nécessaire pour composer un libellé lisible. */
interface LabelledDocument {
  _id: ObjectId;
  artist?: string;
  title: string;
}

/**
 * Cherche un disque déjà possédé à partir de son code-barres.
 *
 * C'est la réponse la plus utile en magasin, et elle ne dépend d'aucune source
 * externe : elle fonctionne même quand Discogs ou Wikidata ne connaissent pas
 * le code.
 */
export async function findByBarcode(
  collection: "vinyls" | "dvds",
  barcode: string,
): Promise<OwnedMatch | null> {
  const db = await getDb();

  const existing = await db
    .collection<LabelledDocument>(collection)
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
