"use client";

interface HiddenFieldsProps {
  values: Record<string, string | number | null | undefined>;
}

/**
 * Transmet au formulaire les champs d'une fiche associée.
 *
 * La règle centrale est de n'émettre que les valeurs réellement présentes. Un
 * champ caché laissé vide arrive en chaîne vide côté serveur, que `z.coerce`
 * convertit en 0, qui échoue à la validation — l'enregistrement entier partait
 * en erreur pour un identifiant manquant. C'est un bug qui s'est produit, d'où
 * ce composant plutôt qu'une condition recopiée à chaque champ.
 */
export default function HiddenFields({ values }: HiddenFieldsProps) {
  return (
    <>
      {Object.entries(values).flatMap(([name, value]) =>
        value === null || value === undefined || value === ""
          ? []
          : [<input key={name} type="hidden" name={name} value={value} />],
      )}
    </>
  );
}
