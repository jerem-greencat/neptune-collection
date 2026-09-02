import { DiscogsError } from "@/lib/discogs";
import { WikidataError } from "@/lib/wikidata";

/**
 * Message à montrer pour une panne de source externe.
 *
 * Les erreurs typées portent déjà un message rédigé pour l'utilisateur (délai
 * dépassé, limite de débit atteinte…) ; tout le reste est un imprévu et reçoit
 * le message générique de l'appelant.
 */
export function describeExternalError(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof DiscogsError || error instanceof WikidataError) {
    return error.message;
  }

  return fallback;
}
