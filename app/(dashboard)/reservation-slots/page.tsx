"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import {
  ArrowRightLeft,
  CalendarClock,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  createAdminReservationSlot,
  deleteAdminReservationSlot,
  fetchAdminReservationSlotById,
  fetchAdminReservationSlots,
  patchAdminReservationSlot,
  type AdminReservationSlot,
} from "@/lib/requests/reservation-slots"

const DAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
] as const

function errorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback
  if (err.response?.status === 409) {
    return "Este slot se solapa con otro del mismo día"
  }
  const data = err.response?.data as { message?: string; error?: string } | undefined
  return data?.message ?? data?.error ?? err.message ?? fallback
}

function normalizeTime(input: string, fallback: string): string {
  if (!input) return fallback
  const trimmed = input.trim()
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed
  return fallback
}

function timeToMinutes(v: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(v)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
  return hh * 60 + mm
}

function isValidSlotRange(startTime: string, endTime: string): boolean {
  const from = timeToMinutes(startTime)
  const to = timeToMinutes(endTime)
  if (from == null || to == null) return false
  return from < to
}

function parseCapacityInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 1) return null
  return Math.floor(n)
}

function formatCapacity(limit: number | null): string {
  if (limit == null) return "sin límite"
  return `cap. ${limit}`
}

