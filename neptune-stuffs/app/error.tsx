"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { PRIMARY_BUTTON_CLASS } from "@/components/ui/styles";

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
      <h1 className="mb-4 font-display text-3xl leading-tight text-paper-50 sm:text-4xl">
        Oups, quelque chose s'est mal passé
      </h1>

      <p className="mb-8 max-w-md text-sm leading-relaxed text-paper-400">
        La page n'a pas pu être chargée. C'est souvent temporaire : la base de
        données peut mettre quelques secondes à répondre après une période
        d'inactivité.
      </p>

      <button type="button" onClick={reset} className={PRIMARY_BUTTON_CLASS}>
        <RefreshCw size={16} aria-hidden="true" />
        <span>Réessayer</span>
      </button>
    </div>
  );
}
