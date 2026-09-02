/**
 * Manipulation des codes-barres du commerce.
 *
 * Ce module ne dépend d'aucune source externe : la normalisation vaut pour la
 * saisie manuelle, le scan et les données venues de Discogs.
 */

/** Ne garde que les chiffres : les codes saisis ou scannés arrivent parfois espacés. */
export function normalizeBarcode(barcode: string): string {
  return barcode.replace(/\D/g, "");
}

/**
 * Les écritures équivalentes d'un même code-barres.
 *
 * Un produit américain porte un UPC-A de 12 chiffres, et le même produit
 * s'écrit en EAN-13 avec un zéro devant. Les deux désignent le même disque mais
 * ne sont pas la même chaîne : Discogs enregistre « 602537540433 » là où un scan
 * de la même étiquette rend « 0602537540433 ». Sans cette équivalence, un
 * disque déjà possédé passerait pour inconnu.
 */
export function barcodeVariants(barcode: string): string[] {
  const normalized = normalizeBarcode(barcode);

  if (!normalized) {
    return [];
  }

  if (normalized.length === 13 && normalized.startsWith("0")) {
    return [normalized, normalized.slice(1)];
  }

  if (normalized.length === 12) {
    return [normalized, `0${normalized}`];
  }

  return [normalized];
}
