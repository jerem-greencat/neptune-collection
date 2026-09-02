import { redirect } from "next/navigation";
import AddDvd from "@/components/AddDvd";
import DeleteDvdButton from "@/components/DeleteDvdButton";
import EditDvdButton from "@/components/EditDvdButton";
import SearchBar from "@/components/SearchBar";
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
    <div className="container mx-auto px-4 py-6 sm:p-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">
          Ma Collection de Dvds
        </h1>
        <AddDvd />
      </div>

      <SearchBar placeholder="Rechercher un dvd par titre..." />

      {dvds.length > 0 ? (
        <ul className="space-y-4">
          {dvds.map((dvd) => (
            <li
              key={dvd.id}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center gap-3"
            >
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-semibold break-words">
                  {dvd.title}
                  {dvd.year ? (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      {dvd.year}
                    </span>
                  ) : null}
                </p>
                {dvd.kind || dvd.directors ? (
                  <p className="text-gray-600 break-words">
                    {[dvd.kind, dvd.directors].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:gap-4 shrink-0">
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
      ) : query ? (
        <p>Aucun dvd ne correspond à « {query} ».</p>
      ) : (
        <p>Aucun dvd dans votre collection pour le moment.</p>
      )}
    </div>
  );
}
