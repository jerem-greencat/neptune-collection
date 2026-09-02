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
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-sm max-h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
