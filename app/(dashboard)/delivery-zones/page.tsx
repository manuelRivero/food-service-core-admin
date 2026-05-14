"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { ArrowLeft, MapPin, Plus, Loader2, CheckCircle2 } from "lucide-react"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import type {
  DeliveryZone,
  DeliveryZonesMapCenter,
  ZoneFormData,
} from "@/components/delivery-zones/types"
import {
  createAdminDeliveryZone,
  deleteAdminDeliveryZone,
  fetchAdminDeliveryZones,
  patchAdminDeliveryZone,
} from "@/lib/requests/delivery-zones"

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

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState<DeliveryZonesMapCenter | null>(null)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | null>(null)
  const [polygonEditingZone, setPolygonEditingZone] = useState<DeliveryZone | null>(null)
  const [isSavingPolygon, setIsSavingPolygon] = useState(false)

  // Create panel state (inline, replaces list)
  const [isCreating, setIsCreating] = useState(false)

  // Form modal state (edit only)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingZone, setDeletingZone] = useState<DeliveryZone | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadZones = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminDeliveryZones()
      setZones(data.items)
      setMapCenter(data.mapCenter)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudieron cargar las zonas de entrega."
      toast.error(
        typeof msg === "string" && msg
          ? msg
          : "No se pudieron cargar las zonas de entrega.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadZones()
  }, [loadZones])

  const handleCreateNew = () => {
    setEditingZone(null)
    setPolygonEditingZone(null)
    setDrawnPolygon(null)
    setIsDrawing(true)
    setIsCreating(true)
    setFormModalOpen(false)
    setSelectedZoneId(null)
  }

  const handleCancelCreate = () => {
    setIsCreating(false)
    setIsDrawing(false)
    setDrawnPolygon(null)
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
    setPolygonEditingZone(null)
    setIsDrawing(false)
    setFormModalOpen(true)
  }

  const handleEditZonePolygon = (zone: DeliveryZone) => {
    setSelectedZoneId(zone.id)
    setEditingZone(null)
    setFormModalOpen(false)
    setPolygonEditingZone(zone)
    setDrawnPolygon(null)
    setIsDrawing(true)
  }

  const handleDeleteZone = (zone: DeliveryZone) => {
    setDeletingZone(zone)
    setDeleteDialogOpen(true)
  }

  const handleSavePolygonEdit = async () => {
    if (!polygonEditingZone || !drawnPolygon) return
    setIsSavingPolygon(true)
    try {
      const updatedZone = await patchAdminDeliveryZone(polygonEditingZone.id, {
        name: polygonEditingZone.name,
        description: polygonEditingZone.description ?? "",
        deliveryFee: polygonEditingZone.deliveryFee,
        minOrderAmount: polygonEditingZone.minOrderAmount,
        estimatedDeliveryMinutes: polygonEditingZone.estimatedDeliveryMinutes,
        priority: polygonEditingZone.priority,
        isActive: polygonEditingZone.isActive,
        polygon: drawnPolygon,
      })
      setZones((prev) =>
        prev.map((z) => (z.id === polygonEditingZone.id ? updatedZone : z)),
      )
      toast.success("Poligono actualizado correctamente")
      setPolygonEditingZone(null)
      setDrawnPolygon(null)
      setIsDrawing(false)
      await loadZones()
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudo guardar el poligono."
      toast.error(
        typeof msg === "string" && msg ? msg : "No se pudo guardar el poligono.",
      )
    } finally {
      setIsSavingPolygon(false)
    }
  }

  const handleCancelPolygonEdit = () => {
    setPolygonEditingZone(null)
    setDrawnPolygon(null)
    setIsDrawing(false)
  }

  const handleSaveZone = async (data: ZoneFormData) => {
    setIsSaving(true)
    try {
      if (editingZone) {
        const updatedZone = await patchAdminDeliveryZone(editingZone.id, data)
        setZones((prev) =>
          prev.map((z) => (z.id === editingZone.id ? updatedZone : z)),
        )
        toast.success("Zona actualizada correctamente")
      } else if (data.polygon) {
        const createdZone = await createAdminDeliveryZone(data)
        setZones((prev) => [...prev, createdZone])
        toast.success("Zona creada correctamente")
      }

      setFormModalOpen(false)
      setIsCreating(false)
      setIsDrawing(false)
      setDrawnPolygon(null)
      setEditingZone(null)
      await loadZones()
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudo guardar la zona."
      toast.error(typeof msg === "string" && msg ? msg : "No se pudo guardar la zona.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingZone) return

    setIsDeleting(true)
    try {
      const deletedId = await deleteAdminDeliveryZone(deletingZone.id)
      setZones((prev) => prev.filter((z) => z.id !== deletedId))
      if (selectedZoneId === deletedId) {
        setSelectedZoneId(null)
      }
      setDeleteDialogOpen(false)
      setDeletingZone(null)
      toast.success("Zona eliminada correctamente")
      await loadZones()
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudo eliminar la zona."
      toast.error(
        typeof msg === "string" && msg ? msg : "No se pudo eliminar la zona.",
      )
    } finally {
      setIsDeleting(false)
    }
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
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col gap-4 overflow-hidden lg:flex-row lg:gap-0">
      {/* Left Panel */}
      <div className="flex w-full min-h-0 flex-col overflow-hidden border-b bg-background p-4 lg:w-80 lg:shrink-0 lg:border-b-0 lg:border-r">
        {isCreating ? (
          <ZoneCreatePanel
            drawnPolygon={drawnPolygon}
            isSaving={isSaving}
            onCancel={handleCancelCreate}
            onSave={handleSaveZone}
          />
        ) : (
          <>
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
                    Crea tu primera zona de entrega dibujando un polígono en el mapa.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ZonesList
                zones={zones}
                selectedZoneId={selectedZoneId}
                onSelectZone={handleSelectZone}
                onEditZone={handleEditZone}
                onEditZonePolygon={handleEditZonePolygon}
                onDeleteZone={handleDeleteZone}
              />
            )}
          </>
        )}
      </div>

      {/* Right Panel - Map */}
      <div className="relative min-h-0 flex-1 bg-muted/30">
        <ZoneMap
          zones={zones}
          mapCenter={mapCenter}
          selectedZoneId={selectedZoneId}
          isDrawing={isDrawing}
          onPolygonDrawn={handlePolygonDrawn}
          onSelectZone={handleSelectZone}
          editingZone={polygonEditingZone}
        />
        
        {isDrawing && !(isCreating && drawnPolygon) && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <div className="pointer-events-auto rounded-lg bg-background/95 px-4 py-2 shadow-lg backdrop-blur">
              <p className="text-sm font-medium">
                {polygonEditingZone
                  ? "Edita los vértices del polígono actual o dibuja uno nuevo para reemplazarlo."
                  : "Hacé clic en el mapa para dibujar los vértices del polígono. Cerrá el polígono haciendo clic en el primer punto."}
              </p>
            </div>
          </div>
        )}

        {polygonEditingZone && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
              <p className="mr-2 text-sm text-muted-foreground">
                Editando poligono: <span className="font-medium text-foreground">{polygonEditingZone.name}</span>
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelPolygonEdit}
                disabled={isSavingPolygon}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSavePolygonEdit}
                disabled={!drawnPolygon || isSavingPolygon}
              >
                {isSavingPolygon ? "Guardando..." : "Guardar poligono"}
              </Button>
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

