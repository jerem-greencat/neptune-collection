/**
 * Classes partagées par les formulaires.
 *
 * Elles étaient recopiées à l'identique dans une douzaine d'endroits, ce qui
 * rendait toute retouche visuelle risquée : il fallait n'en oublier aucun.
 */
export const INPUT_CLASS =
  "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline";

export const LABEL_CLASS = "block text-gray-700 text-sm font-bold mb-2";

export const PRIMARY_BUTTON_CLASS =
  "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-indigo-300";

export const SECONDARY_BUTTON_CLASS =
  "bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50";

/** Bouton d'action accolé à un champ, plus compact que les précédents. */
export const INLINE_BUTTON_CLASS =
  "flex items-center gap-1 shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded disabled:opacity-50";

export const DANGER_BUTTON_CLASS =
  "bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-red-300";
