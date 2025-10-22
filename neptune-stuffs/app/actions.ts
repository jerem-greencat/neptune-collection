'use server';

import { z } from 'zod';
import clientPromise from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';

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

const dvdSchema = z.object({
  title: z.string().min(1, "Le titre du dvd est requis."),
})

export async function addDvdAction(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = dvdSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "Veuillez remplir tous les champs." };
  }

  try {
    const client = await clientPromise;
    const db = client.db("neptune-collection");

    await db.collection("dvds").insertOne(parsed.data);

    revalidatePath("/dvds");
    return { success: true };

  } catch (error) {
    console.error("Erreur lors de l'ajout du dvd:", error);
    return { success: false, error: "Une erreur est survenue sur le serveur." };
  }
}


const deleteDvdSchema = z.object({
  dvdId: z.string().min(1, "L'ID du dvd est requis."),
});

export async function deleteDvdAction(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = deleteDvdSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "ID du dvd manquant." };
  }

  try {
    const client = await clientPromise;
    const db = client.db("neptune-collection");

    await db.collection("dvds").deleteOne({
      _id: new ObjectId(parsed.data.dvdId) 
    });

    revalidatePath("/dvds"); 
    return { success: true };

  } catch (error) {
    console.error("Erreur lors de la suppression du dvd:", error);
    return { success: false, error: "Une erreur est survenue sur le serveur." };
  }
}

const updateDvdSchema = z.object({
  dvdId: z.string().min(1, "L'ID du vinyle est requis."),
  title: z.string().min(1, 'Le titre est requis.'),
});


export async function updateDvdAction(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = updateDvdSchema.safeParse(data);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message).join(', ');
    return { success: false, error: errorMessages };
  }

  try {
    const client = await clientPromise;
    const db = client.db("neptune-collection");

    const { dvdId, title } = parsed.data;

    await db.collection("dvds").updateOne(
      { _id: new ObjectId(dvdId) }, 
      { $set: { title: title } } 
    );

    revalidatePath("/dvds"); 
    return { success: true };

  } catch (error) {
    console.error("Erreur lors de la mise à jour du dvd:", error);
    return { success: false, error: "Une erreur est survenue sur le serveur." };
  }
}

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

const deleteVinylSchema = z.object({
  vinylId: z.string().min(1, "L'ID du vinyle est requis."),
});

export async function deleteVinylAction(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = deleteVinylSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: "ID du vinyle manquant." };
  }

  try {
    const client = await clientPromise;
    const db = client.db("neptune-collection");

    await db.collection("vinyls").deleteOne({
      _id: new ObjectId(parsed.data.vinylId) 
    });

    revalidatePath("/vinyls"); 
    return { success: true };

  } catch (error) {
    console.error("Erreur lors de la suppression du vinyle:", error);
    return { success: false, error: "Une erreur est survenue sur le serveur." };
  }
}


const updateVinylSchema = z.object({
  vinylId: z.string().min(1, "L'ID du vinyle est requis."),
  artist: z.string().min(1, "Le nom de l'artiste est requis."),
  title: z.string().min(1, 'Le titre est requis.'),
});

export async function updateVinylAction(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = updateVinylSchema.safeParse(data);

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(issue => issue.message).join(', ');
    return { success: false, error: errorMessages };
  }

  try {
    const client = await clientPromise;
    const db = client.db("neptune-collection");

    const { vinylId, artist, title } = parsed.data;

    await db.collection("vinyls").updateOne(
      { _id: new ObjectId(vinylId) }, 
      { $set: { artist: artist, title: title } } 
    );

    revalidatePath("/vinyls"); 
    return { success: true };

  } catch (error) {
    console.error("Erreur lors de la mise à jour du vinyle:", error);
    return { success: false, error: "Une erreur est survenue sur le serveur." };
  }
}