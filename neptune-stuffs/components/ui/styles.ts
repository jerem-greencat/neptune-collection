/**
 * Classes partagées par les formulaires.
 *
 * Centralisées pour qu'une retouche visuelle n'oblige pas à repasser dans une
 * douzaine de composants.
 *
 * Le parti pris : un bouton principal en papier sur fond sombre — l'inverse de
 * l'aplat coloré habituel — et des champs qui reposent sur un filet fin plutôt
 * que sur une ombre. Sur fond sombre, l'ombre ne se voit pas ; le filet, si.
 */

export const INPUT_CLASS =
  "w-full rounded-md border border-ink-700 bg-ink-900/80 px-3 py-2.5 text-paper-50 placeholder:text-paper-600 transition-colors focus:border-groove-400 focus:outline-none focus:ring-1 focus:ring-groove-400/40";

export const LABEL_CLASS = "label-caps block mb-2";

/** Action principale : contraste maximal, une seule par écran. */
export const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md bg-paper-50 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-white disabled:bg-paper-600 disabled:text-ink-800";

/** Action secondaire : présente mais discrète. */
export const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md border border-ink-700 px-4 py-2.5 text-sm font-medium text-paper-200 transition-colors hover:border-ink-600 hover:bg-ink-850 disabled:opacity-50";

/** Bouton accolé à un champ : même hauteur, moins de largeur. */
export const INLINE_BUTTON_CLASS =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-ink-700 px-3 py-2.5 text-sm font-medium text-paper-200 transition-colors hover:border-ink-600 hover:bg-ink-850 disabled:opacity-40";

export const DANGER_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-md bg-alert-500 px-4 py-2.5 text-sm font-semibold text-paper-50 transition-colors hover:bg-alert-400 disabled:opacity-50";

/** Lien d'action dans une ligne de liste. */
export const ROW_ACTION_CLASS =
  "inline-flex items-center gap-1.5 text-xs font-medium text-paper-500 transition-colors hover:text-paper-50";

export const ROW_DANGER_ACTION_CLASS =
  "inline-flex items-center gap-1.5 text-xs font-medium text-paper-500 transition-colors hover:text-alert-400";
