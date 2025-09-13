'use client';

import { useState, useRef } from 'react';
import { addVinylAction } from '@/app/actions';

export default function AddVinyl() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // 1. La fonction accepte maintenant l'événement du formulaire
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // 2. On empêche le navigateur de soumettre le formulaire par lui-même
    event.preventDefault();

    // 3. On récupère les données directement depuis l'événement
    const formData = new FormData(event.currentTarget);
    
    const result = await addVinylAction(formData);

    if (result.success) {
      setIsModalOpen(false);
      formRef.current?.reset();
    } else {
      alert(result.error || "Une erreur est survenue.");
    }
  };

  return (
    <>
      <button
      type='button'
        onClick={() => setIsModalOpen(true)}
        className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300"
      >
        Ajouter un vinyle
      </button>

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center"
        >
          <div 
            className="bg-white p-8 rounded-lg shadow-2xl z-50 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Nouveau Vinyle</h2>
            
            {/* 4. On utilise "onSubmit" au lieu de "action" */}
            <form onSubmit={handleFormSubmit} ref={formRef}>
              <div className="mb-4">
                <label htmlFor="artist" className="block text-gray-700 text-sm font-bold mb-2">
                  Artiste
                </label>
                <input
                  type="text"
                  id="artist"
                  name="artist"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
                  Titre de l'album
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
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
                  className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors" 
                    onClick={() => setIsModalOpen(false)}
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

