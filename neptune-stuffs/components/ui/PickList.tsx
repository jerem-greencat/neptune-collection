"use client";

/** Une entrée proposée au choix : un titre, et une ligne de détail sous lui. */
export interface PickOption {
  id: string;
  label: string;
  details?: string | null;
}

interface PickListProps {
  options: PickOption[];
  onPick: (id: string) => void;
}

/**
 * Liste de résultats cliquables, partagée par les quatre formulaires.
 *
 * La ligne de détail n'est pas décorative : sans jaquette, c'est l'année, le
 * type et le générique qui permettent de distinguer une série de ses films ou
 * huit pressages du même album.
 */
export default function PickList({ options, onPick }: PickListProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <ul className="mt-2 max-h-60 divide-y divide-ink-800 overflow-y-auto rounded-md border border-ink-700 bg-ink-950/60">
      {options.map((option) => (
        <li key={option.id}>
          <button
            type="button"
            onClick={() => onPick(option.id)}
            className="block w-full p-2.5 text-left transition-colors hover:bg-ink-850"
          >
            <span className="block break-words text-sm font-medium text-paper-50">
              {option.label}
            </span>
            {option.details && (
              <span className="mt-0.5 block break-words text-xs text-paper-500">
                {option.details}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
