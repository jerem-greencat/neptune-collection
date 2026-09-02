import { redirect } from "next/navigation";
import AddVinyl from "@/components/AddVinyl";
import DeleteVinylButton from "@/components/DeleteVinylButton";
import EditVinylButton from "@/components/EditVinylButton";
import SearchBar from "@/components/SearchBar";
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
    <div className="container mx-auto px-4 py-6 sm:p-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          Ma Collection de Vinyles
        </h1>
        <AddVinyl />
      </div>

      <SearchBar placeholder="Rechercher par titre ou artiste..." />

      {vinyls.length > 0 ? (
        <ul className="space-y-4">
          {vinyls.map((vinyl) => (
            <li
              key={vinyl.id}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center gap-3"
            >
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-semibold break-words">
                  {vinyl.artist}
                </p>
                <p className="text-gray-600 break-words">
                  {vinyl.title}
                  {vinyl.year ? (
                    <span className="ml-2 text-sm text-gray-500">
                      {vinyl.year}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:gap-4 shrink-0">
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
      ) : query ? (
        <p>Aucun vinyle ne correspond à « {query} ».</p>
      ) : (
        <p>Aucun vinyle dans votre collection pour le moment.</p>
      )}
    </div>
  );
}
