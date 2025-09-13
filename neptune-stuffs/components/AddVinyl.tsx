'use client';

import { useState, useRef, useTransition, useEffect } from 'react';
import { addVinylAction } from '@/app/actions';

export default function AddVinyl() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<{ artist?: string[], title?: string[], year?: string[] }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const handleFormSubmit = (formData: FormData) => {
    setErrors({});
    setServerError(null);
    startTransition(async () => {
      const result = await addVinylAction(formData);
      if (result.success) {
        setIsModalOpen(false);
        formRef.current?.reset();
      } else {
        if (result.error) {
          setErrors(result.error);
        }
        if (result.serverError) {
          setServerError(result.serverError);
        }
      }
    });
  };

  return (
    <>
      <button type='button'
        onClick={() => setIsModalOpen(true)}
        className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300"
      >
        Ajouter un vinyle
      </button>

      {isModalOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center w-full h-full p-0 border-none bg-transparent text-left cursor-default"
          onClick={() => setIsModalOpen(false)}
          tabIndex={-1}
          aria-label="Fermer la modale"
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Stop propagation is a technical requirement, not a user interaction. */}
          <div
            className="bg-white p-8 rounded-lg shadow-2xl z-50 w-full max-w-md"
            onClick={e => e.stopPropagation()}
            role="presentation"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Nouveau Vinyle</h2>
            <form action={handleFormSubmit} ref={formRef}>
              <div className="mb-4">
                <label htmlFor="artist" className="block text-gray-700 text-sm font-bold mb-2">
                  Artiste
                </label>
                <input
                  type="text"
                  id="artist"
                  name="artist"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.artist ? 'border-red-500' : ''}`}
                />
                {errors.artist && <p className="text-red-500 text-xs italic mt-1">{errors.artist[0]}</p>}
              </div>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                  Titre de l'album
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.title ? 'border-red-500' : ''}`}
                />
                {errors.title && <p className="text-red-500 text-xs italic mt-1">{errors.title[0]}</p>}
              </div>
              {serverError && <p className="text-red-500 text-sm mb-4">{serverError}</p>}

              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                >
                  {isPending ? 'Ajout en cours...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </button>
      )}
    </>
  );
}