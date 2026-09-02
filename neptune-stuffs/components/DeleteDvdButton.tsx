"use client";

import { deleteDvdAction } from "@/app/actions/dvds";
import ConfirmDeleteButton from "./ConfirmDeleteButton";

interface DeleteDvdButtonProps {
  dvdId: string;
  title: string;
}

export default function DeleteDvdButton({
  dvdId,
  title,
}: DeleteDvdButtonProps) {
  return (
    <ConfirmDeleteButton
      idName="dvdId"
      id={dvdId}
      label={title}
      question="Voulez-vous vraiment supprimer ce dvd de votre collection ?"
      action={deleteDvdAction}
    />
  );
}
