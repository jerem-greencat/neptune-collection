"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface SearchBarProps {
  placeholder: string;
}

export default function SearchBar({ placeholder }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(currentQuery);

  useEffect(() => {
    if (value === currentQuery) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }

      const queryString = params.toString();

      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [value, currentQuery, pathname, router, searchParams]);

  return (
    <div className="relative mb-6">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-500"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-ink-800 bg-ink-900/60 py-2.5 pl-9 pr-9 text-sm text-paper-50 placeholder:text-paper-600 transition-colors focus:border-ink-600 focus:bg-ink-900 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Effacer la recherche"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-paper-500 transition-colors hover:text-paper-50"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {isPending && <output className="sr-only">Recherche en cours...</output>}
    </div>
  );
}
