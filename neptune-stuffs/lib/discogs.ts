const DISCOGS_API = "https://api.discogs.com";
const TIMEOUT_MS = 8000;

/** Discogs rejette les requêtes sans User-Agent identifiable. */
const USER_AGENT = "NeptuneCollects/0.1";

export interface ReleaseMetadata {
	artist: string;
	title: string;
	year: number | null;
	coverUrl: string | null;
	discogsId: number;
}

export class DiscogsError extends Error {
	rateLimited: boolean;

	constructor(message: string, rateLimited = false) {
		super(message);
		this.name = "DiscogsError";
		this.rateLimited = rateLimited;
	}
}

/**
 * Le jeton est facultatif : l'API répond sans, mais avec une limite de débit
 * plus basse. Définir DISCOGS_TOKEN si les recherches commencent à être
 * refusées.
 */
function buildHeaders(): HeadersInit {
	const token = process.env.DISCOGS_TOKEN;

	return {
		"User-Agent": USER_AGENT,
		...(token ? { Authorization: `Discogs token=${token}` } : {}),
	};
}

async function discogsFetch<T>(path: string): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const response = await fetch(`${DISCOGS_API}${path}`, {
			headers: buildHeaders(),
			signal: controller.signal,
			cache: "no-store",
		});

		if (response.status === 429) {
			throw new DiscogsError("Trop de recherches d'affilée.", true);
		}

		if (!response.ok) {
			throw new DiscogsError(`Discogs a répondu ${response.status}.`);
		}

		return (await response.json()) as T;
	} catch (error) {
		if (error instanceof DiscogsError) throw error;

		if (error instanceof Error && error.name === "AbortError") {
			throw new DiscogsError("Discogs met trop de temps à répondre.");
		}

		throw new DiscogsError("Discogs n'est pas joignable.");
	} finally {
		clearTimeout(timeout);
	}
}

function cleanArtistName(name: string): string {
	return name.replace(/\s*\(\d+\)$/, "").trim();
}

export function normalizeBarcode(barcode: string): string {
	return barcode.replace(/\D/g, "");
}

interface SearchResponse {
	results?: { id: number }[];
}

interface ReleaseResponse {
	id: number;
	title?: string;
	year?: number;
	artists?: { name: string }[];
	images?: { uri?: string; type?: string }[];
	thumb?: string;
}

export async function lookupBarcode(
	barcode: string,
): Promise<ReleaseMetadata | null> {
	const normalized = normalizeBarcode(barcode);

	if (!normalized) {
		return null;
	}

	const search = await discogsFetch<SearchResponse>(
		`/database/search?barcode=${encodeURIComponent(normalized)}&type=release&per_page=5`,
	);

	const firstMatch = search.results?.[0];

	if (!firstMatch) {
		return null;
	}

	const release = await discogsFetch<ReleaseResponse>(
		`/releases/${firstMatch.id}`,
	);

	const artist =
		release.artists
			?.map((entry) => cleanArtistName(entry.name))
			.filter(Boolean)
			.join(", ") ?? "";

	const primaryImage =
		release.images?.find((image) => image.type === "primary") ??
		release.images?.[0];

	return {
		artist,
		title: release.title?.trim() ?? "",
		year: release.year && release.year > 0 ? release.year : null,
		coverUrl: primaryImage?.uri ?? release.thumb ?? null,
		discogsId: release.id,
	};
}
