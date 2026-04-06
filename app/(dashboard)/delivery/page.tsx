"use client"

import { useState, useEffect, useCallback } from "react"
import { TruckIcon } from "lucide-react"
import { OrdersList } from "@/components/delivery/orders-list"
import { PermissionModal } from "@/components/delivery/permission-modal"
import { DeliveryQrScanner } from "@/components/delivery/delivery-qr-scanner"
import { ResultModal } from "@/components/delivery/result-modal"
import type { DeliveryOrder } from "@/components/delivery/order-card"

// Mock data for delivery orders
const mockOrders: DeliveryOrder[] = [
  {
    id: "ORD-001",
    customerName: "Maria Garcia",
    address: "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX",
    totalPrice: 245.50,
    status: "out_for_delivery",
    items: 3,
  },
  {
    id: "ORD-002",
    customerName: "Carlos Rodriguez",
    address: "Calle Reforma 567, Col. Juarez, CDMX",
    totalPrice: 189.00,
    status: "out_for_delivery",
    items: 2,
  },
  {
    id: "ORD-003",
    customerName: "Ana Martinez",
    address: "Blvd. Miguel de Cervantes 890, Col. Granada, CDMX",
    totalPrice: 312.75,
    status: "pending",
    items: 4,
  },
  {
    id: "ORD-004",
    customerName: "Jose Lopez",
    address: "Av. Revolucion 234, Col. San Angel, CDMX",
    totalPrice: 156.25,
    status: "out_for_delivery",
    items: 1,
  },
]

// Simulated valid QR codes (in real app, this would be validated server-side)
const validQrCodes: Record<string, string> = {
  "qr-ord-001": "ORD-001",
  "qr-ord-002": "ORD-002",
  "qr-ord-003": "ORD-003",
  "qr-ord-004": "ORD-004",
}

type DeliveryFlow =
  | { step: "idle" }
  | { step: "permission"; order: DeliveryOrder }
  | { step: "scanning"; order: DeliveryOrder }
  | { step: "result"; order: DeliveryOrder; success: boolean; scannedOrder?: DeliveryOrder }

export default function DeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flow, setFlow] = useState<DeliveryFlow>({ step: "idle" })
  const [isRequesting, setIsRequesting] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Load orders
  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setOrders(mockOrders.filter((o) => o.status !== "delivered"))
    } catch {
      setError("No se pudieron cargar los pedidos. Por favor, intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // Handle mark as delivered click
  const handleMarkDelivered = (order: DeliveryOrder) => {
    setPermissionError(null)
    setFlow({ step: "permission", order })
  }

  // Request camera permission
  const handleRequestPermission = async () => {
    if (flow.step !== "permission") return

    setIsRequesting(true)
    setPermissionError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      // Stop the stream immediately, we just needed to check permission
      stream.getTracks().forEach((track) => track.stop())
      // Move to scanning
      setFlow({ step: "scanning", order: flow.order })
    } catch (err) {
      const error = err as Error
      if (error.name === "NotAllowedError") {
        setPermissionError("Permiso de camara denegado. Habilita el acceso en la configuracion de tu navegador.")
      } else {
        setPermissionError(error.message || "Error al acceder a la camara.")
      }
    } finally {
      setIsRequesting(false)
    }
  }

  // Handle QR scan
  const handleScan = async (data: string) => {
    if (flow.step !== "scanning") return

    setIsProcessing(true)

    // Simulate API validation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const matchedOrderId = validQrCodes[data.toLowerCase()]
    const matchedOrder = orders.find((o) => o.id === matchedOrderId)

    setIsProcessing(false)

    if (matchedOrder && matchedOrder.id === flow.order.id) {
      setFlow({ step: "result", order: flow.order, success: true, scannedOrder: matchedOrder })
    } else {
      setFlow({ step: "result", order: flow.order, success: false })
    }
  }

  // Handle scan cancel
  const handleScanCancel = () => {
    setFlow({ step: "idle" })
  }

  // Handle confirm delivery
  const handleConfirmDelivery = async () => {
    if (flow.step !== "result" || !flow.success) return

    setIsConfirming(true)

    // Simulate API call to confirm delivery
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Update local state
    setOrders((prev) =>
      prev.filter((o) => o.id !== flow.order.id)
    )

    setIsConfirming(false)
    setFlow({ step: "idle" })
  }

  // Handle try again
  const handleTryAgain = () => {
    if (flow.step !== "result") return
    setFlow({ step: "scanning", order: flow.order })
  }

  // Close modals
  const handleClosePermission = (open: boolean) => {
    if (!open) {
      setFlow({ step: "idle" })
      setPermissionError(null)
    }
  }

  const handleCloseResult = (open: boolean) => {
    if (!open) {
      setFlow({ step: "idle" })
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <TruckIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Mis entregas</h1>
            <p className="text-xs text-muted-foreground">
              {orders.filter((o) => o.status !== "delivered").length} pedidos pendientes
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        <OrdersList
          orders={orders}
          isLoading={isLoading}
          error={error}
          onRetry={loadOrders}
          onMarkDelivered={handleMarkDelivered}
        />
      </main>

      {/* Permission Modal */}
      <PermissionModal
        open={flow.step === "permission"}
        onOpenChange={handleClosePermission}
        onRequestPermission={handleRequestPermission}
        isRequesting={isRequesting}
        error={permissionError}
        onRetry={handleRequestPermission}
      />

      {/* QR Scanner (Full screen) */}
      {flow.step === "scanning" && (
        <DeliveryQrScanner
          onScan={handleScan}
          onCancel={handleScanCancel}
          isProcessing={isProcessing}
        />
      )}

      {/* Result Modal */}
      <ResultModal
        open={flow.step === "result"}
        onOpenChange={handleCloseResult}
        success={flow.step === "result" ? flow.success : false}
        order={flow.step === "result" ? flow.scannedOrder || flow.order : null}
        onConfirm={handleConfirmDelivery}
        onTryAgain={handleTryAgain}
        isConfirming={isConfirming}
      />
    </div>
  )
}
