"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { MenuItem } from "./types"

interface ConfirmDeleteDialogProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmDeleteDialog({
  item,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Estás seguro de que deseas eliminar este producto?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {item
              ? `Se eliminará "${item.name}" del menú. Esta acción no se puede deshacer.`
              : "Esta acción no se puede deshacer."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
