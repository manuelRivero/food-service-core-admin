"use client"

import { MessageSquare } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-muted/30 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Sin conversacion seleccionada</h3>
        <p className="text-sm text-muted-foreground">
          Selecciona una conversacion para comenzar a enviar mensajes
        </p>
      </div>
    </div>
  )
}
