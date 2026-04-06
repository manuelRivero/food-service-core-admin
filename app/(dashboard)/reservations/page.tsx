"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { isAxiosError } from "axios"

import { useAdminSocket } from "@/contexts/admin-socket-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ReservationsTable } from "@/components/reservations-table"
import type { Reservation } from "@/lib/data"
import {
  ADMIN_RESERVATIONS_STATUS_ALL,
  fetchAdminReservationById,
  fetchAdminReservations,
  mapAdminReservationToReservation,
} from "@/lib/requests/reservations"

function monthBoundsISO() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: ADMIN_RESERVATIONS_STATUS_ALL, label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "cancelled", label: "Cancelado" },
]

/** Alineado al filtro de lista: `closed` cuenta como cancelada/cerrada. */
function reservationMatchesFilter(
  reservationStatus: string,
  filter: string,
): boolean {
  if (filter === ADMIN_RESERVATIONS_STATUS_ALL) return true
  const s = reservationStatus.toLowerCase()
  const f = filter.toLowerCase()
  if (f === "cancelled") {
    return s === "cancelled" || s === "closed"
  }
  return s === f
}

const HIGHLIGHT_MS = 12_000
const EDITING_HIGHLIGHT_MS = 90_000
const CANCELLED_FLASH_MS = 10_000

