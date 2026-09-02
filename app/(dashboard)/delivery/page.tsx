"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { isAxiosError } from "axios"
import { ScanLineIcon, TruckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersList } from "@/components/delivery/orders-list"
import { PermissionModal } from "@/components/delivery/permission-modal"
import { DeliveryQrScanner } from "@/components/delivery/delivery-qr-scanner"
import { ResultModal } from "@/components/delivery/result-modal"
import type { DeliveryOrder, DeliveryOrderItem } from "@/components/delivery/order-card"
import {
  confirmDeliveryByQr,
  fetchAdminOrders,
  mapAdminOrderToOrder,
} from "@/lib/requests/orders"
import { formatShortOrderId, summarizeDeliverySnapshot, type Order } from "@/lib/data"

type DeliveryFlow =
  | { step: "idle" }
  | { step: "permission" }
  | { step: "scanning" }
  | { step: "result"; success: boolean; scannedOrder?: DeliveryOrder; message?: string }

function monthBoundsISO() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function mapOrderToDeliveryOrder(order: Order): DeliveryOrder {
  const status: DeliveryOrder["status"] =
    order.status === "delivered"
      ? "delivered"
      : order.status === "shipped"
        ? "out_for_delivery"
        : "pending"

  const items: DeliveryOrderItem[] = order.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
  }))

  return {
    id: order.id,
    shortId: formatShortOrderId(order.id),
    customerName: order.customer.name?.trim() || "Cliente sin nombre",
    customerPhone: order.customer.phoneNumber || "Teléfono no disponible",
    address:
      summarizeDeliverySnapshot(order.deliveryAddressSnapshot) ||
      "Dirección no disponible",
    totalPrice: order.totalAmount ?? 0,
    currencyCode: order.currencyCode,
    status,
    items,
  }
}

export default function DeliveryPage() {
  const bounds = monthBoundsISO()
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flow, setFlow] = useState<DeliveryFlow>({ step: "idle" })
  const [isRequesting, setIsRequesting] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [activeTab, setActiveTab] = useState<"pending" | "delivered">("pending")

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminOrders({
        page: 1,
        dateFrom: bounds.from,
        dateTo: bounds.to,
        fulfillmentType: "DELIVERY",
      })
      const mapped = data.items
        .map(mapAdminOrderToOrder)
        .map(mapOrderToDeliveryOrder)
        .filter(
          (order) =>
            order.status === "out_for_delivery" || order.status === "delivered",
        )
      setOrders(mapped)
    } catch (e) {
      setOrders([])
      if (isAxiosError(e)) {
        const status = e.response?.status
        const msg =
          (e.response?.data as { message?: string })?.message ?? e.message
        if (status === 403) {
          setError("No tenés permiso para ver estos pedidos.")
        } else {
          setError(
            typeof msg === "string" && msg
              ? msg
              : "No se pudieron cargar los pedidos. Por favor, intentá de nuevo.",
          )
        }
      } else {
        setError("No se pudieron cargar los pedidos. Por favor, intentá de nuevo.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [bounds.from, bounds.to])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const handleStartScan = () => {
    setPermissionError(null)
    setFlow({ step: "permission" })
  }

  const handleRequestPermission = async () => {
    if (flow.step !== "permission") return

    setIsRequesting(true)
    setPermissionError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      stream.getTracks().forEach((track) => track.stop())
      setFlow({ step: "scanning" })
    } catch (err) {
      const scanError = err as Error
      if (scanError.name === "NotAllowedError") {
        setPermissionError(
          "Permiso de cámara denegado. Habilitá el acceso en la configuración de tu navegador.",
        )
      } else {
        setPermissionError(scanError.message || "Error al acceder a la cámara.")
      }
    } finally {
      setIsRequesting(false)
    }
  }

  const handleScan = async (data: string) => {
    if (flow.step !== "scanning") return

    setIsProcessing(true)

    try {
      const qrData = data.trim()
      if (!qrData) {
        throw new Error("El QR no contiene datos válidos.")
      }

      const result = await confirmDeliveryByQr(qrData)
      if (!result.delivered || !result.order) {
        throw new Error(
          result.message || "No se pudo confirmar la entrega de este pedido.",
        )
      }

      const mappedOrder = mapOrderToDeliveryOrder(result.order)
      setOrders((prev) => {
        const withoutCurrent = prev.filter(
          (current) => current.id !== mappedOrder.id,
        )
        return [mappedOrder, ...withoutCurrent]
      })

      setFlow({
        step: "result",
        success: true,
        scannedOrder: mappedOrder,
      })
      setActiveTab("delivered")
    } catch (err) {
      let message = "No se pudo marcar la orden como entregada."
      if (isAxiosError(err)) {
        const status = err.response?.status
        const apiMsg =
          (err.response?.data as { message?: string })?.message ?? err.message
        if (status === 403) {
          message =
            "Este pedido no está asignado a vos o no tenés permiso para confirmarlo."
        } else if (typeof apiMsg === "string" && apiMsg) {
          message = apiMsg
        }
      } else if (err instanceof Error && err.message) {
        message = err.message
      }
      setFlow({ step: "result", success: false, message })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleScanCancel = () => {
    setFlow({ step: "idle" })
  }

  const handleConfirmDelivery = async () => {
    if (flow.step !== "result" || !flow.success) return

    setIsConfirming(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsConfirming(false)
    setFlow({ step: "idle" })
    void loadOrders()
  }

  const handleTryAgain = () => {
    if (flow.step !== "result") return
    setFlow({ step: "scanning" })
  }

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

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "out_for_delivery"),
    [orders],
  )
  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.status === "delivered"),
    [orders],
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "pending" | "delivered")}
        className="flex-1"
      >
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TruckIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Mis entregas</h1>
                <p className="text-xs text-muted-foreground">
                  {pendingOrders.length} pedido
                  {pendingOrders.length === 1 ? "" : "s"} pendiente
                  {pendingOrders.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Button onClick={handleStartScan} size="sm" className="h-10">
              <ScanLineIcon className="h-4 w-4" />
              Escanear QR
            </Button>
          </div>
          <div className="px-4 pb-3">
            <TabsList>
              <TabsTrigger value="pending">
                Pendientes por entregar ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Entregados ({deliveredOrders.length})
              </TabsTrigger>
            </TabsList>
          </div>
        </header>

        <main className="flex-1 p-4">
          <TabsContent value="pending">
            <OrdersList
              orders={pendingOrders}
              isLoading={isLoading}
              error={error}
              onRetry={loadOrders}
            />
          </TabsContent>
          <TabsContent value="delivered">
            <OrdersList
              orders={deliveredOrders}
              isLoading={isLoading}
              error={error}
              onRetry={loadOrders}
            />
          </TabsContent>
        </main>
      </Tabs>

      <PermissionModal
        open={flow.step === "permission"}
        onOpenChange={handleClosePermission}
        onRequestPermission={handleRequestPermission}
        isRequesting={isRequesting}
        error={permissionError}
        onRetry={handleRequestPermission}
      />

      {flow.step === "scanning" && (
        <DeliveryQrScanner
          onScan={handleScan}
          onCancel={handleScanCancel}
          isProcessing={isProcessing}
        />
      )}

      <ResultModal
        open={flow.step === "result"}
        onOpenChange={handleCloseResult}
        success={flow.step === "result" ? flow.success : false}
        order={flow.step === "result" ? flow.scannedOrder : null}
        errorMessage={flow.step === "result" ? flow.message : undefined}
        onConfirm={handleConfirmDelivery}
        onTryAgain={handleTryAgain}
        isConfirming={isConfirming}
      />
    </div>
  )
}
