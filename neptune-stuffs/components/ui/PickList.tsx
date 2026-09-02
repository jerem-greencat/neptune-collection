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
    <ul className="mt-2 border rounded divide-y max-h-60 overflow-y-auto">
      {options.map((option) => (
        <li key={option.id}>
          <button
            type="button"
            onClick={() => onPick(option.id)}
            className="block w-full text-left p-2 hover:bg-gray-100"
          >
            <span className="block text-sm font-medium break-words">
              {option.label}
            </span>
            {option.details && (
              <span className="block text-xs text-gray-500 break-words">
                {option.details}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
