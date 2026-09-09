import { redirect } from "next/navigation";
import AddVinyl from "@/components/AddVinyl";
import CollectionHeader from "@/components/CollectionHeader";
import DeleteVinylButton from "@/components/DeleteVinylButton";
import EditVinylButton from "@/components/EditVinylButton";
import SearchBar from "@/components/SearchBar";
import Sleeve from "@/components/ui/Sleeve";
import { getVinyls } from "@/lib/collections/vinyls";
import { isSessionValid } from "@/lib/session";

export default async function VinylsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await isSessionValid())) {
    redirect("/");
  }

  const query = (await searchParams).q?.trim() ?? "";
  const vinyls = await getVinyls(query);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <CollectionHeader
        overline="Collection"
        title="Vinyles"
        count={vinyls.length}
        accent="groove"
        action={<AddVinyl />}
      />

      <SearchBar placeholder="Rechercher par artiste ou titre..." />

      {vinyls.length > 0 ? (
        <ul className="mt-6 border-t border-ink-800">
          {vinyls.map((vinyl, index) => (
            <li
              key={vinyl.id}
              className="group flex items-center gap-4 border-b border-ink-800 py-4 transition-colors hover:bg-ink-900/50"
            >
              <span className="catalog-num hidden w-6 shrink-0 text-right text-xs text-paper-600 sm:block">
                {String(index + 1).padStart(2, "0")}
              </span>

              <Sleeve kind="vinyl" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl leading-tight text-paper-50">
                  {vinyl.artist}
                </p>
                <p className="mt-0.5 truncate text-sm text-paper-400">
                  {vinyl.title}
                </p>
                {vinyl.year ? (
                  <p className="catalog-num mt-1 text-xs text-groove-400/80">
                    {vinyl.year}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                <EditVinylButton
                  vinylId={vinyl.id}
                  currentArtist={vinyl.artist}
                  currentTitle={vinyl.title}
                  currentBarcode={vinyl.barcode}
                  currentYear={vinyl.year}
                />
                <DeleteVinylButton
                  vinylId={vinyl.id}
                  artist={vinyl.artist}
                  title={vinyl.title}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-sm text-paper-500">
          {query
            ? `Aucun vinyle ne correspond à « ${query} ».`
            : "Aucun vinyle pour le moment. Scannez-en un pour commencer."}
        </p>
      )}
    </div>
  );
}
