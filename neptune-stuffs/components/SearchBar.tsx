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
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="shadow appearance-none border rounded w-full py-2 pl-10 pr-10 text-gray-700 leading-tight bg-white focus:outline-none focus:shadow-outline"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Effacer la recherche"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      {isPending && <output className="sr-only">Recherche en cours...</output>}
    </div>
  );
}
