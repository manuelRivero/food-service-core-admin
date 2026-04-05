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
import { ReservationStatusBadge } from "@/components/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Reservation, ReservationStatus } from "@/lib/data"

interface ReservationsTableProps {
  reservations: Reservation[]
  isLoading?: boolean
}

export function ReservationsTable({ reservations, isLoading }: ReservationsTableProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    reservationId: string
    action: "confirm" | "cancel"
  }>({ open: false, reservationId: "", action: "confirm" })

  const handleAction = (reservationId: string, action: "confirm" | "cancel") => {
    setConfirmDialog({ open: true, reservationId, action })
  }

  const handleConfirmAction = () => {
    const newStatus: ReservationStatus = confirmDialog.action === "confirm" ? "confirmed" : "cancelled"
    // In a real app, this would update the reservation status via API
    console.log(`Changing reservation ${confirmDialog.reservationId} status to ${newStatus}`)
    setConfirmDialog({ open: false, reservationId: "", action: "confirm" })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
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
          <EmptyTitle>No reservations found</EmptyTitle>
          <EmptyDescription>
            There are no reservations matching your search criteria.
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
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((reservation) => (
              <TableRow key={reservation.id}>
                <TableCell className="font-medium">{reservation.customerName}</TableCell>
                <TableCell>{formatDate(reservation.date)}</TableCell>
                <TableCell>{reservation.time}</TableCell>
                <TableCell>{reservation.guests}</TableCell>
                <TableCell>
                  <ReservationStatusBadge status={reservation.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleAction(reservation.id, "confirm")}
                        disabled={reservation.status === "confirmed"}
                      >
                        <Check className="mr-2 size-4" />
                        Confirm reservation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAction(reservation.id, "cancel")}
                        disabled={reservation.status === "cancelled"}
                        className="text-destructive focus:text-destructive"
                      >
                        <X className="mr-2 size-4" />
                        Cancel reservation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
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
                ? "Confirm Reservation"
                : "Cancel Reservation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "confirm"
                ? "Are you sure you want to confirm this reservation? The customer will be notified."
                : "Are you sure you want to cancel this reservation? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={
                confirmDialog.action === "cancel"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmDialog.action === "confirm" ? "Confirm" : "Cancel Reservation"}
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
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Guests</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Actions</span>
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
