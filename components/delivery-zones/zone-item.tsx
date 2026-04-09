"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DeliveryZone } from "./types"

interface ZoneItemProps {
  zone: DeliveryZone
  isSelected: boolean
  onSelect: (zone: DeliveryZone) => void
  onEdit: (zone: DeliveryZone) => void
  onDelete: (zone: DeliveryZone) => void
}

export function ZoneItem({
  zone,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: ZoneItemProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 transition-colors cursor-pointer ${
        isSelected
          ? "border-primary bg-accent"
          : "border-border hover:bg-accent/50"
      }`}
      onClick={() => onSelect(zone)}
    >
      <div className="flex items-center gap-3">
        <div
          className="size-4 rounded-full shrink-0"
          style={{ backgroundColor: zone.color }}
        />
        <span className="font-medium text-sm">{zone.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(zone)
          }}
        >
          <Pencil className="size-4" />
          <span className="sr-only">Edit zone</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(zone)
          }}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Delete zone</span>
        </Button>
      </div>
    </div>
  )
}
