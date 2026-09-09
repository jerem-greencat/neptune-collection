import { redirect } from "next/navigation";
import AddDvd from "@/components/AddDvd";
import CollectionHeader from "@/components/CollectionHeader";
import DeleteDvdButton from "@/components/DeleteDvdButton";
import EditDvdButton from "@/components/EditDvdButton";
import SearchBar from "@/components/SearchBar";
import Sleeve from "@/components/ui/Sleeve";
import { getDvds } from "@/lib/collections/dvds";
import { isSessionValid } from "@/lib/session";

export default async function DvdsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await isSessionValid())) {
    redirect("/");
  }

  const query = (await searchParams).q?.trim() ?? "";
  const dvds = await getDvds(query);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <CollectionHeader
        overline="Collection"
        title="Films & séries"
        count={dvds.length}
        accent="reel"
        action={<AddDvd />}
      />

      <SearchBar placeholder="Rechercher un titre..." />

      {dvds.length > 0 ? (
        <ul className="mt-6 border-t border-ink-800">
          {dvds.map((dvd, index) => (
            <li
              key={dvd.id}
              className="group flex items-center gap-4 border-b border-ink-800 py-4 transition-colors hover:bg-ink-900/50"
            >
              <span className="catalog-num hidden w-6 shrink-0 text-right text-xs text-paper-600 sm:block">
                {String(index + 1).padStart(2, "0")}
              </span>

              <Sleeve kind="dvd" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl leading-tight text-paper-50">
                  {dvd.title}
                </p>
                {dvd.kind || dvd.directors ? (
                  <p className="mt-0.5 truncate text-sm text-paper-400">
                    {[dvd.kind, dvd.directors].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {dvd.year ? (
                  <p className="catalog-num mt-1 text-xs text-reel-400/80">
                    {dvd.year}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                <EditDvdButton
                  dvdId={dvd.id}
                  currentTitle={dvd.title}
                  currentBarcode={dvd.barcode}
                  currentYear={dvd.year}
                  currentDirectors={dvd.directors}
                  currentKind={dvd.kind}
                />
                <DeleteDvdButton dvdId={dvd.id} title={dvd.title} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-sm text-paper-500">
          {query
            ? `Aucun titre ne correspond à « ${query} ».`
            : "Aucun film pour le moment. Scannez-en un pour commencer."}
        </p>
      )}
    </div>
  );
}
