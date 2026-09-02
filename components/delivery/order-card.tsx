"use client"

import { MapPinIcon, UserIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export interface DeliveryOrderItem {
  id: string
  name: string
  quantity: number
}

export interface DeliveryOrder {
  id: string
  shortId: string
  customerName: string
  customerPhone: string
  address: string
  totalPrice: number
  currencyCode: string
  status: "pending" | "out_for_delivery" | "delivered"
  items: DeliveryOrderItem[]
}

interface OrderCardProps {
  order: DeliveryOrder
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

export function OrderCard({ order }: OrderCardProps) {
  const status = statusConfig[order.status]
  const items = Array.isArray(order.items) ? order.items : []

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-muted-foreground">
                #{order.shortId}
              </span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            {/* Customer info */}
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{order.customerName}</span>
                  <span className="text-sm text-muted-foreground">{order.customerPhone}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground leading-tight">
                  {order.address}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="pt-1">
              <span className="text-lg font-bold">
                {new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: order.currencyCode || "ARS",
                }).format(order.totalPrice)}
              </span>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="items">
                <AccordionTrigger className="py-2">Detalle de items</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{item.name}</span>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
