"use client"

import { useState, useMemo, useEffect } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { OrdersTable } from "@/components/orders-table"
import { orders as allOrders } from "@/lib/data"

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return allOrders

    const searchLower = search.toLowerCase()
    return allOrders.filter(
      (order) =>
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.status.toLowerCase().includes(searchLower)
    )
  }, [search])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and track customer orders</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <OrdersTable orders={filteredOrders} isLoading={isLoading} />
    </div>
  )
}
