"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import {
  Plus,
  Save,
  Move,
  Square,
  Circle,
  Users,
  Trash2,
  Loader2,
  CalendarClock,
} from "lucide-react"

import { useAdminSocket } from "@/contexts/admin-socket-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  adminTableToUi,
  createAdminTable,
  deleteAdminTable,
  fetchAdminTables,
  patchAdminTable,
  uiTableToPatch,
  type UiTable,
} from "@/lib/requests/admin-tables"
import {
  createAdminEnvironment,
  fetchAdminEnvironments,
  type AdminEnvironment,
} from "@/lib/requests/admin-environments"
import {
  aggregateReservationsByTableId,
  fetchTodayReservationRaws,
  type TableReservationSlot,
} from "@/lib/requests/reservations"

const statusColors = {
  active: "bg-emerald-500",
  inactive: "bg-gray-400",
}

const statusLabels = {
  active: "Activa",
  inactive: "Inactiva",
}

function apiErrorMessage(e: unknown, fallback: string): string {
  if (!isAxiosError(e)) return fallback
  const d = e.response?.data as {
    message?: string
    error?: string
    details?: unknown
  }
  const msg = d?.message ?? d?.error ?? e.message
  if (typeof msg === "string" && msg.trim()) return msg.trim()
  if (d?.details != null) {
    try {
      return `${fallback} (${JSON.stringify(d.details)})`
    } catch {
      return fallback
    }
  }
  return fallback
}

type CreateTableForm = {
  environmentId: string
  name: string
  capacity: string
  shape: "circle" | "rect"
  isActive: boolean
}

const DEFAULT_CREATE_FORM: CreateTableForm = {
  environmentId: "",
  name: "",
  capacity: "4",
  shape: "circle",
  isActive: true,
}

/** Límite de caracteres del nombre (igual que la longitud de «mesa de prueba»). */
const TABLE_NAME_MAX_LENGTH = "mesa de prueba".length

const ENV_NAME_MAX_LENGTH = 120
const ENV_DESCRIPTION_MAX_LENGTH = 500

type CreateEnvironmentForm = {
  name: string
  description: string
  isOutdoor: boolean
  isActive: boolean
}

const DEFAULT_CREATE_ENVIRONMENT_FORM: CreateEnvironmentForm = {
  name: "",
  description: "",
  isOutdoor: false,
  isActive: true,
}

