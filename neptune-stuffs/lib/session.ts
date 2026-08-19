import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "neptune_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

/**
 * Clé utilisée pour signer le cookie de session. On retombe sur le mot de passe
 * de l'app si APP_SESSION_SECRET n'est pas défini, pour que ça marche sans
 * configuration supplémentaire — mais définir APP_SESSION_SECRET est préférable :
 * changer le mot de passe invalide alors toutes les sessions existantes.
 */
function getSecret(): string {
  const secret = process.env.APP_SESSION_SECRET || process.env.APP_MOT_DE_PASSE;

  if (!secret) {
    throw new Error(
      "APP_SESSION_SECRET (ou APP_MOT_DE_PASSE) doit être défini pour signer les sessions.",
    );
  }

  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Comparaison à temps constant, tolérante aux longueurs différentes. */
function signatureMatches(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

/**
 * Pose le cookie de session. À appeler uniquement depuis une server action ou
 * un route handler (Next interdit l'écriture de cookies ailleurs).
 */
export async function createSession(): Promise<void> {
  const expiresAt = String(Date.now() + MAX_AGE_SECONDS * 1000);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, `${expiresAt}.${sign(expiresAt)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** true si la requête courante porte un cookie de session valide et non expiré. */
export async function isSessionValid(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const separatorIndex = token.indexOf(".");
  if (separatorIndex === -1) {
    return false;
  }

  const expiresAt = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  if (!signatureMatches(sign(expiresAt), signature)) {
    return false;
  }

  const expiresAtMs = Number(expiresAt);

  return Number.isFinite(expiresAtMs) && expiresAtMs > Date.now();
}
