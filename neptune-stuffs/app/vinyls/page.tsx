import AddVinyl from "@/components/AddVinyl";
import DeleteVinylButton from "@/components/DeleteVinylButton";
import EditVinylButton from "@/components/EditVinylButton";
import SearchBar from "@/components/SearchBar";
import getMongoClient, {
	buildSearchRegex,
	FRENCH_COLLATION,
} from "@/lib/mongodb";
import { isSessionValid } from "@/lib/session";
import type { Filter, ObjectId } from "mongodb";
import { redirect } from "next/navigation";

interface Vinyl {
	_id: ObjectId;
	artist: string;
	title: string;
	// year: number;
}

async function getVinyls(query: string): Promise<Vinyl[]> {
	const client = await getMongoClient();
	const db = client.db("neptune-collection");

	let filter: Filter<Vinyl> = {};

	if (query) {
		const regex = buildSearchRegex(query);
		filter = {
			$or: [{ title: { $regex: regex } }, { artist: { $regex: regex } }],
		};
	}

	return db
		.collection<Vinyl>("vinyls")
		.find(filter)
		.collation(FRENCH_COLLATION)
		.sort({ artist: 1, title: 1 })
		.toArray();
}

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
							key={vinyl._id.toString()}
							className="bg-white p-4 rounded-lg shadow flex justify-between items-center gap-3"
						>
							<div className="min-w-0">
								<p className="text-lg sm:text-xl font-semibold break-words">
									{vinyl.artist}
								</p>
								<p className="text-gray-600 break-words">{vinyl.title}</p>
							</div>

							<div className="flex flex-col md:flex-row gap-2 md:gap-4 shrink-0">
								<EditVinylButton
									vinylId={vinyl._id.toString()}
									currentArtist={vinyl.artist}
									currentTitle={vinyl.title}
								/>
								<DeleteVinylButton
									vinylId={vinyl._id.toString()}
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
