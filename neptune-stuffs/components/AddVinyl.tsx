"use client";

import {
  addVinylAction,
  lookupVinylBarcodeAction,
  pickVinylMasterAction,
  searchVinylsAction,
} from "@/app/actions";
import type { ReleaseMetadata, ReleaseSummary } from "@/lib/discogs";
import { Search } from "lucide-react";
import { useRef, useState, useTransition } from "react";

type BarcodeFeedback =
  | { kind: "found" }
  | { kind: "unknown" }
  | { kind: "owned"; label: string }
  | { kind: "error"; message: string };

export default function AddVinyl() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [barcode, setBarcode] = useState("");

  const [isLooking, startLookup] = useTransition();
  const [barcodeFeedback, setBarcodeFeedback] =
    useState<BarcodeFeedback | null>(null);

  const [isSearching, startSearch] = useTransition();
  const [results, setResults] = useState<ReleaseSummary[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  /** La fiche Discogs attachée, quelle que soit la voie : code-barres ou recherche. */
  const [attached, setAttached] = useState<ReleaseMetadata | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const resetForm = () => {
    setArtist("");
    setTitle("");
    setBarcode("");
    setBarcodeFeedback(null);
    setResults(null);
    setSearchError(null);
    setAttached(null);
    setErrorMessage(null);
    formRef.current?.reset();
  };

  const applyMetadata = (metadata: ReleaseMetadata) => {
    setAttached(metadata);
    setArtist(metadata.artist);
    setTitle(metadata.title);
  };

  const handleBarcodeLookup = () => {
    if (!barcode.trim()) return;

    setBarcodeFeedback(null);

    startLookup(async () => {
      const result = await lookupVinylBarcodeAction(barcode);

      // Le doublon prime : c'est la réponse la plus utile en magasin.
      if (result.alreadyOwned) {
        setBarcodeFeedback({ kind: "owned", label: result.alreadyOwned.label });
      }

      if (!result.success) {
        if (!result.alreadyOwned) {
          setBarcodeFeedback({
            kind: "error",
            message: result.error ?? "La recherche a échoué.",
          });
        }
        return;
      }

      if (result.metadata) {
        applyMetadata(result.metadata);

        if (!result.alreadyOwned) {
          setBarcodeFeedback({ kind: "found" });
        }
      } else if (!result.alreadyOwned) {
        setBarcodeFeedback({ kind: "unknown" });
      }
    });
  };

  const handleTextSearch = () => {
    if (!artist.trim() && !title.trim()) return;

    setSearchError(null);

    startSearch(async () => {
      const result = await searchVinylsAction(artist, title);

      if (!result.success) {
        setSearchError(result.error ?? "La recherche a échoué.");
        setResults(null);
        return;
      }

      setResults(result.releases ?? []);
    });
  };

  const handlePick = (release: ReleaseSummary) => {
    setSearchError(null);

    startSearch(async () => {
      const result = await pickVinylMasterAction(release.discogsMasterId);

      if (!result.success || !result.metadata) {
        setSearchError(result.error ?? "La lecture de la fiche a échoué.");
        return;
      }

      applyMetadata(result.metadata);
      setResults(null);
    });
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

  const searchDisabled = isSearching || !`${artist} ${title}`.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Ajouter un vinyle ➕
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-sm max-h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Nouveau Vinyle
              </h2>
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
                    placeholder="602537540433"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button
                    type="button"
                    onClick={handleBarcodeLookup}
                    disabled={isLooking || !barcode.trim()}
                    className="shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded disabled:opacity-50"
                  >
                    {isLooking ? "..." : "Chercher"}
                  </button>
                </div>

                {barcodeFeedback?.kind === "owned" && (
                  <p className="text-amber-700 text-xs mt-2">
                    Tu l'as déjà : {barcodeFeedback.label}
                  </p>
                )}
                {barcodeFeedback?.kind === "unknown" && (
                  <p className="text-gray-500 text-xs mt-2">
                    Code-barres inconnu de Discogs. Cherche par artiste ou titre
                    ci-dessous.
                  </p>
                )}
                {barcodeFeedback?.kind === "error" && (
                  <p className="text-red-500 text-xs mt-2">
                    {barcodeFeedback.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="artist"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Artiste
                </label>
                <input
                  type="text"
                  id="artist"
                  name="artist"
                  value={artist}
                  onChange={(event) => setArtist(event.target.value)}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
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
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              {/* Cherche sur ce qui est saisi : artiste seul, titre seul, ou les deux. */}
              <button
                type="button"
                onClick={handleTextSearch}
                disabled={searchDisabled}
                className="flex items-center gap-2 mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded disabled:opacity-50"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                {isSearching
                  ? "Recherche..."
                  : "Chercher la fiche par artiste / titre"}
              </button>

              {searchError && (
                <p className="text-red-500 text-xs mb-4">{searchError}</p>
              )}

              {results?.length === 0 && (
                <p className="text-gray-500 text-xs mb-4">
                  Aucune release trouvée, les champs saisis seront utilisés tels
                  quels.
                </p>
              )}

              {results && results.length > 0 && (
                <ul className="mb-4 border rounded divide-y max-h-60 overflow-y-auto">
                  {results.map((release) => (
                    <li key={release.discogsMasterId}>
                      <button
                        type="button"
                        onClick={() => handlePick(release)}
                        className="block w-full text-left p-2 hover:bg-gray-100"
                      >
                        <span className="block text-sm font-medium break-words">
                          {release.artist ? `${release.artist} — ` : ""}
                          {release.title}
                          {release.year ? ` (${release.year})` : ""}
                        </span>
                        {release.details && (
                          <span className="block text-xs text-gray-500 break-words">
                            {release.details}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {attached && (
                <p className="text-green-700 text-xs mb-4">
                  Fiche Discogs attachée
                  {attached.year ? ` — ${attached.year}` : ""}.{" "}
                  <button
                    type="button"
                    onClick={() => setAttached(null)}
                    className="underline hover:no-underline"
                  >
                    Détacher
                  </button>
                </p>
              )}

              {/* Chaque champ n'est rendu que s'il a une valeur : une chaîne vide
							    serait convertie en 0 et rejetée par le schéma. */}
              {attached && (
                <>
                  {attached.discogsMasterId && (
                    <input
                      type="hidden"
                      name="discogsMasterId"
                      value={attached.discogsMasterId}
                    />
                  )}
                  {attached.discogsReleaseId && (
                    <input
                      type="hidden"
                      name="discogsReleaseId"
                      value={attached.discogsReleaseId}
                    />
                  )}
                  {attached.year && (
                    <input type="hidden" name="year" value={attached.year} />
                  )}
                </>
              )}

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
