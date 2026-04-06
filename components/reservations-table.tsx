"use client"

import { useState } from "react"
import { MoreHorizontal, Check, X, CalendarDays } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { ReservationStatusBadge } from "@/components/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Reservation } from "@/lib/data"

interface ReservationsTableProps {
  reservations: Reservation[]
  isLoading?: boolean
  /** Nueva reserva (socket `reservation.created`). */
  highlightReservationIds?: string[]
  /** Cliente en flujo editar (socket `reservation.edit_started`). */
  editingReservationIds?: string[]
  /** Fila actualizada por cancelación (socket `reservation.cancelled`). */
  cancelledFlashIds?: string[]
}

export function ReservationsTable({
  reservations,
  isLoading,
  highlightReservationIds = [],
  editingReservationIds = [],
  cancelledFlashIds = [],
}: ReservationsTableProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    reservationId: string
    action: "confirm" | "cancel"
  }>({ open: false, reservationId: "", action: "confirm" })

  const handleAction = (reservationId: string, action: "confirm" | "cancel") => {
    setConfirmDialog({ open: true, reservationId, action })
  }

  const handleConfirmAction = () => {
    const newStatus = confirmDialog.action === "confirm" ? "confirmed" : "cancelled"
    console.log(`Changing reservation ${confirmDialog.reservationId} status to ${newStatus}`)
    setConfirmDialog({ open: false, reservationId: "", action: "confirm" })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  if (isLoading) {
    return <ReservationsTableSkeleton />
  }

  if (reservations.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays />
          </EmptyMedia>
          <EmptyTitle>No hay reservas</EmptyTitle>
          <EmptyDescription>
            No hay reservas que coincidan con los filtros seleccionados.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Personas</TableHead>
              <TableHead>Mesas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => {
              const isNew = highlightReservationIds.includes(reservation.id)
              const isEditing = editingReservationIds.includes(reservation.id)
              const isCancelledFlash = cancelledFlashIds.includes(reservation.id)
              return (
              <TableRow
                key={reservation.id}
                className={cn(
                  "transition-colors",
                  isCancelledFlash &&
                    "bg-rose-500/[0.06] dark:bg-rose-500/10",
                  !isCancelledFlash &&
                    isEditing &&
                    "bg-amber-500/[0.07] dark:bg-amber-500/10",
                  !isCancelledFlash &&
                    !isEditing &&
                    isNew &&
                    "bg-emerald-500/[0.07] dark:bg-emerald-500/10",
                )}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{reservation.customerName}</span>
                    {isNew ? (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        Nuevo
                      </Badge>
                    ) : null}
                    {isEditing && !isNew && !isCancelledFlash ? (
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 text-[10px] font-normal text-amber-900 dark:text-amber-200"
                      >
                        Editando
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{formatDate(reservation.date)}</TableCell>
                <TableCell>{reservation.time}</TableCell>
                <TableCell>{reservation.guests}</TableCell>
                <TableCell className="max-w-[14rem] text-muted-foreground text-sm">
                  {reservation.tablesLabel ?? "—"}
                </TableCell>
                <TableCell>
                  <ReservationStatusBadge status={reservation.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleAction(reservation.id, "confirm")}
                        disabled={reservation.status === "confirmed"}
                      >
                        <Check className="mr-2 size-4" />
                        Confirmar reserva
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAction(reservation.id, "cancel")}
                        disabled={reservation.status === "cancelled"}
                        className="text-destructive focus:text-destructive"
                      >
                        <X className="mr-2 size-4" />
                        Cancelar reserva
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "confirm"
                ? "Confirmar reserva"
                : "Cancelar reserva"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "confirm"
                ? "¿Confirmar esta reserva? El cliente puede recibir una notificación."
                : "¿Cancelar esta reserva? Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmDialog.action === "cancel"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmDialog.action === "confirm" ? "Confirmar" : "Cancelar reserva"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function ReservationsTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Personas</TableHead>
            <TableHead>Mesas</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="size-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
