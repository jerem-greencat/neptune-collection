"use server";

import { createSession, destroySession } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const identifiant = formData.get("identifier");
  const motDePasse = formData.get("password");

  const correctIdentifiant = process.env.APP_IDENTIFIANT;
  const correctMotDePasse = process.env.APP_MOT_DE_PASSE;

  if (identifiant === correctIdentifiant && motDePasse === correctMotDePasse) {
    await createSession();
    return { success: true, message: "Connexion réussie !" };
  }

  return {
    success: false,
    message: "Identifiant ou mot de passe incorrect.",
  };
}

export async function logoutAction() {
  await destroySession();
  return { success: true };
}
