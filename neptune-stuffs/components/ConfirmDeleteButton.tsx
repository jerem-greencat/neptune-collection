"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import {
  DANGER_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/components/ui/styles";
import type { ActionResult } from "@/lib/collections/types";

interface ConfirmDeleteButtonProps {
  /** Nom du champ attendu par l'action, par exemple « dvdId ». */
  idName: string;
  id: string;
  /** Ce qui est nommé dans la confirmation : « Massive Attack - Mezzanine ». */
  label: string;
  /** Phrase de confirmation, propre à la collection concernée. */
  question: string;
  action: (formData: FormData) => Promise<ActionResult>;
}

/** Suppression avec confirmation, commune aux vinyles et aux dvds. */
export default function ConfirmDeleteButton({
  idName,
  id,
  label,
  question,
  action,
}: ConfirmDeleteButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await action(formData);

      if (result.success) {
        setIsModalOpen(false);
      } else {
        setErrorMessage(result.error || "Une erreur inconnue est survenue.");
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrorMessage(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex gap-2 text-red-500 hover:text-red-700 text-sm font-medium"
        aria-label={`Supprimer ${label}`}
      >
        Supprimer <span className="hidden md:block">🗑️</span>
      </button>

      {isModalOpen && (
        <Modal title="Confirmer" onClose={handleCloseModal}>
          <p className="text-gray-700 mb-6">
            {question}
            <br />
            <strong className="text-indigo-600 block mt-2">{label}</strong>
          </p>

          <form action={handleSubmit}>
            <input type="hidden" name={idName} value={id} />

            {errorMessage && (
              <p className="text-red-500 text-xs italic mb-4">{errorMessage}</p>
            )}

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isPending}
                className={SECONDARY_BUTTON_CLASS}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={DANGER_BUTTON_CLASS}
              >
                {isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
