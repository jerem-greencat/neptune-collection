'use client';

import { deleteDvdAction } from '@/app/actions';
import { useState, useTransition } from 'react';

interface DeleteDvdButtonProps {
  dvdId: string; 
  title: string;
}

export default function DeleteDvdButton({ dvdId, title }: DeleteDvdButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await deleteDvdAction(formData);
      
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
        className="text-red-500 hover:text-red-700 text-sm font-medium"
        aria-label={`Supprimer ${title}`}
      >
        Supprimer <span className='hidden md:block'>🗑️</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Confirmer</h2>
              <button 
                type='button' 
                onClick={handleCloseModal} 
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-gray-700 mb-6">
              Voulez-vous vraiment supprimer ce dvd de votre collection ?
              <br />
              <strong className="text-indigo-600 block mt-2">{title}</strong>
            </p>

            <form action={handleSubmit}>
              <input type="hidden" name="dvdId" value={dvdId} />

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
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-red-300"
                >
                  {isPending ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}