import AddDvd from "@/components/AddDvd";
import DeleteDvdButton from "@/components/DeleteDvdButton";
import EditDvdButton from "@/components/EditDvdButton";
import getMongoClient from "@/lib/mongodb";
import { isSessionValid } from "@/lib/session";
import type { ObjectId } from "mongodb";
import { redirect } from "next/navigation";

interface Dvd {
	_id: ObjectId;
	title: string;
	// year: number;
}

async function getDvds(): Promise<Dvd[]> {
	const client = await getMongoClient();
	const db = client.db("neptune-collection");

	return db.collection<Dvd>("dvds").find({}).sort({ title: 1 }).toArray();
}

export default async function DvdsPage() {
	if (!(await isSessionValid())) {
		redirect("/");
	}

	const dvds = await getDvds();

	return (
		<div className="container mx-auto px-4 py-6 sm:p-8">
			<div>
				<h1 className="text-2xl sm:text-3xl font-bold mb-6">
					Ma Collection de Dvds
				</h1>
				<AddDvd />
			</div>

			{dvds.length > 0 ? (
				<ul className="space-y-4">
					{dvds.map((dvd) => (
						<li
							key={dvd._id.toString()}
							className="bg-white p-4 rounded-lg shadow flex justify-between items-center gap-3"
						>
							<div className="min-w-0">
								<p className="text-lg sm:text-xl font-semibold break-words">
									{dvd.title}
								</p>
							</div>

							<div className="flex flex-col md:flex-row gap-2 md:gap-4 shrink-0">
								<EditDvdButton
									dvdId={dvd._id.toString()}
									currentTitle={dvd.title}
								/>
								<DeleteDvdButton dvdId={dvd._id.toString()} title={dvd.title} />
							</div>
						</li>
					))}
				</ul>
			) : (
				<p>Aucun dvd dans votre collection pour le moment.</p>
			)}
		</div>
	);
}
