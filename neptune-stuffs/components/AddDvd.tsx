"use client";

import { addDvdAction, findDvdByBarcodeAction } from "@/app/actions";
import { Search } from "lucide-react";
import { useRef, useState, useTransition } from "react";

/**
 * Pas de recherche de métadonnées ici : aucune base gratuite n'indexe
 * correctement les UPC de films. Le code-barres sert à repérer un dvd déjà
 * présent dans la collection, le titre reste saisi à la main.
 */
type LookupFeedback =
  | { kind: "owned"; label: string }
  | { kind: "new" }
  | { kind: "error"; message: string };

export default function AddDvd() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [barcode, setBarcode] = useState("");
  const [isLooking, startLookup] = useTransition();
  const [feedback, setFeedback] = useState<LookupFeedback | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const resetForm = () => {
    setBarcode("");
    setFeedback(null);
    setErrorMessage(null);
    formRef.current?.reset();
  };

  const handleLookup = () => {
    if (!barcode.trim()) return;

    setFeedback(null);

    startLookup(async () => {
      const result = await findDvdByBarcodeAction(barcode);

      if (!result.success) {
        setFeedback({
          kind: "error",
          message: result.error ?? "La recherche a échoué.",
        });
        return;
      }

      setFeedback(
        result.alreadyOwned
          ? { kind: "owned", label: result.alreadyOwned.label }
          : { kind: "new" },
      );
    });
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
        className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Ajouter un Dvd 🎬
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Nouveau Dvd</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form ref={formRef} action={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="barcode"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Code-barres
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    id="barcode"
                    name="barcode"
                    value={barcode}
                    onChange={(event) => setBarcode(event.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={isLooking || !barcode.trim()}
                    className="flex items-center gap-1 shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded disabled:opacity-50"
                  >
                    <Search className="h-4 w-4" aria-hidden="true" />
                    {isLooking ? "..." : "Vérifier"}
                  </button>
                </div>

                {feedback?.kind === "owned" && (
                  <p className="text-amber-700 text-xs mt-2">
                    Tu l'as déjà : {feedback.label}
                  </p>
                )}
                {feedback?.kind === "new" && (
                  <p className="text-green-700 text-xs mt-2">
                    Pas encore dans ta collection.
                  </p>
                )}
                {feedback?.kind === "error" && (
                  <p className="text-red-500 text-xs mt-2">
                    {feedback.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Titre
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              {errorMessage && (
                <p className="text-red-500 text-xs italic mb-4">
                  {errorMessage}
                </p>
              )}

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-indigo-300"
                >
                  {isPending ? "Ajout en cours..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
