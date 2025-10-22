'use client';

import { addDvdAction } from '@/app/actions';
import { useState, useTransition, useRef } from 'react';

export default function AddDvd() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);

    startTransition(async () => {
      const result = await addDvdAction(formData);
      
      if (result.success) {
        setIsModalOpen(false); 
        formRef.current?.reset();
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
                type='button' 
                onClick={handleCloseModal} 
                className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form ref={formRef} action={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
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
                <p className="text-red-500 text-xs italic mb-4">{errorMessage}</p>
              )}

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-indigo-300"
                >
                  {isPending ? 'Ajout en cours...' : 'Ajouter'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}