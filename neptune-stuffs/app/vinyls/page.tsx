import AddVinyl from "@/components/AddVinyl";
import ProtectedRoute from "@/components/ProtectedRoot";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Vinyl {
  _id: ObjectId;
  artist: string;
  title: string;
  year: number;
}

async function getVinyls(): Promise<Vinyl[]> {
  try {
    const client = await clientPromise;
    const db = client.db("neptune-collection");

    const vinylsData = await db
      .collection<Vinyl>("vinyls")
      .find({})
      .toArray();

    return vinylsData;
  } catch (error) {
    console.error("Erreur lors de la récupération des vinyles:", error);
    return [];
  }
}


export default async function VinylsPage() {
  const vinyls = await getVinyls();

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-8">
        <div>
            <h1 className="text-3xl font-bold mb-6">Ma Collection de Vinyles</h1>
            <AddVinyl />   
        </div>

        {vinyls.length > 0 ? (
          <ul className="space-y-4">
            {vinyls.map((vinyl) => (
              <li key={vinyl._id.toString()} className="bg-white p-4 rounded-lg shadow">
                <p className="text-xl font-semibold">{vinyl.title}</p>
                <p className="text-gray-600">{vinyl.artist} - {vinyl.year}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun vinyle dans votre collection pour le moment.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}
