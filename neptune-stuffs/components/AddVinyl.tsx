"use client";

import { Search } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { addVinylAction, lookupVinylBarcodeAction } from "@/app/actions/vinyls";
import HiddenFields from "@/components/ui/HiddenFields";
import Modal from "@/components/ui/Modal";
import {
  INLINE_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "@/components/ui/styles";
import TextField from "@/components/ui/TextField";
import BarcodeCheck from "./BarcodeCheck";
import { useVinylSearch } from "./useVinylSearch";
import VinylSearchFeedback from "./VinylSearchFeedback";

const EMPTY = { artist: "", title: "" };

export default function AddVinyl() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const search = useVinylSearch(EMPTY);

  const resetForm = () => {
    setBarcode("");
    setErrorMessage(null);
    search.reset(EMPTY);
    formRef.current?.reset();
  };

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await addVinylAction(formData);

      if (result.success) {
        setIsModalOpen(false);
        resetForm();
      } else {
        setErrorMessage(result.error || "Une erreur inconnue est survenue.");
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`mb-6 ${PRIMARY_BUTTON_CLASS}`}
      >
        Ajouter un vinyle ➕
      </button>

      {isModalOpen && (
        <Modal title="Nouveau Vinyle" onClose={handleCloseModal}>
          <form ref={formRef} action={handleSubmit}>
            <BarcodeCheck
              value={barcode}
              onChange={setBarcode}
              check={lookupVinylBarcodeAction}
              onFound={(result) => {
                if (result.metadata) search.attach(result.metadata);
              }}
              placeholder="602537540433"
            />

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

            {/* Cherche sur ce qui est saisi : artiste seul, titre seul, ou les deux. */}
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
                : "Chercher la fiche par artiste / titre"}
            </button>

            <VinylSearchFeedback search={search} detachable />

            <HiddenFields
              values={{
                discogsMasterId: search.attached?.discogsMasterId,
                discogsReleaseId: search.attached?.discogsReleaseId,
                year: search.attached?.year,
              }}
            />

            {errorMessage && (
              <p className="text-red-500 text-xs italic mb-4">{errorMessage}</p>
            )}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isPending}
                className={PRIMARY_BUTTON_CLASS}
              >
                {isPending ? "Ajout en cours..." : "Ajouter"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