export default function TablesPage() {
  const { subscribeToReservationRealtime } = useAdminSocket()
  const [tables, setTables] = useState<UiTable[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [savingLayout, setSavingLayout] = useState(false)
  const [savingProperties, setSavingProperties] = useState(false)
  const [deletingTable, setDeletingTable] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("")
  const [reservationByTableId, setReservationByTableId] = useState<
    Map<string, TableReservationSlot[]>
  >(() => new Map())
  const [reservationsError, setReservationsError] = useState<string | null>(null)
  const [reservationsLoading, setReservationsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const [createTableOpen, setCreateTableOpen] = useState(false)
  const [createTableForm, setCreateTableForm] = useState<CreateTableForm>(DEFAULT_CREATE_FORM)
  const [createTableErrors, setCreateTableErrors] = useState<{
    environmentId?: string
    name?: string
    capacity?: string
  }>({})
  const [creatingTable, setCreatingTable] = useState(false)

  const [environments, setEnvironments] = useState<AdminEnvironment[]>([])
  const [createEnvironmentOpen, setCreateEnvironmentOpen] = useState(false)
  const [createEnvironmentForm, setCreateEnvironmentForm] = useState<CreateEnvironmentForm>(
    DEFAULT_CREATE_ENVIRONMENT_FORM,
  )
  const [createEnvironmentErrors, setCreateEnvironmentErrors] = useState<{
    name?: string
    description?: string
  }>({})
  const [creatingEnvironment, setCreatingEnvironment] = useState(false)

  const environmentOptions = useMemo(() => {
    const byId = new Map<string, string>()
    for (const e of environments) {
      byId.set(e.id, e.name)
    }
    for (const t of tables) {
      if (!byId.has(t.environmentId)) {
        byId.set(t.environmentId, t.environmentName)
      }
    }
    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
  }, [environments, tables])

  const hasEnvironments = environmentOptions.length > 0

  /** Un ambiente a la vez: no hay vista “todos mezclados”. */
  const activeEnvironmentId = useMemo(() => {
    if (environmentOptions.length === 0) return ""
    if (
      selectedEnvironmentId &&
      environmentOptions.some((e) => e.id === selectedEnvironmentId)
    ) {
      return selectedEnvironmentId
    }
    return environmentOptions[0].id
  }, [environmentOptions, selectedEnvironmentId])

  const loadReservationsMap = useCallback(async () => {
    setReservationsLoading(true)
    setReservationsError(null)
    try {
      const raws = await fetchTodayReservationRaws()
      setReservationByTableId(aggregateReservationsByTableId(raws))
    } catch (e) {
      setReservationsError(apiErrorMessage(e, "No se pudieron cargar las reservas del día."))
      setReservationByTableId(new Map())
    } finally {
      setReservationsLoading(false)
    }
  }, [])

  const loadTables = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const [tablesResult, envResult] = await Promise.allSettled([
        fetchAdminTables(),
        fetchAdminEnvironments(),
      ])

      if (tablesResult.status === "rejected") {
        setTables([])
        setEnvironments([])
        setLoadError(
          apiErrorMessage(tablesResult.reason, "No se pudieron cargar las mesas."),
        )
        return
      }

      const rows = tablesResult.value
      setTables(rows.map(adminTableToUi))

      if (envResult.status === "fulfilled") {
        setEnvironments(envResult.value)
      } else {
        setEnvironments([])
        toast.error("No se pudieron cargar los ambientes", {
          description: apiErrorMessage(
            envResult.reason,
            "Se usarán los datos de ambiente que vienen con cada mesa.",
          ),
        })
      }

      void loadReservationsMap()
    } finally {
      setIsLoading(false)
    }
  }, [loadReservationsMap])

  useEffect(() => {
    void loadTables()
  }, [loadTables])

  useEffect(() => {
    return subscribeToReservationRealtime(() => {
      void loadReservationsMap()
    })
  }, [subscribeToReservationRealtime, loadReservationsMap])

  const tablesInActiveEnvironment = useMemo(
    () =>
      activeEnvironmentId
        ? tables.filter((t) => t.environmentId === activeEnvironmentId)
        : [],
    [tables, activeEnvironmentId],
  )

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null
  const selectedReservationSlots = selectedTableId
    ? reservationByTableId.get(selectedTableId)
    : undefined

  useEffect(() => {
    if (!selectedTableId || !activeEnvironmentId) return
    const row = tables.find((x) => x.id === selectedTableId)
    if (row && row.environmentId !== activeEnvironmentId) {
      setSelectedTableId(null)
    }
  }, [activeEnvironmentId, selectedTableId, tables])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, tableId: string) => {
      e.preventDefault()
      const table = tables.find((t) => t.id === tableId)
      if (!table || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - canvasRect.left - table.x,
        y: e.clientY - canvasRect.top - table.y,
      })
      setSelectedTableId(tableId)
      setIsDragging(true)
    },
    [tables],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedTableId || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      const newX = Math.max(
        0,
        Math.min(canvasRect.width - 100, e.clientX - canvasRect.left - dragOffset.x),
      )
      const newY = Math.max(
        0,
        Math.min(canvasRect.height - 80, e.clientY - canvasRect.top - dragOffset.y),
      )

      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, x: newX, y: newY } : t)),
      )
    },
    [isDragging, selectedTableId, dragOffset],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedTableId(null)
    }
  }, [])

  const updateSelectedTable = useCallback(
    (updates: Partial<UiTable>) => {
      if (!selectedTableId) return
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, ...updates } : t)),
      )
    },
    [selectedTableId],
  )

  const addNewTable = useCallback(() => {
    const preferred =
      activeEnvironmentId && environmentOptions.some((e) => e.id === activeEnvironmentId)
        ? activeEnvironmentId
        : (environmentOptions[0]?.id ?? "")
    setCreateTableForm({ ...DEFAULT_CREATE_FORM, environmentId: preferred })
    setCreateTableErrors({})
    setCreateTableOpen(true)
  }, [activeEnvironmentId, environmentOptions])

  const openCreateEnvironment = useCallback(() => {
    setCreateEnvironmentForm(DEFAULT_CREATE_ENVIRONMENT_FORM)
    setCreateEnvironmentErrors({})
    setCreateEnvironmentOpen(true)
  }, [])

  const handleCreateEnvironmentSubmit = useCallback(async () => {
    const errors: { name?: string; description?: string } = {}
    const nameTrim = createEnvironmentForm.name.trim()
    if (!nameTrim) {
      errors.name = "El nombre es obligatorio."
    } else if (nameTrim.length > ENV_NAME_MAX_LENGTH) {
      errors.name = `El nombre no puede superar ${ENV_NAME_MAX_LENGTH} caracteres.`
    }

    const descTrim = createEnvironmentForm.description.trim()
    if (createEnvironmentForm.description.length > ENV_DESCRIPTION_MAX_LENGTH) {
      errors.description = `La descripción no puede superar ${ENV_DESCRIPTION_MAX_LENGTH} caracteres.`
    }

    if (Object.keys(errors).length > 0) {
      setCreateEnvironmentErrors(errors)
      return
    }

    setCreatingEnvironment(true)
    try {
      const created = await createAdminEnvironment({
        name: nameTrim,
        description: descTrim === "" ? null : descTrim,
        isOutdoor: createEnvironmentForm.isOutdoor,
        isActive: createEnvironmentForm.isActive,
      })
      setEnvironments((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "es")),
      )
      setSelectedEnvironmentId(created.id)
      setCreateEnvironmentOpen(false)
      toast.success("Ambiente creado", { description: created.name })
    } catch (e) {
      toast.error("No se pudo crear el ambiente", {
        description: apiErrorMessage(e, "Intentá de nuevo en unos segundos."),
      })
    } finally {
      setCreatingEnvironment(false)
    }
  }, [createEnvironmentForm])

  const handleCreateTableSubmit = useCallback(async () => {
    const errors: { environmentId?: string; name?: string; capacity?: string } = {}
    const envId = createTableForm.environmentId.trim()
    if (!envId) {
      errors.environmentId = "Seleccioná un ambiente."
    } else if (!environmentOptions.some((e) => e.id === envId)) {
      errors.environmentId = "Ese ambiente ya no está disponible. Elegí otro en la lista."
    }

    const trimmedName = createTableForm.name.trim()
    if (!trimmedName) {
      errors.name = "El nombre es requerido."
    } else if (trimmedName.length > TABLE_NAME_MAX_LENGTH) {
      errors.name = `El nombre no puede superar ${TABLE_NAME_MAX_LENGTH} caracteres (como máximo «mesa de prueba»).`
    }
    const cap = parseInt(createTableForm.capacity, 10)
    if (!createTableForm.capacity.trim() || isNaN(cap) || cap < 1) {
      errors.capacity = "La capacidad debe ser un número mayor a 0."
    }
    if (Object.keys(errors).length > 0) {
      setCreateTableErrors(errors)
      return
    }

    setCreatingTable(true)
    try {
      const created = await createAdminTable({
        environmentId: envId,
        name: trimmedName,
        capacity: cap,
      })
      let ui = adminTableToUi(created)
      ui = { ...ui, shape: createTableForm.shape, isActive: createTableForm.isActive }
      setTables((prev) => [...prev, ui])
      setSelectedTableId(ui.id)
      setSelectedEnvironmentId(ui.environmentId)
      setCreateTableOpen(false)
      toast.success("Mesa creada", { description: `Se creó ${ui.name}` })
    } catch (e) {
      const msg = apiErrorMessage(e, "No se pudo crear la mesa.")
      toast.error("Error al crear mesa", { description: msg })
    } finally {
      setCreatingTable(false)
    }
  }, [createTableForm, environmentOptions])

  const saveLayout = useCallback(async () => {
    const toSave = tables.filter((t) => t.environmentId === activeEnvironmentId)
    if (toSave.length === 0) return

    setSavingLayout(true)
    const loadingId = toast.loading("Guardando layout…", {
      description: `Sincronizando ${toSave.length} ${toSave.length === 1 ? "mesa" : "mesas"} del ambiente actual.`,
    })
    try {
      await Promise.all(
        toSave.map((t) => patchAdminTable(t.id, uiTableToPatch(t))),
      )
      toast.dismiss(loadingId)
      const desc = `Se actualizaron ${toSave.length} ${toSave.length === 1 ? "mesa" : "mesas"} en este ambiente.`
      toast.success("Layout guardado", { description: desc })
      await loadTables()
    } catch (e) {
      toast.dismiss(loadingId)
      const msg = apiErrorMessage(e, "No se pudo guardar el layout de este ambiente.")
      toast.error("Error al guardar layout", { description: msg })
    } finally {
      setSavingLayout(false)
    }
  }, [tables, activeEnvironmentId, loadTables])

  const saveSelectedProperties = useCallback(async () => {
    if (!selectedTable) return
    const nameTrim = selectedTable.name.trim()
    if (nameTrim.length > TABLE_NAME_MAX_LENGTH) {
      toast.error("Nombre demasiado largo", {
        description: `Como máximo ${TABLE_NAME_MAX_LENGTH} caracteres (el largo de «mesa de prueba»).`,
      })
      return
    }
    setSavingProperties(true)
    const loadingId = toast.loading("Guardando mesa…", {
      description: selectedTable.name,
    })
    try {
      const updated = await patchAdminTable(selectedTable.id, uiTableToPatch(selectedTable))
      setTables((prev) =>
        prev.map((t) => (t.id === updated.id ? adminTableToUi(updated) : t)),
      )
      toast.dismiss(loadingId)
      const desc = `${updated.name} se actualizó correctamente.`
      toast.success("Cambios guardados", { description: desc })
    } catch (e) {
      toast.dismiss(loadingId)
      const msg = apiErrorMessage(e, "No se pudo actualizar la mesa.")
      toast.error("Error al guardar la mesa", { description: msg })
    } finally {
      setSavingProperties(false)
    }
  }, [selectedTable])

  const deleteSelectedTable = useCallback(async () => {
    if (!selectedTable) return
    const id = selectedTable.id
    const name = selectedTable.name
    setDeletingTable(true)
    const loadingId = toast.loading("Eliminando mesa…", { description: name })
    try {
      await deleteAdminTable(id)
      setTables((prev) => prev.filter((t) => t.id !== id))
      setSelectedTableId(null)
      toast.dismiss(loadingId)
      const desc = `Se eliminó ${name}.`
      toast.success("Mesa eliminada", { description: desc })
    } catch (e) {
      toast.dismiss(loadingId)
      const msg = apiErrorMessage(e, "No se pudo eliminar la mesa.")
      toast.error("Error al eliminar", { description: msg })
    } finally {
      setDeletingTable(false)
    }
  }, [selectedTable])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Dialog open={createTableOpen} onOpenChange={setCreateTableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva mesa</DialogTitle>
            <DialogDescription>
              Elegí el ambiente y completá los datos de la mesa. Todos los campos marcados con * son
              obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-table-environment">Ambiente *</Label>
              <Select
                value={createTableForm.environmentId || undefined}
                onValueChange={(id) => {
                  setCreateTableForm((f) => ({ ...f, environmentId: id }))
                  if (createTableErrors.environmentId) {
                    setCreateTableErrors((er) => ({ ...er, environmentId: undefined }))
                  }
                }}
                disabled={creatingTable || environmentOptions.length === 0}
              >
                <SelectTrigger id="new-table-environment" className="w-full">
                  <SelectValue
                    placeholder={
                      environmentOptions.length === 0
                        ? "Sin ambientes disponibles"
                        : "Elegí un ambiente"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {environmentOptions.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {environmentOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Creá un ambiente con el botón «Crear ambiente» junto al selector del plano.
                </p>
              ) : null}
              {createTableErrors.environmentId ? (
                <p className="text-sm text-destructive">{createTableErrors.environmentId}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-table-name">Nombre *</Label>
              <Input
                id="new-table-name"
                value={createTableForm.name}
                maxLength={TABLE_NAME_MAX_LENGTH}
                onChange={(e) => {
                  setCreateTableForm((f) => ({ ...f, name: e.target.value }))
                  if (createTableErrors.name) setCreateTableErrors((er) => ({ ...er, name: undefined }))
                }}
                placeholder="Ej: Mesa 1"
                disabled={creatingTable}
              />
              <p className="text-xs text-muted-foreground">
                Como máximo {TABLE_NAME_MAX_LENGTH} caracteres (largo de «mesa de prueba»).
              </p>
              {createTableErrors.name && (
                <p className="text-sm text-destructive">{createTableErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-table-capacity">Capacidad *</Label>
              <Input
                id="new-table-capacity"
                type="number"
                min={1}
                max={99}
                value={createTableForm.capacity}
                onChange={(e) => {
                  setCreateTableForm((f) => ({ ...f, capacity: e.target.value }))
                  if (createTableErrors.capacity) setCreateTableErrors((er) => ({ ...er, capacity: undefined }))
                }}
                disabled={creatingTable}
              />
              {createTableErrors.capacity && (
                <p className="text-sm text-destructive">{createTableErrors.capacity}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-table-shape">Forma *</Label>
              <Select
                value={createTableForm.shape}
                onValueChange={(value: "circle" | "rect") =>
                  setCreateTableForm((f) => ({ ...f, shape: value }))
                }
                disabled={creatingTable}
              >
                <SelectTrigger id="new-table-shape">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle">
                    <span className="flex items-center gap-2">
                      <Circle className="h-4 w-4" />
                      Circular
                    </span>
                  </SelectItem>
                  <SelectItem value="rect">
                    <span className="flex items-center gap-2">
                      <Square className="h-4 w-4" />
                      Rectangular
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-table-status">Estado *</Label>
              <Select
                value={createTableForm.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  setCreateTableForm((f) => ({ ...f, isActive: value === "active" }))
                }
                disabled={creatingTable}
              >
                <SelectTrigger id="new-table-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      Activa
                    </span>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <span className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      Inactiva
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateTableOpen(false)}
              disabled={creatingTable}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateTableSubmit()}
              disabled={creatingTable}
            >
              {creatingTable ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {creatingTable ? "Creando…" : "Crear mesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createEnvironmentOpen} onOpenChange={setCreateEnvironmentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo ambiente</DialogTitle>
            <DialogDescription>
              Definí el nombre y los datos del espacio. Podés agregar mesas en el plano cuando
              termine la creación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-env-name">Nombre *</Label>
              <Input
                id="new-env-name"
                value={createEnvironmentForm.name}
                maxLength={ENV_NAME_MAX_LENGTH}
                onChange={(e) => {
                  setCreateEnvironmentForm((f) => ({ ...f, name: e.target.value }))
                  if (createEnvironmentErrors.name) {
                    setCreateEnvironmentErrors((er) => ({ ...er, name: undefined }))
                  }
                }}
                placeholder="Ej: Salón principal"
                disabled={creatingEnvironment}
              />
              <p className="text-xs text-muted-foreground">
                Obligatorio, entre 1 y {ENV_NAME_MAX_LENGTH} caracteres.
              </p>
              {createEnvironmentErrors.name ? (
                <p className="text-sm text-destructive">{createEnvironmentErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-env-description">Descripción</Label>
              <Textarea
                id="new-env-description"
                value={createEnvironmentForm.description}
                maxLength={ENV_DESCRIPTION_MAX_LENGTH}
                rows={3}
                onChange={(e) => {
                  setCreateEnvironmentForm((f) => ({ ...f, description: e.target.value }))
                  if (createEnvironmentErrors.description) {
                    setCreateEnvironmentErrors((er) => ({ ...er, description: undefined }))
                  }
                }}
                placeholder="Opcional"
                disabled={creatingEnvironment}
                className="min-h-[80px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Opcional, hasta {ENV_DESCRIPTION_MAX_LENGTH} caracteres.
              </p>
              {createEnvironmentErrors.description ? (
                <p className="text-sm text-destructive">{createEnvironmentErrors.description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-env-outdoor"
                checked={createEnvironmentForm.isOutdoor}
                onCheckedChange={(v) =>
                  setCreateEnvironmentForm((f) => ({ ...f, isOutdoor: v === true }))
                }
                disabled={creatingEnvironment}
              />
              <Label htmlFor="new-env-outdoor" className="text-sm font-normal leading-none">
                Ambiente al aire libre
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-env-active"
                checked={createEnvironmentForm.isActive}
                onCheckedChange={(v) =>
                  setCreateEnvironmentForm((f) => ({ ...f, isActive: v === true }))
                }
                disabled={creatingEnvironment}
              />
              <Label htmlFor="new-env-active" className="text-sm font-normal leading-none">
                Ambiente activo
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateEnvironmentOpen(false)}
              disabled={creatingEnvironment}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateEnvironmentSubmit()}
              disabled={creatingEnvironment}
            >
              {creatingEnvironment ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {creatingEnvironment ? "Creando…" : "Crear ambiente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mesas</h1>
          <p className="text-muted-foreground">
            Cada ambiente tiene un plano independiente: elegí uno en el selector. Las
            reservas del día se sincronizan con el listado de reservas y se muestran sobre
            la mesa con el horario. Mové las mesas y pulsá{" "}
            <span className="font-medium text-foreground">Guardar layout</span> para
            persistir solo este ambiente. Los datos de cada mesa se confirman con{" "}
            <span className="font-medium text-foreground">Guardar cambios</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => addNewTable()}
            disabled={
              savingLayout || savingProperties || deletingTable || !hasEnvironments
            }
            title={
              !hasEnvironments
                ? "Creá al menos un ambiente antes de agregar mesas"
                : undefined
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar mesa
          </Button>
          <Button
            title="Envía posición, forma y rotación de las mesas de este ambiente"
            onClick={() => void saveLayout()}
            disabled={
              savingLayout ||
              savingProperties ||
              deletingTable ||
              tablesInActiveEnvironment.length === 0
            }
          >
            {savingLayout ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {savingLayout ? "Guardando…" : "Guardar layout"}
          </Button>
        </div>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <p className="font-semibold">Error</p>
          <p className="text-pretty">{loadError}</p>
          <Button variant="outline" size="sm" className="w-fit" onClick={() => void loadTables()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {!loadError && !hasEnvironments ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/25 dark:text-amber-50"
        >
          <p className="font-semibold">No hay ambientes disponibles</p>
          <p className="mt-2 text-pretty">
            El plano de mesas depende de un ambiente: sin ninguno creado no se muestra el selector
            ni podés agregar mesas. Creá el primer ambiente con el botón{" "}
            <span className="font-medium text-foreground">Crear ambiente</span> (debajo de este
            aviso). Cuando el ambiente exista, vas a ver el desplegable para elegirlo, podrás usar{" "}
            <span className="font-medium text-foreground">Agregar mesa</span> y continuar con el
            layout y los datos de cada mesa como siempre.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {hasEnvironments ? (
            <>
              <Label htmlFor="environment-filter" className="text-sm font-medium">
                Ambiente:
              </Label>
              <Select
                value={activeEnvironmentId || ""}
                onValueChange={setSelectedEnvironmentId}
              >
                <SelectTrigger id="environment-filter" className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {environmentOptions.map((env) => (
                    <SelectItem key={env.id} value={env.id}>
                      {env.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openCreateEnvironment}
            disabled={
              savingLayout || savingProperties || deletingTable || creatingEnvironment
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear ambiente
          </Button>
        </div>
        {reservationsLoading ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Actualizando reservas del día…
          </span>
        ) : null}
        {reservationsError ? (
          <div className="flex max-w-md flex-col gap-1 text-xs text-destructive sm:flex-row sm:items-center sm:gap-2">
            <span className="text-pretty">{reservationsError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-fit shrink-0"
              onClick={() => void loadReservationsMap()}
            >
              Reintentar
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                ref={canvasRef}
                className={cn(
                  "relative h-[600px] cursor-crosshair select-none overflow-hidden",
                  "bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)]",
                  "bg-[size:20px_20px]",
                )}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
              >
                {tablesInActiveEnvironment.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-muted-foreground">
                    <Square className="h-12 w-12 opacity-40" />
                    {!hasEnvironments ? (
                      <p className="max-w-md text-center text-sm text-pretty">
                        Sin ambientes no hay plano para editar. Creá uno con{" "}
                        <span className="font-medium text-foreground">Crear ambiente</span> arriba;
                        cuando aparezca el selector vas a poder agregar mesas aquí.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm">No hay mesas en este ambiente</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addNewTable()}
                          disabled={savingLayout || savingProperties || deletingTable}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Agregar primera mesa
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  tablesInActiveEnvironment.map((table) => (
                    <TableElement
                      key={table.id}
                      table={table}
                      reservationSlots={reservationByTableId.get(table.id)}
                      isSelected={selectedTableId === table.id}
                      onMouseDown={(e) => handleMouseDown(e, table.id)}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-muted-foreground">Leyenda:</span>
            {Object.entries(statusColors).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", color)} />
                <span className="text-sm text-muted-foreground">
                  {statusLabels[key as keyof typeof statusLabels]}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div
                className="box-border h-3 w-3 rounded-full border-2 border-amber-400 bg-emerald-500"
                title="Mesa activa con reserva"
              />
              <span className="text-sm text-muted-foreground">Con reserva hoy</span>
            </div>
          </div>
        </div>

        {selectedTable && (
          <Card className="w-[320px] shrink-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Move className="h-4 w-4" />
                Propiedades de la mesa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <p className="text-sm text-muted-foreground">{selectedTable.environmentName}</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarClock className="size-4" />
                  Reservas hoy
                </Label>
                {selectedReservationSlots?.length ? (
                  <ul className="space-y-2 text-sm">
                    {selectedReservationSlots.map((slot) => (
                      <li
                        key={slot.reservationId}
                        className="rounded-md border bg-muted/40 px-3 py-2"
                      >
                        <p className="font-medium tabular-nums">{slot.timeRangeLabel}</p>
                        <p className="text-muted-foreground">{slot.customerLabel}</p>
                        <p className="text-xs text-muted-foreground">Estado: {slot.status}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin reservas activas asignadas a esta mesa para hoy.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-name">Nombre</Label>
                <Input
                  id="table-name"
                  value={selectedTable.name}
                  maxLength={TABLE_NAME_MAX_LENGTH}
                  onChange={(e) => updateSelectedTable({ name: e.target.value })}
                  placeholder="Ej: Mesa 1"
                />
                <p className="text-xs text-muted-foreground">
                  Como máximo {TABLE_NAME_MAX_LENGTH} caracteres (largo de «mesa de prueba»).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-capacity">Capacidad</Label>
                <Input
                  id="table-capacity"
                  type="number"
                  min={1}
                  max={99}
                  value={selectedTable.capacity}
                  onChange={(e) =>
                    updateSelectedTable({ capacity: parseInt(e.target.value, 10) || 1 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-shape">Forma</Label>
                <Select
                  value={selectedTable.shape}
                  onValueChange={(value: "circle" | "rect") =>
                    updateSelectedTable({
                      shape: value,
                      width: value === "rect" ? 100 : undefined,
                      height: value === "rect" ? 60 : undefined,
                    })
                  }
                >
                  <SelectTrigger id="table-shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">
                      <span className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        Circular
                      </span>
                    </SelectItem>
                    <SelectItem value="rect">
                      <span className="flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        Rectangular
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedTable.shape === "rect" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="table-width">Ancho</Label>
                    <Input
                      id="table-width"
                      type="number"
                      min={40}
                      max={400}
                      value={selectedTable.width ?? 100}
                      onChange={(e) =>
                        updateSelectedTable({ width: parseInt(e.target.value, 10) || 100 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table-height">Alto</Label>
                    <Input
                      id="table-height"
                      type="number"
                      min={40}
                      max={300}
                      value={selectedTable.height ?? 60}
                      onChange={(e) =>
                        updateSelectedTable({ height: parseInt(e.target.value, 10) || 60 })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="table-active">Estado</Label>
                <Select
                  value={selectedTable.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    updateSelectedTable({ isActive: value === "active" })
                  }
                >
                  <SelectTrigger id="table-active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        Activa
                      </span>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        Inactiva
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={() => void saveSelectedProperties()}
                disabled={savingLayout || savingProperties || deletingTable}
              >
                {savingProperties ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {savingProperties ? "Guardando…" : "Guardar cambios"}
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => void deleteSelectedTable()}
                disabled={savingLayout || savingProperties || deletingTable}
              >
                {deletingTable ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {deletingTable ? "Eliminando…" : "Eliminar mesa"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function TableElement({
  table,
  reservationSlots,
  isSelected,
  onMouseDown,
}: {
  table: UiTable
  reservationSlots?: TableReservationSlot[]
  isSelected: boolean
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const colorKey = table.isActive ? "active" : "inactive"
  const hasReservation = Boolean(reservationSlots?.length)
  const baseClasses = cn(
    "absolute flex cursor-move flex-col items-center justify-center border-2 transition-shadow",
    statusColors[colorKey],
    isSelected && "z-10 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg",
    !isSelected &&
      hasReservation &&
      "ring-2 ring-amber-400 ring-offset-2 ring-offset-background shadow-md",
    !isSelected && !hasReservation && "hover:shadow-md",
  )

  const size = table.shape === "circle" ? 64 : undefined
  const width = table.shape === "rect" ? (table.width ?? 100) : size
  const height = table.shape === "rect" ? (table.height ?? 60) : size

  const firstSlot = reservationSlots?.[0]

  return (
    <div
      className={cn(baseClasses, table.shape === "circle" ? "rounded-full" : "rounded-lg")}
      style={{
        left: table.x,
        top: table.y,
        width,
        height,
        transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
      }}
      onMouseDown={onMouseDown}
    >
      <span className="text-center text-sm font-bold text-white drop-shadow-sm">
        {table.name}
      </span>
      {firstSlot ? (
        <span
          className="mt-0.5 line-clamp-2 max-w-[95%] text-center text-[10px] font-medium leading-tight text-white drop-shadow"
          title={reservationSlots?.map((s) => s.timeRangeLabel).join(" · ")}
        >
          {firstSlot.timeRangeLabel}
          {reservationSlots && reservationSlots.length > 1
            ? ` (+${reservationSlots.length - 1})`
            : ""}
        </span>
      ) : null}
      <span className="flex items-center gap-0.5 text-xs text-white/90">
        <Users className="h-3 w-3" />
        {table.capacity}
      </span>
    </div>
  )
}
