import { DiscogsError } from "./types";

const DISCOGS_API = "https://api.discogs.com";
// 12 s : sous limitation de débit, Discogs ralentit les réponses au lieu de
// renvoyer un 429, et 8 s ne suffisaient pas.
const TIMEOUT_MS = 12000;

/** Discogs rejette les requêtes sans User-Agent identifiable. */
const USER_AGENT = "NeptuneCollects/0.1";

/**
 * Le jeton est facultatif : l'API répond sans, mais avec une limite de débit
 * plus basse. Définir DISCOGS_TOKEN si les recherches commencent à être
 * refusées.
 */
function buildHeaders(): HeadersInit {
  const token = process.env.DISCOGS_TOKEN;

  return {
    "User-Agent": USER_AGENT,
    ...(token ? { Authorization: `Discogs token=${token}` } : {}),
  };
}

export async function discogsFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${DISCOGS_API}${path}`, {
      headers: buildHeaders(),
      signal: controller.signal,
      cache: "no-store",
    });

    if (response.status === 429) {
      throw new DiscogsError("Trop de recherches d'affilée.", true);
    }

    if (!response.ok) {
      throw new DiscogsError(`Discogs a répondu ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DiscogsError) throw error;

    if (error instanceof Error && error.name === "AbortError") {
      throw new DiscogsError("Discogs met trop de temps à répondre.");
    }

    throw new DiscogsError("Discogs n'est pas joignable.");
  } finally {
    clearTimeout(timeout);
  }
}

export function normalizeBarcode(barcode: string): string {
  return barcode.replace(/\D/g, "");
}
