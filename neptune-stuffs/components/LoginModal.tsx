"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/app/actions/auth";
import Modal from "@/components/ui/Modal";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "@/components/ui/styles";

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function LoginModal({
  onClose,
  onLoginSuccess,
}: LoginModalProps) {
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
    <Modal title="Connexion" onClose={onClose}>
      <form action={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="identifier" className={LABEL_CLASS}>
            Identifiant
          </label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            required
            className={INPUT_CLASS}
          />
        </div>

        {/* Champ mot de passe : `TextField` est contrôlé et typé texte. */}
        <div className="mb-6">
          <label htmlFor="password" className={LABEL_CLASS}>
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className={INPUT_CLASS}
          />
        </div>

        {errorMessage && (
          <p className="text-red-500 text-xs italic mb-4">{errorMessage}</p>
        )}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending}
            className={PRIMARY_BUTTON_CLASS}
          >
            {isPending ? "Connexion..." : "Se connecter"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
