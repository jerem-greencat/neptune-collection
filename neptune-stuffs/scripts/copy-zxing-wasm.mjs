import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copie le binaire WebAssembly du lecteur de codes-barres dans `public/`.
 *
 * Par défaut, zxing-wasm va chercher ce fichier sur un CDN. Le servir
 * nous-mêmes évite une dépendance réseau tierce au moment du scan — c'est
 * précisément le moment où l'utilisateur est en magasin, avec un réseau
 * incertain — et garantit que le binaire correspond à la version installée.
 *
 * Lancé au `postinstall`, donc le fichier n'a pas besoin d'être versionné.
 */
const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

const source = join(
	racine,
	"node_modules/zxing-wasm/dist/reader/zxing_reader.wasm",
);
const destination = join(racine, "public/zxing_reader.wasm");

try {
	await mkdir(dirname(destination), { recursive: true });
	await copyFile(source, destination);
	console.log("zxing_reader.wasm copié dans public/");
} catch (error) {
	console.error(
		"Impossible de copier zxing_reader.wasm — le scan de codes-barres ne fonctionnera pas.",
		error,
	);
	process.exitCode = 1;
}
