"use client";

import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import { updateDvdAction } from "@/app/actions/dvds";
import HiddenFields from "@/components/ui/HiddenFields";
import Modal from "@/components/ui/Modal";
import {
  INLINE_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/components/ui/styles";
import TextField from "@/components/ui/TextField";
import MovieSearchFeedback from "./MovieSearchFeedback";
import { useMovieSearch } from "./useMovieSearch";

interface EditDvdButtonProps {
  dvdId: string;
  currentTitle: string;
  currentBarcode?: string;
  currentYear?: number;
  currentDirectors?: string;
  currentKind?: string;
}

export default function EditDvdButton({
  dvdId,
  currentTitle,
  currentBarcode,
  currentYear,
  currentDirectors,
  currentKind,
}: EditDvdButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [barcode, setBarcode] = useState(currentBarcode ?? "");

  const search = useMovieSearch(currentTitle);

  const resetState = () => {
    setBarcode(currentBarcode ?? "");
    setErrorMessage(null);
    search.reset(currentTitle);
  };

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateDvdAction(formData);

      if (result.success) {
        setIsModalOpen(false);
      } else {
        setErrorMessage(result.error || "Une erreur inconnue est survenue.");
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetState();
  };

  const currentSheet = [currentKind, currentYear, currentDirectors]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex gap-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
        aria-label={`Modifier ${currentTitle}`}
      >
        Modifier <span className="hidden md:block">✏️</span>
      </button>

      {isModalOpen && (
        <Modal title="Modifier le dvd" onClose={handleCloseModal}>
          <form action={handleSubmit}>
            <input type="hidden" name="dvdId" value={dvdId} />

            <TextField
              name="title"
              label="Titre"
              value={search.title}
              onChange={search.setTitle}
              required
              action={
                <button
                  type="button"
                  onClick={search.run}
                  disabled={search.isSearching || !search.title.trim()}
                  className={INLINE_BUTTON_CLASS}
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  {search.isSearching ? "..." : "Chercher"}
                </button>
              }
              hint={
                <>
                  {/* Ce qui est déjà associé, tant qu'aucune fiche n'est choisie. */}
                  {!search.picked && currentSheet && (
                    <p className="text-gray-500 text-xs mt-2">
                      Fiche actuelle : {currentSheet}
                    </p>
                  )}
                  <MovieSearchFeedback search={search} />
                </>
              }
            />

            {/* Sans nouvelle fiche, rien n'est transmis et l'existante est conservée. */}
            <HiddenFields
              values={{
                wikidataId: search.picked?.wikidataId,
                year: search.picked?.year,
                imdbId: search.picked?.imdbId,
                directors: search.picked?.directors,
                kind: search.picked?.kind,
              }}
            />

            <TextField
              name="barcode"
              label="Code-barres"
              value={barcode}
              onChange={setBarcode}
              numeric
            />

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
                className={PRIMARY_BUTTON_CLASS}
              >
                {isPending ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
