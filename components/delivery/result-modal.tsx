"use client"

import { CheckCircle2Icon, XCircleIcon, MapPinIcon, UserIcon, PackageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { DeliveryOrder } from "./order-card"

interface ResultModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  success: boolean
  order?: DeliveryOrder | null
  onConfirm: () => void
  onTryAgain: () => void
  isConfirming?: boolean
}

export function ResultModal({
  open,
  onOpenChange,
  success,
  order,
  onConfirm,
  onTryAgain,
  isConfirming = false,
}: ResultModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div
            className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
              success ? "bg-green-100 dark:bg-green-900/30" : "bg-destructive/10"
            }`}
          >
            {success ? (
              <CheckCircle2Icon className="h-10 w-10 text-green-600 dark:text-green-400" />
            ) : (
              <XCircleIcon className="h-10 w-10 text-destructive" />
            )}
          </div>
          <DialogTitle className="text-xl">
            {success ? "Entrega confirmada" : "Codigo QR invalido"}
          </DialogTitle>
          <DialogDescription>
            {success
              ? "El codigo QR ha sido validado correctamente."
              : "El codigo QR escaneado no corresponde a ningun pedido activo."}
          </DialogDescription>
        </DialogHeader>

        {success && order && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <PackageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Pedido:</span>
              <span className="font-mono font-semibold">#{order.id}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{order.customerName}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPinIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground shrink-0">Direccion:</span>
              <span className="text-foreground">{order.address}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          {success ? (
            <Button
              onClick={onConfirm}
              disabled={isConfirming}
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
            >
              {isConfirming ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="h-5 w-5" />
                  Confirmar entrega
                </>
              )}
            </Button>
          ) : (
            <>
              <Button onClick={onTryAgain} className="w-full h-12 text-base">
                Intentar de nuevo
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full h-12 text-base"
              >
                Cancelar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
