"use client";

import {
	addDvdAction,
	findDvdByBarcodeAction,
	searchMoviesAction,
} from "@/app/actions";
import type { MovieSummary } from "@/lib/tmdb";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";

/**
 * Le code-barres ne sert qu'au dédoublonnage : aucune base gratuite n'indexe
 * correctement les UPC de films. Les métadonnées viennent de TMDB, par
 * recherche sur le titre.
 */
type BarcodeFeedback =
	| { kind: "owned"; label: string }
	| { kind: "new" }
	| { kind: "error"; message: string };

export default function AddDvd() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [barcode, setBarcode] = useState("");
	const [isCheckingBarcode, startBarcodeCheck] = useTransition();
	const [barcodeFeedback, setBarcodeFeedback] =
		useState<BarcodeFeedback | null>(null);

	const [title, setTitle] = useState("");
	const [isSearching, startSearch] = useTransition();
	const [results, setResults] = useState<MovieSummary[] | null>(null);
	const [searchError, setSearchError] = useState<string | null>(null);
	// Renseigné uniquement quand un film a été choisi dans la liste.
	const [picked, setPicked] = useState<MovieSummary | null>(null);

	const formRef = useRef<HTMLFormElement>(null);

	const resetForm = () => {
		setBarcode("");
		setBarcodeFeedback(null);
		setTitle("");
		setResults(null);
		setSearchError(null);
		setPicked(null);
		setErrorMessage(null);
		formRef.current?.reset();
	};

	const handleBarcodeCheck = () => {
		if (!barcode.trim()) return;

		setBarcodeFeedback(null);

		startBarcodeCheck(async () => {
			const result = await findDvdByBarcodeAction(barcode);

			if (!result.success) {
				setBarcodeFeedback({
					kind: "error",
					message: result.error ?? "La recherche a échoué.",
				});
				return;
			}

			setBarcodeFeedback(
				result.alreadyOwned
					? { kind: "owned", label: result.alreadyOwned.label }
					: { kind: "new" },
			);
		});
	};

	const handleMovieSearch = () => {
		if (!title.trim()) return;

		setSearchError(null);

		startSearch(async () => {
			const result = await searchMoviesAction(title);

			if (!result.success) {
				setSearchError(result.error ?? "La recherche a échoué.");
				setResults(null);
				return;
			}

			setResults(result.movies ?? []);
		});
	};

	const handlePick = (movie: MovieSummary) => {
		setPicked(movie);
		setTitle(movie.title);
		setResults(null);
	};

	const handleSubmit = (formData: FormData) => {
		setErrorMessage(null);

		startTransition(async () => {
			const result = await addDvdAction(formData);

			if (result.success) {
				setIsModalOpen(false);
				resetForm();
			} else {
				setErrorMessage(result.error || "Une erreur inconnue est survenue.");
			}
		});
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		resetForm();
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setIsModalOpen(true)}
				className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
			>
				Ajouter un Dvd 🎬
			</button>

			{isModalOpen && (
				<div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
					<div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-sm max-h-full overflow-y-auto">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-2xl font-bold text-gray-800">Nouveau Dvd</h2>
							<button
								type="button"
								onClick={handleCloseModal}
								className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
							>
								&times;
							</button>
						</div>

						<form ref={formRef} action={handleSubmit}>
							<div className="mb-4">
								<label
									htmlFor="barcode"
									className="block text-gray-700 text-sm font-bold mb-2"
								>
									Code-barres
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										inputMode="numeric"
										id="barcode"
										name="barcode"
										value={barcode}
										onChange={(event) => setBarcode(event.target.value)}
										className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									/>
									<button
										type="button"
										onClick={handleBarcodeCheck}
										disabled={isCheckingBarcode || !barcode.trim()}
										className="shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded disabled:opacity-50"
									>
										{isCheckingBarcode ? "..." : "Vérifier"}
									</button>
								</div>

								{barcodeFeedback?.kind === "owned" && (
									<p className="text-amber-700 text-xs mt-2">
										Tu l'as déjà : {barcodeFeedback.label}
									</p>
								)}
								{barcodeFeedback?.kind === "new" && (
									<p className="text-green-700 text-xs mt-2">
										Pas encore dans ta collection.
									</p>
								)}
								{barcodeFeedback?.kind === "error" && (
									<p className="text-red-500 text-xs mt-2">
										{barcodeFeedback.message}
									</p>
								)}
							</div>

							<div className="mb-4">
								<label
									htmlFor="title"
									className="block text-gray-700 text-sm font-bold mb-2"
								>
									Titre
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										id="title"
										name="title"
										value={title}
										onChange={(event) => {
											setTitle(event.target.value);
											// Le titre ne correspond plus au film choisi.
											setPicked(null);
										}}
										required
										className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									/>
									<button
										type="button"
										onClick={handleMovieSearch}
										disabled={isSearching || !title.trim()}
										className="flex items-center gap-1 shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-3 rounded disabled:opacity-50"
									>
										<Search className="h-4 w-4" aria-hidden="true" />
										{isSearching ? "..." : "Chercher"}
									</button>
								</div>

								{searchError && (
									<p className="text-red-500 text-xs mt-2">{searchError}</p>
								)}

								{results?.length === 0 && (
									<p className="text-gray-500 text-xs mt-2">
										Aucun film trouvé, le titre saisi sera utilisé tel quel.
									</p>
								)}

								{results && results.length > 0 && (
									<ul className="mt-2 border rounded divide-y max-h-60 overflow-y-auto">
										{results.map((movie) => (
											<li key={movie.tmdbId}>
												<button
													type="button"
													onClick={() => handlePick(movie)}
													className="flex items-center gap-3 w-full text-left p-2 hover:bg-gray-100"
												>
													{movie.posterUrl ? (
														<Image
															src={movie.posterUrl}
															alt=""
															width={40}
															height={60}
															className="shrink-0 rounded object-cover"
														/>
													) : (
														<span className="shrink-0 w-10 h-15 bg-gray-200 rounded" />
													)}
													<span className="min-w-0">
														<span className="block text-sm font-medium break-words">
															{movie.title}
															{movie.year ? ` (${movie.year})` : ""}
														</span>
														{movie.originalTitle && (
															<span className="block text-xs text-gray-500 break-words">
																{movie.originalTitle}
															</span>
														)}
													</span>
												</button>
											</li>
										))}
									</ul>
								)}

								{picked && (
									<p className="text-green-700 text-xs mt-2">
										Fiche TMDB associée
										{picked.year ? ` (${picked.year})` : ""}.
									</p>
								)}
							</div>

							{/* Transmis seulement si un film a été choisi dans la liste. */}
							{picked && (
								<>
									<input type="hidden" name="tmdbId" value={picked.tmdbId} />
									{picked.year && (
										<input type="hidden" name="year" value={picked.year} />
									)}
									{picked.posterUrl && (
										<input
											type="hidden"
											name="posterUrl"
											value={picked.posterUrl}
										/>
									)}
								</>
							)}

							{errorMessage && (
								<p className="text-red-500 text-xs italic mb-4">
									{errorMessage}
								</p>
							)}

							<div className="flex items-center justify-end">
								<button
									type="submit"
									disabled={isPending}
									className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-indigo-300"
								>
									{isPending ? "Ajout en cours..." : "Ajouter"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</>
	);
}
