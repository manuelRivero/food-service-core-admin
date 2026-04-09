"use client"

import { MapPin, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ZoneItem } from "./zone-item"
import type { DeliveryZone } from "./types"

interface ZonesListProps {
  zones: DeliveryZone[]
  selectedZone: DeliveryZone | null
  isLoading: boolean
  onSelectZone: (zone: DeliveryZone | null) => void
  onEditZone: (zone: DeliveryZone) => void
  onDeleteZone: (zone: DeliveryZone) => void
  onCreateZone: () => void
}

export function ZonesList({
  zones,
  selectedZone,
  isLoading,
  onSelectZone,
  onEditZone,
  onDeleteZone,
  onCreateZone,
}: ZonesListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Delivery Zones</h2>
        <Button size="sm" onClick={onCreateZone}>
          <Plus className="mr-1 size-4" />
          Create New Zone
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          {isLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </>
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <MapPin className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No delivery zones created</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first delivery zone to get started
              </p>
            </div>
          ) : (
            zones.map((zone) => (
              <ZoneItem
                key={zone.id}
                zone={zone}
                isSelected={selectedZone?.id === zone.id}
                onSelect={onSelectZone}
                onEdit={onEditZone}
                onDelete={onDeleteZone}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
