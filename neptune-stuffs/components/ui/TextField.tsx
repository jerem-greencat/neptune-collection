"use client";

import type { ReactNode } from "react";
import { INPUT_CLASS, LABEL_CLASS } from "./styles";

interface TextFieldProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  /** Affiche un pavé numérique sur mobile, pour les codes-barres. */
  numeric?: boolean;
  /** Bouton d'action accolé au champ, par exemple « Chercher ». */
  action?: ReactNode;
  /** Message affiché sous le champ. */
  hint?: ReactNode;
}

/** Champ texte étiqueté, avec action et message facultatifs. */
export default function TextField({
  name,
  label,
  value,
  onChange,
  required,
  placeholder,
  numeric,
  action,
  hint,
}: TextFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className={LABEL_CLASS}>
        {label}
      </label>

      {action ? (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode={numeric ? "numeric" : undefined}
            id={name}
            name={name}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            required={required}
            placeholder={placeholder}
            className={INPUT_CLASS}
          />
          {action}
        </div>
      ) : (
        <input
          type="text"
          inputMode={numeric ? "numeric" : undefined}
          id={name}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
          className={INPUT_CLASS}
        />
      )}

      {hint}
    </div>
  );
}
