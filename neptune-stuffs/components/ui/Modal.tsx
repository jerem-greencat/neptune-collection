"use client";

import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Coque de fenêtre modale, jusqu'ici recopiée dans six composants.
 *
 * Le contenu défile à l'intérieur : les formulaires avec liste de résultats
 * dépassent la hauteur d'un écran de téléphone.
 */
export default function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-sm overflow-y-auto rounded-xl border border-ink-700 bg-ink-900 p-6 shadow-2xl shadow-ink-950/60 sm:p-7">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl leading-none text-paper-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-1 -mt-1 grid h-8 w-8 place-items-center rounded-md text-xl leading-none text-paper-500 transition-colors hover:bg-ink-850 hover:text-paper-50"
          >
            &times;
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
