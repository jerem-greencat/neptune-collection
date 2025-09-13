'use client';

import { useState, useTransition } from 'react';
import { loginAction } from '@/app/actions'; 

interface LoginModalProps {
  onClose: () => void; 
  onLoginSuccess: () => void; 
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await loginAction(formData); 
      if (result.success) {
        onLoginSuccess(); 
      } else {
        setErrorMessage(result.message); 
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Connexion</h2>
          <button type='button' onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
        </div>

        <form action={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="identifier" className="block text-gray-700 text-sm font-bold mb-2">Identifiant</label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
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
              {isPending ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}