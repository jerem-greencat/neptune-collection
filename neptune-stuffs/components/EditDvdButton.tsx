"use client";

import { searchMoviesAction, updateDvdAction } from "@/app/actions";
import type { MovieSummary } from "@/lib/wikidata";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";

interface EditDvdButtonProps {
  dvdId: string;
  currentTitle: string;
  currentBarcode?: string;
  currentYear?: number;
  currentDirectors?: string;
}

export default function EditDvdButton({
  dvdId,
  currentTitle,
  currentBarcode,
  currentYear,
  currentDirectors,
}: EditDvdButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [title, setTitle] = useState(currentTitle);
  const [isSearching, startSearch] = useTransition();
  const [results, setResults] = useState<MovieSummary[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Renseigné seulement si une nouvelle fiche a été choisie pendant l'édition.
  const [picked, setPicked] = useState<MovieSummary | null>(null);

  const resetState = () => {
    setTitle(currentTitle);
    setResults(null);
    setSearchError(null);
    setPicked(null);
    setErrorMessage(null);
  };

  const handleMovieSearch = () => {
    if (!title.trim()) return;

    setSearchError(null);

    startSearch(async () => {
      const result = await searchMoviesAction(title);

      if (!result.success) {
        setSearchError(result.error ?? "La recherche a échoué.");
        setResults(null);
        return;
      }

      setResults(result.movies ?? []);
    });
  };

  const handlePick = (movie: MovieSummary) => {
    setPicked(movie);
    setTitle(movie.title);
    setResults(null);
  };

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await updateDvdAction(formData);

      if (result.success) {
        setIsModalOpen(false);
        setResults(null);
        setPicked(null);
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
                Modifier le dvd
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
              <input type="hidden" name="dvdId" value={dvdId} />

              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Titre
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setPicked(null);
                    }}
                    required
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <button
                    type="button"
                    onClick={handleMovieSearch}
                    disabled={isSearching || !title.trim()}
                    className="flex items-center gap-1 shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded disabled:opacity-50"
                  >
                    <Search className="h-4 w-4" aria-hidden="true" />
                    {isSearching ? "..." : "Chercher"}
                  </button>
                </div>

                {/* Ce qui est déjà associé, tant qu'aucune nouvelle fiche n'est choisie. */}
                {!picked && (currentYear || currentDirectors) && (
                  <p className="text-gray-500 text-xs mt-2">
                    Fiche actuelle :{" "}
                    {[currentYear, currentDirectors].filter(Boolean).join(" — ")}
                  </p>
                )}

                {searchError && (
                  <p className="text-red-500 text-xs mt-2">{searchError}</p>
                )}

                {results?.length === 0 && (
                  <p className="text-gray-500 text-xs mt-2">
                    Aucun film trouvé, le titre saisi sera utilisé tel quel.
                  </p>
                )}

                {results && results.length > 0 && (
                  <ul className="mt-2 border rounded divide-y max-h-60 overflow-y-auto">
                    {results.map((movie) => (
                      <li key={movie.wikidataId}>
                        <button
                          type="button"
                          onClick={() => handlePick(movie)}
                          className="block w-full text-left p-2 hover:bg-gray-100"
                        >
                          <span className="block text-sm font-medium break-words">
                            {movie.title}
                            {movie.year ? ` (${movie.year})` : ""}
                          </span>
                          {movie.directors && (
                            <span className="block text-xs text-gray-500 break-words">
                              {movie.directors}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {picked && (
                  <p className="text-green-700 text-xs mt-2">
                    Nouvelle fiche :{" "}
                    {[picked.year, picked.directors].filter(Boolean).join(" — ")}
                  </p>
                )}
              </div>

              {/* Envoyés seulement si une fiche a été choisie ; sinon l'existante est conservée. */}
              {picked && (
                <>
                  <input
                    type="hidden"
                    name="wikidataId"
                    value={picked.wikidataId}
                  />
                  {picked.year && (
                    <input type="hidden" name="year" value={picked.year} />
                  )}
                  {picked.imdbId && (
                    <input type="hidden" name="imdbId" value={picked.imdbId} />
                  )}
                  {picked.directors && (
                    <input
                      type="hidden"
                      name="directors"
                      value={picked.directors}
                    />
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
