"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { SECONDARY_BUTTON_CLASS } from "@/components/ui/styles";

/** Intervalle entre deux tentatives de lecture, en millisecondes. */
const SCAN_INTERVAL_MS = 250;

/** Les codes-barres du commerce : EAN-13 et EAN-8 en Europe, UPC aux États-Unis. */
const RETAIL_FORMATS = ["EAN13", "EAN8", "UPCA", "UPCE"] as const;

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

/**
 * Lecture d'un code-barres par la caméra.
 *
 * Le décodage tourne entièrement dans le navigateur (zxing-wasm) : aucune image
 * ne quitte l'appareil. Chaque image de la vidéo est copiée dans un canvas puis
 * soumise au lecteur ; à la première lecture valide, on rend la main.
 */
export default function BarcodeScanner({
  onScan,
  onClose,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Une référence évite de relancer la caméra si le parent recrée la fonction.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const stop = () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      for (const track of stream?.getTracks() ?? []) track.stop();
    };

    const start = async () => {
      // L'API caméra n'existe que sur une origine sûre : HTTPS ou localhost.
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "La caméra n'est pas accessible. Elle exige une connexion sécurisée (HTTPS).",
        );
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // La caméra arrière si elle existe, sinon celle disponible.
          video: { facingMode: { ideal: "environment" } },
        });
      } catch {
        setError("Accès à la caméra refusé.");
        return;
      }

      if (stopped) {
        stop();
        return;
      }

      const video = videoRef.current;

      if (!video) return;

      video.srcObject = stream;
      await video.play().catch(() => undefined);

      const { prepareZXingModule, readBarcodes } = await import(
        "zxing-wasm/reader"
      );

      // Le binaire est servi par l'application, pas par un CDN tiers.
      prepareZXingModule({
        overrides: {
          locateFile: (path: string, prefix: string) =>
            path.endsWith(".wasm") ? "/zxing_reader.wasm" : prefix + path,
        },
      });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });

      if (!context) {
        setError("Le décodage n'est pas disponible sur ce navigateur.");
        return;
      }

      const scan = async () => {
        if (stopped) return;

        // Les premières images arrivent avant que la taille soit connue.
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          timer = setTimeout(scan, SCAN_INTERVAL_MS);
          return;
        }

        setIsReady(true);
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        try {
          const results = await readBarcodes(
            context.getImageData(0, 0, canvas.width, canvas.height),
            { formats: [...RETAIL_FORMATS], tryHarder: true },
          );

          const found = results.find((result) => result.isValid && result.text);

          if (found) {
            stop();
            onScanRef.current(found.text);
            return;
          }
        } catch {
          // Une image illisible n'est pas une erreur : on retente.
        }

        timer = setTimeout(scan, SCAN_INTERVAL_MS);
      };

      void scan();
    };

    void start();

    return stop;
  }, []);

  return (
    <Modal title="Scanner un code-barres" onClose={onClose}>
      {error ? (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      ) : (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full rounded bg-black aspect-[4/3] object-cover"
          />
          <p className="text-gray-500 text-xs mt-2 mb-4">
            {isReady
              ? "Placez le code-barres dans le cadre."
              : "Démarrage de la caméra..."}
          </p>
        </>
      )}

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onClose}
          className={SECONDARY_BUTTON_CLASS}
        >
          Annuler
        </button>
      </div>
    </Modal>
  );
}
