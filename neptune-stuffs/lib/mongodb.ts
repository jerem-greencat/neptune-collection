import {
  type Db,
  MongoClient,
  MongoNetworkError,
  MongoServerSelectionError,
} from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

const DATABASE_NAME = "neptune-collection";

const options = {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000,
  maxIdleTimeMS: 60_000,
  maxPoolSize: 10,
  retryReads: true,
  retryWrites: true,
};

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function connect(): Promise<MongoClient> {
  const client = new MongoClient(uri, options);

  return client.connect().catch((error) => {
    globalWithMongo._mongoClientPromise = undefined;
    throw error;
  });
}

export default function getMongoClient(): Promise<MongoClient> {
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = connect();
  }

  return globalWithMongo._mongoClientPromise;
}

/**
 * Raccourci vers la base : le couple client + nom de base se répétait dans
 * chaque lecture et chaque écriture.
 */
export async function getDb(): Promise<Db> {
  const client = await getMongoClient();

  return client.db(DATABASE_NAME);
}

/**
 * Tags du cache de données. Les lectures des pages sont mises en cache sous
 * ces tags, et les server actions les invalident après chaque écriture.
 */
export const DVDS_CACHE_TAG = "dvds";
export const VINYLS_CACHE_TAG = "vinyls";

/**
 * Sans collation, MongoDB trie en binaire : les majuscules passent avant les
 * minuscules et les accents se retrouvent en fin de liste.
 */
export const FRENCH_COLLATION = { locale: "fr", strength: 1 } as const;

/** Recherche insensible à la casse, en neutralisant les métacaractères. */
export function buildSearchRegex(query: string): RegExp {
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(escaped, "i");
}

export function isDatabaseUnreachable(error: unknown): boolean {
  return (
    error instanceof MongoServerSelectionError ||
    error instanceof MongoNetworkError
  );
}

export function describeDatabaseError(error: unknown): string {
  return isDatabaseUnreachable(error)
    ? "La base de données n'est pas joignable pour le moment. Réessayez dans quelques instants."
    : "Une erreur est survenue sur le serveur.";
}
