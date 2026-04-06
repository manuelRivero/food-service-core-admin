"use client"

import { MapPinIcon, UserIcon, PackageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface DeliveryOrder {
  id: string
  customerName: string
  address: string
  totalPrice: number
  status: "pending" | "out_for_delivery" | "delivered"
  items: number
}

interface OrderCardProps {
  order: DeliveryOrder
  onMarkDelivered: (order: DeliveryOrder) => void
}

const statusConfig = {
  pending: {
    label: "Pendiente",
    variant: "secondary" as const,
  },
  out_for_delivery: {
    label: "En camino",
    variant: "default" as const,
  },
  delivered: {
    label: "Entregado",
    variant: "outline" as const,
  },
}

export function OrderCard({ order, onMarkDelivered }: OrderCardProps) {
  const status = statusConfig[order.status]

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-muted-foreground">
                #{order.id}
              </span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            {/* Customer info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground leading-tight">
                  {order.address}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PackageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  {order.items} {order.items === 1 ? "articulo" : "articulos"}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="pt-1">
              <span className="text-lg font-bold">
                ${order.totalPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        {order.status !== "delivered" && (
          <Button
            onClick={() => onMarkDelivered(order)}
            className="mt-4 w-full h-12 text-base font-medium"
          >
            Marcar como entregado
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
