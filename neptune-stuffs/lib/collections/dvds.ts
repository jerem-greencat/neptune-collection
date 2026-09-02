import type { Filter, ObjectId } from "mongodb";
import { unstable_cache } from "next/cache";
import {
  buildSearchRegex,
  DVDS_CACHE_TAG,
  FRENCH_COLLATION,
  getDb,
} from "@/lib/mongodb";
import type { Dvd } from "./types";

/** Le document tel qu'il est stocké, avant sérialisation pour le rendu. */
interface DvdDocument {
  _id: ObjectId;
  title: string;
  barcode?: string;
  year?: number;
  directors?: string;
  kind?: string;
}

/**
 * Mise en cache côté serveur : évite de repayer le réveil du cluster Atlas à
 * chaque navigation. Invalidé par `updateTag(DVDS_CACHE_TAG)` dans les server
 * actions ; le `revalidate` n'est qu'un filet pour les modifications faites
 * directement en base.
 *
 * L'`ObjectId` ne survit pas à la sérialisation du cache, d'où la conversion
 * en chaîne avant de sortir d'ici.
 */
export const getDvds = unstable_cache(
  async (query: string): Promise<Dvd[]> => {
    const db = await getDb();

    const filter: Filter<DvdDocument> = query
      ? { title: { $regex: buildSearchRegex(query) } }
      : {};

    const dvds = await db
      .collection<DvdDocument>("dvds")
      .find(filter)
      .collation(FRENCH_COLLATION)
      .sort({ title: 1 })
      .toArray();

    return dvds.map((dvd) => ({
      id: dvd._id.toString(),
      title: dvd.title,
      barcode: dvd.barcode,
      year: dvd.year,
      directors: dvd.directors,
      kind: dvd.kind,
    }));
  },
  ["dvds-list"],
  { tags: [DVDS_CACHE_TAG], revalidate: 300 },
);