export default function ReservationsPage() {
  const { subscribeToReservationRealtime } = useAdminSocket()
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )
  const editingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  )
  const cancelledFlashTimersRef = useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map())

  const [highlightReservationIds, setHighlightReservationIds] = useState<
    string[]
  >([])
  const [editingReservationIds, setEditingReservationIds] = useState<string[]>(
    [],
  )
  const [cancelledFlashIds, setCancelledFlashIds] = useState<string[]>([])

  const bounds = monthBoundsISO()
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState(bounds.from)
  const [dateTo, setDateTo] = useState(bounds.to)
  const [phoneFilter, setPhoneFilter] = useState("")
  const [debouncedPhone, setDebouncedPhone] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>(
    ADMIN_RESERVATIONS_STATUS_ALL,
  )

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
    pageSize: 20,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPhone(phoneFilter), 400)
    return () => clearTimeout(t)
  }, [phoneFilter])

  useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo, debouncedPhone, statusFilter])

  const loadReservations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAdminReservations({
        page,
        dateFrom,
        dateTo,
        customerPhone: debouncedPhone.trim() || undefined,
        status: statusFilter,
      })
      setReservations(data.items.map(mapAdminReservationToReservation))
      setMeta({
        total: data.total,
        totalPages: data.totalPages > 0 ? data.totalPages : 1,
        pageSize: data.pageSize,
      })
    } catch (e) {
      setReservations([])
      if (isAxiosError(e)) {
        const msg =
          (e.response?.data as { message?: string })?.message ??
          e.message
        setError(
          typeof msg === "string" && msg
            ? msg
            : "No se pudieron cargar las reservas. Revisá la API y la sesión.",
        )
      } else {
        setError("Error inesperado al cargar las reservas.")
      }
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, debouncedPhone, statusFilter])

  useEffect(() => {
    void loadReservations()
  }, [loadReservations])

  useEffect(() => {
    return subscribeToReservationRealtime((payload) => {
      switch (payload.type) {
        case "reservation.created": {
          const reservationId = payload.reservationId
          void (async () => {
            try {
              const res = await fetchAdminReservationById(reservationId)
              if (!reservationMatchesFilter(res.status, statusFilter)) {
                return
              }
              setReservations((prev) => {
                const existed = prev.some((r) => r.id === res.id)
                if (!existed) {
                  setMeta((m) => ({ ...m, total: m.total + 1 }))
                }
                return [res, ...prev.filter((r) => r.id !== res.id)]
              })
              setEditingReservationIds((ids) =>
                ids.filter((id) => id !== reservationId),
              )
              setHighlightReservationIds((ids) =>
                ids.includes(reservationId) ? ids : [...ids, reservationId],
              )
              const prevT = highlightTimersRef.current.get(reservationId)
              if (prevT) clearTimeout(prevT)
              const t = setTimeout(() => {
                setHighlightReservationIds((ids) =>
                  ids.filter((x) => x !== reservationId),
                )
                highlightTimersRef.current.delete(reservationId)
              }, HIGHLIGHT_MS)
              highlightTimersRef.current.set(reservationId, t)
            } catch {
              /* noop */
            }
          })()
          break
        }
        case "reservation.cancelled": {
          const reservationId = payload.reservationId
          void (async () => {
            try {
              const res = await fetchAdminReservationById(reservationId)
              const matches = reservationMatchesFilter(res.status, statusFilter)
              setReservations((prev) => {
                const existed = prev.some((r) => r.id === res.id)
                if (!matches) {
                  if (existed) {
                    setMeta((m) => ({
                      ...m,
                      total: Math.max(0, m.total - 1),
                    }))
                  }
                  return prev.filter((r) => r.id !== res.id)
                }
                if (!existed) {
                  setMeta((m) => ({ ...m, total: m.total + 1 }))
                }
                return [res, ...prev.filter((r) => r.id !== res.id)]
              })
              setEditingReservationIds((ids) =>
                ids.filter((id) => id !== reservationId),
              )
              const et = editingTimersRef.current.get(reservationId)
              if (et) {
                clearTimeout(et)
                editingTimersRef.current.delete(reservationId)
              }
              setCancelledFlashIds((ids) =>
                ids.includes(reservationId) ? ids : [...ids, reservationId],
              )
              const prevCf = cancelledFlashTimersRef.current.get(reservationId)
              if (prevCf) clearTimeout(prevCf)
              const t = setTimeout(() => {
                setCancelledFlashIds((ids) =>
                  ids.filter((x) => x !== reservationId),
                )
                cancelledFlashTimersRef.current.delete(reservationId)
              }, CANCELLED_FLASH_MS)
              cancelledFlashTimersRef.current.set(reservationId, t)
            } catch {
              /* noop */
            }
          })()
          break
        }
        case "reservation.edit_started": {
          const reservationId = payload.reservationId
          setEditingReservationIds((ids) =>
            ids.includes(reservationId) ? ids : [...ids, reservationId],
          )
          const prevEt = editingTimersRef.current.get(reservationId)
          if (prevEt) clearTimeout(prevEt)
          const t = setTimeout(() => {
            setEditingReservationIds((ids) =>
              ids.filter((x) => x !== reservationId),
            )
            editingTimersRef.current.delete(reservationId)
          }, EDITING_HIGHLIGHT_MS)
          editingTimersRef.current.set(reservationId, t)
          break
        }
        default:
          break
      }
    })
  }, [subscribeToReservationRealtime, statusFilter])

  useEffect(() => {
    return () => {
      highlightTimersRef.current.forEach((t) => clearTimeout(t))
      editingTimersRef.current.forEach((t) => clearTimeout(t))
      cancelledFlashTimersRef.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  const canPrev = page > 1
  const canNext = page < meta.totalPages

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reservas</h1>
        <p className="text-muted-foreground">
          Consulta y gestiona las reservas de mesas
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="grid gap-2">
          <Label htmlFor="res-from">Desde</Label>
          <Input
            id="res-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[11rem]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="res-to">Hasta</Label>
          <Input
            id="res-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[11rem]"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="res-status">Estado</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="res-status" className="w-[12rem]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-[12rem] flex-1 gap-2">
          <Label htmlFor="res-phone">Teléfono cliente</Label>
          <Input
            id="res-phone"
            type="search"
            inputMode="tel"
            autoComplete="off"
            placeholder="Ej. 5512345678"
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
          />
        </div>
      </div>

      <p className="text-right text-sm text-muted-foreground">
        {meta.total} reserva{meta.total === 1 ? "" : "s"} · Página {page} de{" "}
        {meta.totalPages}
        {meta.pageSize ? ` (${meta.pageSize} por página)` : ""}
      </p>

      <ReservationsTable
        reservations={reservations}
        isLoading={loading}
        highlightReservationIds={highlightReservationIds}
        editingReservationIds={editingReservationIds}
        cancelledFlashIds={cancelledFlashIds}
      />

      {!loading && meta.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {meta.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() =>
              setPage((p) => Math.min(meta.totalPages, p + 1))
            }
          >
            Siguiente
          </Button>
        </div>
      ) : null}
    </div>
  )
}
