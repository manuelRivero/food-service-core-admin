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
import type { BusinessWithSubscription, BusinessStatus } from "./types"

interface BlockModalProps {
  business: BusinessWithSubscription | null
  status: BusinessStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function BlockModal({
  business,
  status,
  open,
  onOpenChange,
  onConfirm,
}: BlockModalProps) {
  const isBlocked = status === "Blocked"

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBlocked ? "Unblock Business" : "Block Business"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBlocked
              ? `Are you sure you want to unblock ${business?.name}? This will restore their AI access.`
              : `Are you sure you want to block ${business?.name}? This will immediately disable their AI access.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {isBlocked ? "Unblock" : "Block"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
