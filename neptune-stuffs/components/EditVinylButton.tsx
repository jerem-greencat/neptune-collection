'use client';

import { useState, useTransition } from 'react';
import { updateVinylAction } from '@/app/actions';

interface EditVinylButtonProps {
  vinylId: string;
  currentArtist: string;
  currentTitle: string;
}

export default function EditVinylButton({ vinylId, currentArtist, currentTitle }: EditVinylButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setErrorMessage(null);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
        aria-label={`Modifier ${currentTitle}`}
      >
        Modifier ✏️
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Modifier le vinyle</h2>
              <button 
                type='button' 
                onClick={handleCloseModal} 
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form action={handleSubmit}>
              <input type="hidden" name="vinylId" value={vinylId} />

              <div className="mb-4">
                <label htmlFor="artist" className="block text-gray-700 text-sm font-bold mb-2">
                  Artiste
                </label>
                <input
                  type="text"
                  id="artist"
                  name="artist"
                  defaultValue={currentArtist} 
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={currentTitle} 
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              {errorMessage && (
                <p className="text-red-500 text-xs italic mb-4">{errorMessage}</p>
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
                  {isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}