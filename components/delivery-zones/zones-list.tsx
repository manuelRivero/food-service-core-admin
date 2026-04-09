"use client"

import { Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { DeliveryZone } from "./types"

interface ZonesListProps {
  zones: DeliveryZone[]
  selectedZoneId: string | null
  onSelectZone: (zoneId: string) => void
  onEditZone: (zone: DeliveryZone) => void
  onDeleteZone: (zone: DeliveryZone) => void
}

export function ZonesList({
  zones,
  selectedZoneId,
  onSelectZone,
  onEditZone,
  onDeleteZone,
}: ZonesListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2 p-1">
        {zones.map((zone) => (
          <ZoneItem
            key={zone.id}
            zone={zone}
            isSelected={selectedZoneId === zone.id}
            onSelect={() => onSelectZone(zone.id)}
            onEdit={() => onEditZone(zone)}
            onDelete={() => onDeleteZone(zone)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

interface ZoneItemProps {
  zone: DeliveryZone
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function ZoneItem({ zone, isSelected, onSelect, onEdit, onDelete }: ZoneItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-4 shrink-0 rounded-full"
          style={{ backgroundColor: zone.color }}
          aria-hidden="true"
        />
        <span className="truncate font-medium">{zone.name}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          aria-label={`Editar zona ${zone.name}`}
        >
          <Edit2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label={`Eliminar zona ${zone.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
