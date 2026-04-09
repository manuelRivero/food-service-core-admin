"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ZONE_COLORS, type DeliveryZone, type ZoneFormData } from "./types"

interface ZoneFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone: DeliveryZone | null
  drawnPolygon: GeoJSON.Polygon | null
  onSave: (data: ZoneFormData) => void
  isSaving: boolean
}

export function ZoneFormModal({
  open,
  onOpenChange,
  zone,
  drawnPolygon,
  onSave,
  isSaving,
}: ZoneFormModalProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(ZONE_COLORS[0].value)

  const isEditing = !!zone

  useEffect(() => {
    if (open) {
      if (zone) {
        setName(zone.name)
        setColor(zone.color)
      } else {
        setName("")
        setColor(ZONE_COLORS[Math.floor(Math.random() * ZONE_COLORS.length)].value)
      }
    }
  }, [open, zone])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const polygon = zone?.polygon ?? drawnPolygon
    
    if (!name.trim()) {
      return
    }

    if (!polygon) {
      return
    }

    onSave({
      name: name.trim(),
      color,
      polygon,
    })
  }

  const polygon = zone?.polygon ?? drawnPolygon
  const canSave = name.trim() && polygon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar zona de entrega" : "Nueva zona de entrega"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica el nombre o color de la zona."
              : "Configura el nombre y color para la nueva zona."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="zone-name">Nombre de la zona</Label>
              <Input
                id="zone-name"
                placeholder="Ej: Centro Historico"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {ZONE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`size-8 rounded-full border-2 transition-all ${
                      color === c.value
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    aria-label={`Seleccionar color ${c.name}`}
                    aria-pressed={color === c.value}
                  />
                ))}
              </div>
            </div>
            {!polygon && !isEditing && (
              <p className="text-sm text-muted-foreground">
                Dibuja un poligono en el mapa para definir la zona.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave || isSaving}>
              {isSaving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear zona"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
