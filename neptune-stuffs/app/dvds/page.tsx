import AddDvd from "@/components/AddDvd";
import DeleteDvdButton from "@/components/DeleteDvdButton";
import EditDvdButton from "@/components/EditDvdButton";
import ProtectedRoute from "@/components/ProtectedRoot";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface Dvd {
  _id: ObjectId;
  title: string;
  // year: number;
}

async function getDvds(): Promise<Dvd[]> {
  try {
    const client = await clientPromise;
    const db = client.db("neptune-collection");

    const dvdsData = await db
      .collection<Dvd>("dvds")
      .find({})
      .sort({ title: 1 })
      .toArray();

    return dvdsData;
  } catch (error) {
    console.error("Erreur lors de la récupération des dvds:", error);
    return [];
  }
}


export default async function DvdsPage() {
  const dvds = await getDvds();

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-8">
        <div>
            <h1 className="text-3xl font-bold mb-6">Ma Collection de Dvds</h1>
            <AddDvd />   
        </div>

        {dvds.length > 0 ? (
          <ul className="space-y-4">
            {dvds.map((dvd) => (
              <li 
                key={dvd._id.toString()} 
                className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
              >
                <div>
                  <p className="text-xl font-semibold">{dvd.title}</p>
                </div>

                <div className="flex space-x-4"> 
                  <EditDvdButton 
                    dvdId={dvd._id.toString()}
                    currentTitle={dvd.title}
                  />
                  <DeleteDvdButton 
                    dvdId={dvd._id.toString()}
                    title={dvd.title}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun dvd dans votre collection pour le moment.</p>
        )}
      </div>
    </ProtectedRoute>
  );
}