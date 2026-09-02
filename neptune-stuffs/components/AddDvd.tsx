"use client";

import { Search } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { addDvdAction, findDvdByBarcodeAction } from "@/app/actions/dvds";
import HiddenFields from "@/components/ui/HiddenFields";
import Modal from "@/components/ui/Modal";
import {
  INLINE_BUTTON_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "@/components/ui/styles";
import TextField from "@/components/ui/TextField";
import BarcodeCheck from "./BarcodeCheck";
import MovieSearchFeedback from "./MovieSearchFeedback";
import { useMovieSearch } from "./useMovieSearch";

/**
 * Le code-barres ne sert qu'au dédoublonnage : aucune base gratuite n'indexe
 * correctement les UPC de films. Les métadonnées viennent de Wikidata (CC0),
 * par recherche sur le titre.
 */
export default function AddDvd() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");

  const formRef = useRef<HTMLFormElement>(null);
  const search = useMovieSearch("");

  const resetForm = () => {
    setBarcode("");
    setErrorMessage(null);
    search.reset("");
    formRef.current?.reset();
  };

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await addDvdAction(formData);

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
        Ajouter un Dvd 🎬
      </button>

      {isModalOpen && (
        <Modal title="Nouveau Dvd" onClose={handleCloseModal}>
          <form ref={formRef} action={handleSubmit}>
            <BarcodeCheck
              value={barcode}
              onChange={setBarcode}
              check={findDvdByBarcodeAction}
            />

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
              hint={<MovieSearchFeedback search={search} />}
            />

            <HiddenFields
              values={{
                wikidataId: search.picked?.wikidataId,
                year: search.picked?.year,
                imdbId: search.picked?.imdbId,
                directors: search.picked?.directors,
                kind: search.picked?.kind,
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
