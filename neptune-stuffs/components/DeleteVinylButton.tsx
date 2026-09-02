"use client";

import { deleteVinylAction } from "@/app/actions/vinyls";
import ConfirmDeleteButton from "./ConfirmDeleteButton";

interface DeleteVinylButtonProps {
  vinylId: string;
  artist: string;
  title: string;
}

export default function DeleteVinylButton({
  vinylId,
  artist,
  title,
}: DeleteVinylButtonProps) {
  return (
    <ConfirmDeleteButton
      idName="vinylId"
      id={vinylId}
      label={`${artist} - ${title}`}
      question="Voulez-vous vraiment supprimer ce vinyle de votre collection ?"
      action={deleteVinylAction}
    />
  );
}
