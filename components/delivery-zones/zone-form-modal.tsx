"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ZONE_COLORS, type DeliveryZone, type ZoneFormData } from "./types"

interface ZoneFormModalProps {
  open: boolean
  zone: DeliveryZone | null
  onClose: () => void
  onSave: (data: ZoneFormData) => void
}

export function ZoneFormModal({
  open,
  zone,
  onClose,
  onSave,
}: ZoneFormModalProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(ZONE_COLORS[0].value)

  useEffect(() => {
    if (zone) {
      setName(zone.name)
      setColor(zone.color)
    } else {
      setName("")
      setColor(ZONE_COLORS[0].value)
    }
  }, [zone, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {zone ? "Edit Zone" : "Create New Zone"}
            </DialogTitle>
            <DialogDescription>
              {zone
                ? "Update the zone name and color."
                : "Enter a name and select a color for your new delivery zone. Then draw the zone on the map."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input
                id="zone-name"
                placeholder="e.g. Downtown Area"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label>Zone Color</Label>
              <div className="flex flex-wrap gap-2">
                {ZONE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`size-8 rounded-full transition-all ${
                      color === c.value
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setColor(c.value)}
                    title={c.label}
                  >
                    <span className="sr-only">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {zone ? "Save Changes" : "Create Zone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
