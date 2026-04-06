"use client"

import { CameraIcon, AlertCircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PermissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestPermission: () => void
  isRequesting?: boolean
  error?: string | null
  onRetry?: () => void
}

export function PermissionModal({
  open,
  onOpenChange,
  onRequestPermission,
  isRequesting = false,
  error = null,
  onRetry,
}: PermissionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {error ? (
              <AlertCircleIcon className="h-8 w-8 text-destructive" />
            ) : (
              <CameraIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <DialogTitle className="text-xl">
            {error ? "Acceso a camara denegado" : "Escanear QR del cliente"}
          </DialogTitle>
          <DialogDescription>
            {error
              ? "No se pudo acceder a la camara. Por favor, habilita el permiso en la configuracion de tu navegador e intenta nuevamente."
              : "Pide al cliente que muestre su codigo QR para confirmar la entrega."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          {error ? (
            <>
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive text-center">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-12"
                >
                  Cancelar
                </Button>
                {onRetry && (
                  <Button onClick={onRetry} className="flex-1 h-12">
                    Reintentar
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={onRequestPermission}
                disabled={isRequesting}
                className="w-full h-12 text-base"
              >
                {isRequesting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Solicitando permiso...
                  </>
                ) : (
                  <>
                    <CameraIcon className="h-5 w-5" />
                    Habilitar camara
                  </>
                )}
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