export default function ReservationSlotsPage() {
  const [slots, setSlots] = useState<AdminReservationSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copyFromDay, setCopyFromDay] = useState("1")
  const [copyTargets, setCopyTargets] = useState<number[]>([])

  const loadSlots = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminReservationSlots()
      setSlots(data)
    } catch (err) {
      toast.error(errorMessage(err, "No se pudieron cargar los slots de reserva"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  const grouped = useMemo(() => {
    return DAYS.map((day) => {
      const rows = slots
        .filter((s) => s.dayOfWeek === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
      const activeCount = rows.filter((row) => row.isActive).length
      return {
        ...day,
        rows,
        activeCount,
      }
    })
  }, [slots])

  const weekSummary = useMemo(
    () =>
      grouped.map((day) => {
        if (day.rows.length === 0) return `${day.short}: sin slots`
        const active = day.rows.filter((row) => row.isActive)
        if (active.length === 0) return `${day.short}: inactivo`
        const first = active[0]
        const last = active[active.length - 1]
        const extra = active.length > 1 ? ` (+${active.length - 1})` : ""
        return `${day.short}: ${first.startTime} - ${last.endTime}${extra}`
      }),
    [grouped],
  )

  const handleAddSlot = async (dayOfWeek: number) => {
    setSaving(true)
    try {
      const created = await createAdminReservationSlot({
        dayOfWeek,
        startTime: "12:00",
        endTime: "13:00",
        capacityLimit: null,
        isActive: true,
      })
      setSlots((prev) => [...prev, created])
      toast.success("Slot agregado")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo agregar el slot"))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSlot = async (
    row: AdminReservationSlot,
    changes: Partial<
      Pick<AdminReservationSlot, "startTime" | "endTime" | "capacityLimit" | "isActive">
    >,
  ) => {
    const nextStart = changes.startTime ?? row.startTime
    const nextEnd = changes.endTime ?? row.endTime
    if (!isValidSlotRange(nextStart, nextEnd)) {
      toast.error("Rango inválido: la hora de inicio debe ser anterior a la de fin")
      return
    }

    setBusyId(row.id)
    try {
      await patchAdminReservationSlot(row.id, {
        startTime: changes.startTime,
        endTime: changes.endTime,
        capacityLimit: changes.capacityLimit,
        isActive: changes.isActive,
      })
      const updated = await fetchAdminReservationSlotById(row.id)
      setSlots((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      toast.success("Slot actualizado")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo actualizar el slot"))
    } finally {
      setBusyId(null)
    }
  }

  const handleDeleteSlot = async (id: string) => {
    setBusyId(id)
    try {
      await deleteAdminReservationSlot(id)
      setSlots((prev) => prev.filter((s) => s.id !== id))
      toast.success("Slot eliminado")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar el slot"))
    } finally {
      setBusyId(null)
    }
  }

  const toggleCopyTarget = (day: number, checked: boolean) => {
    setCopyTargets((prev) =>
      checked ? Array.from(new Set([...prev, day])) : prev.filter((d) => d !== day),
    )
  }

  const handleCopySlots = async () => {
    const sourceDay = Number(copyFromDay)
    const sourceRows = slots.filter((s) => s.dayOfWeek === sourceDay)
    const targets = copyTargets.filter((d) => d !== sourceDay)

    if (sourceRows.length === 0) {
      toast.info("El día de origen no tiene slots para copiar")
      return
    }
    if (targets.length === 0) {
      toast.info("Seleccioná al menos un día de destino")
      return
    }

    setSaving(true)
    try {
      for (const day of targets) {
        const current = slots.filter((s) => s.dayOfWeek === day)
        for (const row of current) {
          await deleteAdminReservationSlot(row.id)
        }
        for (const source of sourceRows) {
          await createAdminReservationSlot({
            dayOfWeek: day,
            startTime: source.startTime,
            endTime: source.endTime,
            capacityLimit: source.capacityLimit,
            isActive: source.isActive,
          })
        }
      }
      await loadSlots()
      toast.success("Slots copiados correctamente")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudieron copiar los slots"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Slots de reserva</h1>
          <p className="text-muted-foreground">
            Definí franjas horarias disponibles para reservas, con capacidad opcional por slot.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadSlots()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Recargar
        </Button>
      </div>

      <Card className="border-border/70 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumen semanal compacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
          {weekSummary.map((row) => (
            <div key={row} className="rounded-md border bg-background/80 px-3 py-2">
              {row}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowRightLeft className="size-4 text-primary" />
            Copiar slots a otros días
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full max-w-[260px] space-y-2">
              <Label>Día de origen</Label>
              <Select value={copyFromDay} onValueChange={setCopyFromDay} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => void handleCopySlots()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Copiar slots
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DAYS.map((day) => (
              <label
                key={day.value}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  Number(copyFromDay) === day.value && "opacity-50",
                )}
              >
                <Checkbox
                  checked={copyTargets.includes(day.value)}
                  onCheckedChange={(checked) => toggleCopyTarget(day.value, checked === true)}
                  disabled={saving || Number(copyFromDay) === day.value}
                />
                {day.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map((day) => (
          <Card
            key={day.value}
            className="overflow-hidden border-border/70 bg-gradient-to-b from-background to-muted/30"
          >
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="size-4 text-primary" />
                  {day.label}
                </CardTitle>
                <Badge variant={day.activeCount > 0 ? "default" : "secondary"}>
                  {day.rows.length === 0
                    ? "Sin slots"
                    : `${day.activeCount}/${day.rows.length} activos`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.rows.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Sin slots cargados para {day.short}.
                </div>
              ) : (
                day.rows.map((row) => (
                  <SlotRow
                    key={row.id}
                    row={row}
                    busy={busyId === row.id || saving}
                    onSave={(next) => void handleUpdateSlot(row, next)}
                    onDelete={() => void handleDeleteSlot(row.id)}
                  />
                ))
              )}

              <Button
                className="w-full"
                variant="outline"
                onClick={() => void handleAddSlot(day.value)}
                disabled={saving}
              >
                <Plus className="mr-2 size-4" />
                Agregar slot
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function SlotRow({
  row,
  busy,
  onSave,
  onDelete,
}: {
  row: AdminReservationSlot
  busy: boolean
  onSave: (next: {
    startTime: string
    endTime: string
    capacityLimit: number | null
    isActive: boolean
  }) => void
  onDelete: () => void
}) {
  const [startTime, setStartTime] = useState(row.startTime)
  const [endTime, setEndTime] = useState(row.endTime)
  const [capacityInput, setCapacityInput] = useState(
    row.capacityLimit == null ? "" : String(row.capacityLimit),
  )
  const [isActive, setIsActive] = useState(row.isActive)

  useEffect(() => {
    setStartTime(row.startTime)
    setEndTime(row.endTime)
    setCapacityInput(row.capacityLimit == null ? "" : String(row.capacityLimit))
    setIsActive(row.isActive)
  }, [row.startTime, row.endTime, row.capacityLimit, row.isActive, row.id])

  const nextCapacity = parseCapacityInput(capacityInput)
  const capacityInvalid =
    capacityInput.trim() !== "" && nextCapacity == null

  const dirty =
    startTime !== row.startTime ||
    endTime !== row.endTime ||
    (nextCapacity ?? null) !== row.capacityLimit ||
    isActive !== row.isActive

  const invalidRange = !isValidSlotRange(startTime, endTime)

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm",
        !isActive && "opacity-75",
      )}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Inicio</Label>
          <Input
            type="time"
            value={startTime}
            disabled={busy}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Fin</Label>
          <Input
            type="time"
            value={endTime}
            disabled={busy}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-2 space-y-1">
        <Label className="text-xs text-muted-foreground">
          Capacidad máxima (opcional)
        </Label>
        <Input
          type="number"
          min={1}
          step={1}
          placeholder="Sin límite"
          value={capacityInput}
          disabled={busy}
          onChange={(e) => setCapacityInput(e.target.value)}
        />
      </div>
      {invalidRange ? (
        <p className="mt-2 text-xs text-destructive">
          Rango inválido: inicio debe ser anterior a fin.
        </p>
      ) : null}
      {capacityInvalid ? (
        <p className="mt-2 text-xs text-destructive">
          Capacidad inválida: ingresá un entero mayor o igual a 1, o dejá vacío.
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <Label htmlFor={`active-${row.id}`} className="text-sm">
          Activo
        </Label>
        <Switch
          id={`active-${row.id}`}
          checked={isActive}
          disabled={busy}
          onCheckedChange={setIsActive}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1"
          disabled={busy || !dirty || invalidRange || capacityInvalid}
          onClick={() =>
            onSave({
              startTime: normalizeTime(startTime, row.startTime),
              endTime: normalizeTime(endTime, row.endTime),
              capacityLimit: nextCapacity,
              isActive,
            })
          }
        >
          {busy ? (
            <Loader2 className="mr-2 size-3.5 animate-spin" />
          ) : (
            <Save className="mr-2 size-3.5" />
          )}
          Guardar
        </Button>
        <Button size="sm" variant="destructive" disabled={busy} onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {formatCapacity(row.capacityLimit)}
        </span>
      </div>
    </div>
  )
}
