"use client";

import { ScanLine } from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { INLINE_BUTTON_CLASS } from "@/components/ui/styles";
import TextField from "@/components/ui/TextField";

/**
 * Chargé à la demande : la bibliothèque de décodage et son binaire WebAssembly
 * pèsent plus d'un mégaoctet, inutiles tant qu'on ne scanne pas. `ssr: false`
 * parce que le composant n'existe que dans le navigateur (caméra, canvas).
 */
const BarcodeScanner = dynamic(() => import("./BarcodeScanner"), {
  ssr: false,
});

import type { BarcodeLookupResult } from "@/lib/collections/types";

type Feedback =
  | { kind: "owned"; label: string }
  | { kind: "new" }
  | { kind: "error"; message: string };

interface BarcodeCheckProps {
  value: string;
  onChange: (value: string) => void;
  /** Action qui interroge la collection, et éventuellement une source externe. */
  check: (barcode: string) => Promise<BarcodeLookupResult>;
  /** Appelé quand la source externe a rempli une fiche. */
  onFound?: (result: BarcodeLookupResult) => void;
  placeholder?: string;
  label?: string;
}

/**
 * Champ code-barres et sa vérification.
 *
 * Le doublon prime sur tout le reste : « tu l'as déjà » est la réponse la plus
 * utile en magasin, et elle vaut même quand la source externe ne connaît pas
 * le code.
 */
export default function BarcodeCheck({
  value,
  onChange,
  check,
  onFound,
  placeholder,
  label = "Code-barres",
}: BarcodeCheckProps) {
  const [isChecking, startCheck] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  /**
   * Le code peut être passé explicitement : après un scan, l'état du parent
   * n'est pas encore à jour et lire `value` rendrait l'ancienne valeur.
   */
  const run = (barcode: string = value) => {
    if (!barcode.trim()) return;

    setFeedback(null);

    startCheck(async () => {
      const result = await check(barcode);

      if (result.alreadyOwned) {
        setFeedback({ kind: "owned", label: result.alreadyOwned.label });
      }

      if (!result.success) {
        if (!result.alreadyOwned) {
          setFeedback({
            kind: "error",
            message: result.error ?? "La recherche a échoué.",
          });
        }
        return;
      }

      if (result.metadata) {
        onFound?.(result);
      }

      if (!result.alreadyOwned && !result.metadata) {
        setFeedback({ kind: "new" });
      }
    });
  };

  return (
    <TextField
      name="barcode"
      label={label}
      value={value}
      onChange={onChange}
      numeric
      placeholder={placeholder}
      action={
        <>
          <button
            type="button"
            onClick={() => setIsScanning(true)}
            aria-label="Scanner le code-barres"
            className={INLINE_BUTTON_CLASS}
          >
            <ScanLine className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => run()}
            disabled={isChecking || !value.trim()}
            className={INLINE_BUTTON_CLASS}
          >
            {isChecking ? "..." : "Vérifier"}
          </button>
        </>
      }
      hint={
        <>
          {isScanning && (
            <BarcodeScanner
              onClose={() => setIsScanning(false)}
              onScan={(barcode) => {
                setIsScanning(false);
                onChange(barcode);
                // La vérification enchaîne : c'est le geste attendu en magasin.
                run(barcode);
              }}
            />
          )}
          {feedback?.kind === "owned" && (
            <p className="text-amber-700 text-xs mt-2">
              Tu l'as déjà : {feedback.label}
            </p>
          )}
          {feedback?.kind === "new" && (
            <p className="text-green-700 text-xs mt-2">
              Pas encore dans ta collection.
            </p>
          )}
          {feedback?.kind === "error" && (
            <p className="text-red-500 text-xs mt-2">{feedback.message}</p>
          )}
        </>
      }
    />
  );
}
