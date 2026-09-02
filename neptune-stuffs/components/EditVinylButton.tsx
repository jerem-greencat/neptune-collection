"use client";

import {
  pickVinylMasterAction,
  searchVinylsAction,
  updateVinylAction,
} from "@/app/actions";
import type { ReleaseMetadata, ReleaseSummary } from "@/lib/discogs";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";

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

  const [artist, setArtist] = useState(currentArtist);
  const [title, setTitle] = useState(currentTitle);

  const [isSearching, startSearch] = useTransition();
  const [results, setResults] = useState<ReleaseSummary[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Renseigné seulement si une nouvelle fiche est choisie pendant l'édition.
  const [attached, setAttached] = useState<ReleaseMetadata | null>(null);

  const resetState = () => {
    setArtist(currentArtist);
    setTitle(currentTitle);
    setResults(null);
    setSearchError(null);
    setAttached(null);
    setErrorMessage(null);
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

      setAttached(result.metadata);
      setArtist(result.metadata.artist);
      setTitle(result.metadata.title);
      setResults(null);
    });
  };

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateVinylAction(formData);

      if (result.success) {
        setIsModalOpen(false);
        setResults(null);
        setAttached(null);
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
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-sm max-h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Modifier le vinyle
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form action={handleSubmit}>
              <input type="hidden" name="vinylId" value={vinylId} />

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

              <button
                type="button"
                onClick={handleTextSearch}
                disabled={isSearching || !`${artist} ${title}`.trim()}
                className="flex items-center gap-2 mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded disabled:opacity-50"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                {isSearching ? "Recherche..." : "Chercher la fiche Discogs"}
              </button>

              {/* Ce qui est déjà attaché, tant qu'aucune nouvelle fiche n'est choisie. */}
              {!attached && currentYear && (
                <p className="text-gray-500 text-xs mb-4">
                  Fiche actuelle — {currentYear}
                </p>
              )}

              {searchError && (
                <p className="text-red-500 text-xs mb-4">{searchError}</p>
              )}

              {results?.length === 0 && (
                <p className="text-gray-500 text-xs mb-4">
                  Aucune release trouvée.
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
                  Nouvelle fiche{attached.year ? ` — ${attached.year}` : ""}.
                </p>
              )}

              {/* Envoyés seulement si une fiche a été choisie ; sinon l'existante est conservée. */}
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

              <div className="mb-4">
                <label
                  htmlFor="barcode"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Code-barres
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  id="barcode"
                  name="barcode"
                  defaultValue={currentBarcode ?? ""}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              {errorMessage && (
                <p className="text-red-500 text-xs italic mb-4">
                  {errorMessage}
                </p>
              )}

              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isPending}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-indigo-300"
                >
                  {isPending ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
