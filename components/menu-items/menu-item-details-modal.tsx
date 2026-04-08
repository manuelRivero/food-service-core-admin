"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { MenuItem } from "./types"

interface MenuItemDetailsModalProps {
  item: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MenuItemDetailsModal({
  item,
  open,
  onOpenChange,
}: MenuItemDetailsModalProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            Información completa del producto del menú.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Image */}
          {item.imageUrl ? (
            <div className="overflow-hidden rounded-lg">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="aspect-video w-full object-cover"
              />
            </div>
          ) : null}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="mt-1 text-sm">
                {item.description ?? "Sin descripción"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categoría</p>
              <p className="mt-1 font-medium">
                {item.categoryName ?? item.categoryId ?? "Sin categoría"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Porciones</p>
              <p className="mt-1 font-medium">
                {item.servesPeople != null
                  ? `${item.servesPeople} persona${item.servesPeople === 1 ? "" : "s"}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disponibilidad</p>
              <Badge
                variant={item.available ? "default" : "secondary"}
                className="mt-1"
              >
                {item.available ? "Disponible" : "No disponible"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Destacado</p>
              <Badge
                variant={item.featured ? "default" : "outline"}
                className="mt-1"
              >
                {item.featured ? "Destacado" : "Normal"}
              </Badge>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Fecha de creación</p>
              <p className="mt-1 font-medium">{formatDate(item.createdAt)}</p>
            </div>
          </div>

          {/* Ingredients Section */}
          {(item.ingredients || item.ingredientsNotes) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium leading-none">
                  Ingredientes
                </h4>
                {item.ingredients ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Lista</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {item.ingredients}
                    </p>
                  </div>
                ) : null}
                {item.ingredientsNotes ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Notas</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {item.ingredientsNotes}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          )}

          {/* Preparation Section */}
          {item.preparation && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium leading-none">
                  Preparación
                </h4>
                <p className="text-sm whitespace-pre-wrap">{item.preparation}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