interface ZoneCreatePanelProps {
  drawnPolygon: GeoJSON.Polygon | null
  isSaving: boolean
  onCancel: () => void
  onSave: (data: ZoneFormData) => void
}

function ZoneCreatePanel({ drawnPolygon, isSaving, onCancel, onSave }: ZoneCreatePanelProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [deliveryFee, setDeliveryFee] = useState("0")
  const [minOrderAmount, setMinOrderAmount] = useState("0")
  const [estimatedDeliveryMinutes, setEstimatedDeliveryMinutes] = useState("30")
  const [priority, setPriority] = useState("10")
  const [isActive, setIsActive] = useState(true)

  const canSave = name.trim() !== "" && drawnPolygon !== null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave || !drawnPolygon) return

    const fee = Number(deliveryFee)
    const min = Number(minOrderAmount)
    const eta = Number(estimatedDeliveryMinutes)
    const prio = Number(priority)

    if (
      !Number.isFinite(fee) ||
      !Number.isFinite(min) ||
      !Number.isFinite(eta) ||
      !Number.isFinite(prio)
    ) {
      return
    }

    onSave({
      name: name.trim(),
      description,
      deliveryFee: fee,
      minOrderAmount: min,
      estimatedDeliveryMinutes: eta,
      priority: prio,
      isActive,
      polygon: drawnPolygon,
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={onCancel}
          aria-label="Volver al listado"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight">Nueva zona de entrega</h2>
          <p className="truncate text-xs text-muted-foreground">
            Completá los datos y dibujá el polígono en el mapa
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-4 pb-2">
            <div
              className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                drawnPolygon
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
              }`}
            >
              {drawnPolygon ? (
                <>
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <span>Polígono dibujado correctamente.</span>
                </>
              ) : (
                <span>
                  Hacé clic en el mapa de la derecha para dibujar los vértices del polígono.
                  Cerrá el polígono haciendo clic en el primer punto.
                </span>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-zone-name">Nombre de la zona</Label>
              <Input
                id="new-zone-name"
                placeholder="Ej: Centro Histórico"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-zone-desc">Descripción (opcional)</Label>
              <Textarea
                id="new-zone-desc"
                placeholder="Cobertura principal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="new-zone-fee">Costo de envío</Label>
                <Input
                  id="new-zone-fee"
                  type="number"
                  min={0}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-zone-min">Pedido mínimo</Label>
                <Input
                  id="new-zone-min"
                  type="number"
                  min={0}
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-zone-eta">Minutos estimados</Label>
                <Input
                  id="new-zone-eta"
                  type="number"
                  min={1}
                  value={estimatedDeliveryMinutes}
                  onChange={(e) => setEstimatedDeliveryMinutes(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-zone-priority">Prioridad</Label>
                <Input
                  id="new-zone-priority"
                  type="number"
                  min={0}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="new-zone-active">Zona activa</Label>
              <Switch
                id="new-zone-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="Alternar estado de zona activa"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={!canSave || isSaving}>
            {isSaving ? "Creando..." : "Crear zona"}
          </Button>
        </div>
      </form>
    </div>
  )
}
