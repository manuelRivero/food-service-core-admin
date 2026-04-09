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
  zone: DeliveryZone | null
  onClose: () => void
  onConfirm: () => void
}

export function DeleteZoneDialog({
  open,
  zone,
  onClose,
  onConfirm,
}: DeleteZoneDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Zone</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this zone
            {zone ? ` "${zone.name}"` : ""}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
