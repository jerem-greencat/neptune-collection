"use client";

import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import { updateVinylAction } from "@/app/actions/vinyls";
import HiddenFields from "@/components/ui/HiddenFields";
import Modal from "@/components/ui/Modal";
import {
  INLINE_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "@/components/ui/styles";
import TextField from "@/components/ui/TextField";
import { useVinylSearch } from "./useVinylSearch";
import VinylSearchFeedback from "./VinylSearchFeedback";

interface EditVinylButtonProps {
  vinylId: string;
  currentArtist: string;
  currentTitle: string;
  currentBarcode?: string;
  currentYear?: number;
}

export default function EditVinylButton({
  vinylId,
  currentArtist,
  currentTitle,
  currentBarcode,
  currentYear,
}: EditVinylButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [barcode, setBarcode] = useState(currentBarcode ?? "");

  const initial = { artist: currentArtist, title: currentTitle };
  const search = useVinylSearch(initial);

  const resetState = () => {
    setBarcode(currentBarcode ?? "");
    setErrorMessage(null);
    search.reset(initial);
  };

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateVinylAction(formData);

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
        <Modal title="Modifier le vinyle" onClose={handleCloseModal}>
          <form action={handleSubmit}>
            <input type="hidden" name="vinylId" value={vinylId} />

            <TextField
              name="artist"
              label="Artiste"
              value={search.artist}
              onChange={search.setArtist}
              required
            />

            <TextField
              name="title"
              label="Titre"
              value={search.title}
              onChange={search.setTitle}
              required
            />

            <button
              type="button"
              onClick={search.run}
              disabled={
                search.isSearching ||
                (!search.artist.trim() && !search.title.trim())
              }
              className={`mb-4 ${INLINE_BUTTON_CLASS}`}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              {search.isSearching
                ? "Recherche..."
                : "Chercher la fiche Discogs"}
            </button>

            {/* Ce qui est déjà attaché, tant qu'aucune nouvelle fiche n'est choisie. */}
            {!search.attached && currentYear && (
              <p className="text-gray-500 text-xs mb-4">
                Fiche actuelle — {currentYear}
              </p>
            )}

            <VinylSearchFeedback search={search} />

            {/* Sans nouvelle fiche, rien n'est transmis et l'existante est conservée. */}
            <HiddenFields
              values={{
                discogsMasterId: search.attached?.discogsMasterId,
                discogsReleaseId: search.attached?.discogsReleaseId,
                year: search.attached?.year,
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
