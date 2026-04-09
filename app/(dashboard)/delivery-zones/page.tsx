"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { MapPin, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { ZonesList } from "@/components/delivery-zones/zones-list"
import { ZoneFormModal } from "@/components/delivery-zones/zone-form-modal"
import { DeleteZoneDialog } from "@/components/delivery-zones/delete-zone-dialog"
import type { DeliveryZone, ZoneFormData } from "@/components/delivery-zones/types"

// Dynamic import for the map component (Leaflet requires window)
const ZoneMap = dynamic(
  () => import("@/components/delivery-zones/zone-map").then((mod) => mod.ZoneMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex size-full items-center justify-center bg-muted/30">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

// Mock initial data
const MOCK_ZONES: DeliveryZone[] = [
  {
    id: "zone-1",
    name: "Centro Historico",
    color: "#3b82f6",
    polygon: {
      type: "Polygon",
      coordinates: [
        [
          [-99.145, 19.44],
          [-99.125, 19.44],
          [-99.125, 19.42],
          [-99.145, 19.42],
          [-99.145, 19.44],
        ],
      ],
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "zone-2",
    name: "Polanco",
    color: "#22c55e",
    polygon: {
      type: "Polygon",
      coordinates: [
        [
          [-99.21, 19.44],
          [-99.19, 19.44],
          [-99.19, 19.42],
          [-99.21, 19.42],
          [-99.21, 19.44],
        ],
      ],
    },
    createdAt: "2024-01-16T10:00:00Z",
    updatedAt: "2024-01-16T10:00:00Z",
  },
  {
    id: "zone-3",
    name: "Roma Norte",
    color: "#f97316",
    polygon: {
      type: "Polygon",
      coordinates: [
        [
          [-99.175, 19.425],
          [-99.155, 19.425],
          [-99.155, 19.405],
          [-99.175, 19.405],
          [-99.175, 19.425],
        ],
      ],
    },
    createdAt: "2024-01-17T10:00:00Z",
    updatedAt: "2024-01-17T10:00:00Z",
  },
]

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>(MOCK_ZONES)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | null>(null)

  // Form modal state
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingZone, setDeletingZone] = useState<DeliveryZone | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCreateNew = () => {
    setEditingZone(null)
    setDrawnPolygon(null)
    setIsDrawing(true)
    setFormModalOpen(true)
    setSelectedZoneId(null)
  }

  const handlePolygonDrawn = useCallback((polygon: GeoJSON.Polygon) => {
    setDrawnPolygon(polygon)
  }, [])

  const handleSelectZone = useCallback((zoneId: string) => {
    setSelectedZoneId((prev) => (prev === zoneId ? null : zoneId))
  }, [])

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone)
    setDrawnPolygon(null)
    setIsDrawing(false)
    setFormModalOpen(true)
  }

  const handleDeleteZone = (zone: DeliveryZone) => {
    setDeletingZone(zone)
    setDeleteDialogOpen(true)
  }

  const handleSaveZone = async (data: ZoneFormData) => {
    setIsSaving(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (editingZone) {
      // Update existing zone
      setZones((prev) =>
        prev.map((z) =>
          z.id === editingZone.id
            ? {
                ...z,
                name: data.name,
                color: data.color,
                polygon: data.polygon ?? z.polygon,
                updatedAt: new Date().toISOString(),
              }
            : z
        )
      )
    } else if (data.polygon) {
      // Create new zone
      const newZone: DeliveryZone = {
        id: `zone-${Date.now()}`,
        name: data.name,
        color: data.color,
        polygon: data.polygon,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setZones((prev) => [...prev, newZone])
    }

    setIsSaving(false)
    setFormModalOpen(false)
    setIsDrawing(false)
    setDrawnPolygon(null)
    setEditingZone(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingZone) return

    setIsDeleting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    setZones((prev) => prev.filter((z) => z.id !== deletingZone.id))
    
    if (selectedZoneId === deletingZone.id) {
      setSelectedZoneId(null)
    }

    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setDeletingZone(null)
  }

  const handleFormModalChange = (open: boolean) => {
    setFormModalOpen(open)
    if (!open) {
      setIsDrawing(false)
      setDrawnPolygon(null)
      setEditingZone(null)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 lg:flex-row lg:gap-0">
      {/* Left Panel - Zones List */}
      <div className="flex w-full flex-col border-b bg-background p-4 lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Zonas de entrega</h1>
            <p className="text-sm text-muted-foreground">
              {zones.length} zona{zones.length !== 1 ? "s" : ""} configurada{zones.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Button onClick={handleCreateNew} className="mb-4 w-full">
          <Plus className="size-4" />
          Nueva zona
        </Button>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <Empty className="flex-1 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPin />
              </EmptyMedia>
              <EmptyTitle>Sin zonas de entrega</EmptyTitle>
              <EmptyDescription>
                Crea tu primera zona de entrega dibujando un poligono en el mapa.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ZonesList
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={handleSelectZone}
            onEditZone={handleEditZone}
            onDeleteZone={handleDeleteZone}
          />
        )}
      </div>

      {/* Right Panel - Map */}
      <div className="relative flex-1 bg-muted/30">
        <ZoneMap
          zones={zones}
          selectedZoneId={selectedZoneId}
          isDrawing={isDrawing}
          onPolygonDrawn={handlePolygonDrawn}
          onSelectZone={handleSelectZone}
          editingZone={editingZone}
        />
        
        {isDrawing && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <div className="pointer-events-auto rounded-lg bg-background/95 px-4 py-2 shadow-lg backdrop-blur">
              <p className="text-sm font-medium">
                Haz clic en el mapa para dibujar los vertices del poligono. Cierra el poligono haciendo clic en el primer punto.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ZoneFormModal
        open={formModalOpen}
        onOpenChange={handleFormModalChange}
        zone={editingZone}
        drawnPolygon={drawnPolygon}
        onSave={handleSaveZone}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteZoneDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        zone={deletingZone}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
