"use client"

import { useState, useMemo, useEffect } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { ReservationsTable } from "@/components/reservations-table"
import { reservations as allReservations } from "@/lib/data"

export default function ReservationsPage() {
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const filteredReservations = useMemo(() => {
    if (!search.trim()) return allReservations

    const searchLower = search.toLowerCase()
    return allReservations.filter(
      (reservation) =>
        reservation.customerName.toLowerCase().includes(searchLower) ||
        reservation.status.toLowerCase().includes(searchLower)
    )
  }, [search])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
        <p className="text-muted-foreground">Manage table reservations</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reservations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ReservationsTable reservations={filteredReservations} isLoading={isLoading} />
    </div>
  )
}
