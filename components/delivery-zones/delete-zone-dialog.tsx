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
import type { DeliveryZone } from "./types"

interface DeleteZoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone: DeliveryZone | null
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteZoneDialog({
  open,
  onOpenChange,
  zone,
  onConfirm,
  isDeleting,
}: DeleteZoneDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar zona de entrega</AlertDialogTitle>
          <AlertDialogDescription>
            {zone
              ? `¿Estas seguro de que deseas eliminar la zona "${zone.name}"? Esta accion no se puede deshacer.`
              : "¿Estas seguro de que deseas eliminar esta zona?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
