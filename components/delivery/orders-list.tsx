"use client"

import { PackageIcon, AlertCircleIcon } from "lucide-react"
import { OrderCard, type DeliveryOrder } from "./order-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface OrdersListProps {
  orders: DeliveryOrder[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onMarkDelivered: (order: DeliveryOrder) => void
}

function OrderCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <PackageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">No hay entregas pendientes</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">
        No tienes pedidos asignados para entregar en este momento.
      </p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircleIcon className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold">Error al cargar pedidos</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">{error}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-4">
          Reintentar
        </Button>
      )}
    </div>
  )
}

export function OrdersList({
  orders,
  isLoading = false,
  error = null,
  onRetry,
  onMarkDelivered,
}: OrdersListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <OrderCardSkeleton />
        <OrderCardSkeleton />
        <OrderCardSkeleton />
      </div>
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (orders.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onMarkDelivered={onMarkDelivered}
        />
      ))}
    </div>
  )
}
