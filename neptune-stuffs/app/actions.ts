'use server';

import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: FormData) {
  const identifiant = formData.get('identifier');
  const motDePasse = formData.get('password');

  const correctIdentifiant = process.env.APP_IDENTIFIANT;
  const correctMotDePasse = process.env.APP_MOT_DE_PASSE;

  if (identifiant === correctIdentifiant && motDePasse === correctMotDePasse) {
    return { success: true, message: 'Connexion réussie !' };
  } else {
    return { success: false, message: 'Identifiant ou mot de passe incorrect.' };
  }
}


const vinylSchema = z.object({
  artist: z.string().min(1, "Le nom de l'artiste est requis."),
  title: z.string().min(1, 'Le titre est requis.'),
});

export async function addVinylAction(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = vinylSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Veuillez remplir tous les champs." };
  }

  try {
    const client = await clientPromise;
    const db = client.db("neptune-collection");

    await db.collection("vinyls").insertOne(parsed.data);

    revalidatePath("/vinyls");
    return { success: true };

  } catch (error) {
    console.error("Erreur lors de l'ajout du vinyle:", error);
    return { success: false, error: "Une erreur est survenue sur le serveur." };
  }
}
