"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-6 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold mb-3">
        Oups, quelque chose s'est mal passé
      </h1>

      <p className="text-gray-600 max-w-md mb-8">
        La page n'a pas pu être chargée. C'est souvent temporaire : la base de
        données peut mettre quelques secondes à répondre après une période
        d'inactivité.
      </p>

      <button
        type="button"
        onClick={reset}
        className="flex items-center justify-center gap-2 min-h-12 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold transition-colors duration-300"
      >
        <RefreshCw size={20} aria-hidden="true" />
        <span>Réessayer</span>
      </button>
    </div>
  );
}
