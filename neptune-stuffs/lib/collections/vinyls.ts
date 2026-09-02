import type { Filter, ObjectId } from "mongodb";
import { unstable_cache } from "next/cache";
import {
  buildSearchRegex,
  FRENCH_COLLATION,
  getDb,
  VINYLS_CACHE_TAG,
} from "@/lib/mongodb";
import type { Vinyl } from "./types";

/** Le document tel qu'il est stocké, avant sérialisation pour le rendu. */
interface VinylDocument {
  _id: ObjectId;
  artist: string;
  title: string;
  barcode?: string;
  year?: number;
}

/**
 * Voir `getDvds` pour le détail de la mise en cache. Le tri secondaire sur le
 * titre donne un ordre stable aux disques d'un même artiste.
 */
export const getVinyls = unstable_cache(
  async (query: string): Promise<Vinyl[]> => {
    const db = await getDb();

    let filter: Filter<VinylDocument> = {};

    if (query) {
      const regex = buildSearchRegex(query);
      filter = {
        $or: [{ title: { $regex: regex } }, { artist: { $regex: regex } }],
      };
    }

    const vinyls = await db
      .collection<VinylDocument>("vinyls")
      .find(filter)
      .collation(FRENCH_COLLATION)
      .sort({ artist: 1, title: 1 })
      .toArray();

    return vinyls.map((vinyl) => ({
      id: vinyl._id.toString(),
      artist: vinyl.artist,
      title: vinyl.title,
      barcode: vinyl.barcode,
      year: vinyl.year,
    }));
  },
  ["vinyls-list"],
  { tags: [VINYLS_CACHE_TAG], revalidate: 300 },
);
