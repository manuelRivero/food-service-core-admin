"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { usePathname } from "next/navigation"
import { io, type Socket } from "socket.io-client"

import { getAuthCookie } from "@/lib/auth"
import { getSocketBaseUrl } from "@/lib/socket-base-url"
import { getOrderStatusLabelEs } from "@/lib/constants/orderWorkflow"
import {
  isAdminOrderRealtimePayload,
  isAdminReservationRealtimePayload,
  type AdminOrderRealtimePayload,
  type AdminReservationRealtimePayload,
} from "@/lib/types/admin-realtime"

export type AdminNotificationKind = "order" | "reservation"

export interface AdminNotification {
  id: string
  kind: AdminNotificationKind
  resourceId: string
  at: string
  title: string
  subtitle?: string
  read: boolean
}

type AdminSocketContextValue = {
  isConnected: boolean
  notifications: AdminNotification[]
  badgeCount: number
  removeNotification: (id: string) => void
  /** Evento `admin:order` con payload discriminado (created / status_changed). */
  subscribeToOrderRealtime: (
    cb: (payload: AdminOrderRealtimePayload) => void,
  ) => () => void
  /** Evento `admin:reservation` con payload discriminado (created / cancelled / edit_started). */
  subscribeToReservationRealtime: (
    cb: (payload: AdminReservationRealtimePayload) => void,
  ) => () => void
}

const AdminSocketContext = createContext<AdminSocketContextValue | null>(null)

function notificationTitleForOrder(payload: AdminOrderRealtimePayload): string {
  switch (payload.type) {
    case "order.created":
      return "Nuevo pedido"
    case "order.status_changed":
      return "Estado del pedido actualizado"
    default:
      return "Pedido"
  }
}

function notificationSubtitleForOrder(
  payload: AdminOrderRealtimePayload,
): string | undefined {
  switch (payload.type) {
    case "order.created":
      if (payload.total != null && payload.currency) {
        return `${payload.total} ${payload.currency}`
      }
      return payload.total != null ? String(payload.total) : undefined
    case "order.status_changed":
      return getOrderStatusLabelEs(payload.status)
    default:
      return undefined
  }
}

function notificationTitleForReservation(
  payload: AdminReservationRealtimePayload,
): string {
  switch (payload.type) {
    case "reservation.created":
      return "Nueva reserva"
    case "reservation.cancelled":
      return "Reserva cancelada"
    case "reservation.edit_started":
      return "Edición de reserva"
    default:
      return "Reserva"
  }
}

export function AdminSocketProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])

  const orderRealtimeListenersRef = useRef(
    new Set<(payload: AdminOrderRealtimePayload) => void>(),
  )
  const reservationRealtimeListenersRef = useRef(
    new Set<(payload: AdminReservationRealtimePayload) => void>(),
  )
  const socketRef = useRef<Socket | null>(null)

  const subscribeToOrderRealtime = useCallback(
    (cb: (payload: AdminOrderRealtimePayload) => void) => {
      orderRealtimeListenersRef.current.add(cb)
      return () => {
        orderRealtimeListenersRef.current.delete(cb)
      }
    },
    [],
  )

  const subscribeToReservationRealtime = useCallback(
    (cb: (payload: AdminReservationRealtimePayload) => void) => {
      reservationRealtimeListenersRef.current.add(cb)
      return () => {
        reservationRealtimeListenersRef.current.delete(cb)
      }
    },
    [],
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  useEffect(() => {
    if (pathname === "/orders") {
      setNotifications((prev) =>
        prev.map((n) => (n.kind === "order" ? { ...n, read: true } : n)),
      )
    }
  }, [pathname])

  useEffect(() => {
    if (pathname === "/reservations") {
      setNotifications((prev) =>
        prev.map((n) =>
          n.kind === "reservation" ? { ...n, read: true } : n,
        ),
      )
    }
  }, [pathname])

  const badgeCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  useEffect(() => {
    const token = getAuthCookie()
    const base = getSocketBaseUrl()
    if (!token || !base) {
      return
    }

    const socket = io(base, {
      path: "/socket.io",
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    })

    socketRef.current = socket

    socket.on("connect", () => setIsConnected(true))
    socket.on("disconnect", () => setIsConnected(false))
    socket.on("connect_error", () => setIsConnected(false))

    socket.on("admin:order", (raw: unknown) => {
      if (!isAdminOrderRealtimePayload(raw)) {
        return
      }
      const p = raw
      orderRealtimeListenersRef.current.forEach((fn) => {
        try {
          fn(p)
        } catch {
          /* noop */
        }
      })

      const path = pathnameRef.current
      const read = path === "/orders"
      const orderId = p.orderId
      const title = notificationTitleForOrder(p)
      const subtitle = notificationSubtitleForOrder(p)

      setNotifications((prev) => {
        const next: AdminNotification = {
          id: `${p.type}-${orderId}-${Date.now()}`,
          kind: "order",
          resourceId: orderId,
          at: p.at,
          title,
          subtitle,
          read,
        }
        return [next, ...prev].slice(0, 40)
      })
    })

    socket.on("admin:reservation", (raw: unknown) => {
      if (!isAdminReservationRealtimePayload(raw)) {
        return
      }
      const p = raw
      reservationRealtimeListenersRef.current.forEach((fn) => {
        try {
          fn(p)
        } catch {
          /* noop */
        }
      })

      const path = pathnameRef.current
      const read = path === "/reservations"
      const title = notificationTitleForReservation(p)
      const subtitle =
        p.type === "reservation.cancelled" ? `Estado: ${p.status}` : undefined

      setNotifications((prev) => {
        const next: AdminNotification = {
          id: `${p.type}-${p.reservationId}-${Date.now()}`,
          kind: "reservation",
          resourceId: p.reservationId,
          at: p.at,
          title,
          subtitle,
          read,
        }
        return [next, ...prev].slice(0, 40)
      })
    })

    return () => {
      socket.removeAllListeners()
      socket.close()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [])

  const value = useMemo<AdminSocketContextValue>(
    () => ({
      isConnected,
      notifications,
      badgeCount,
      removeNotification,
      subscribeToOrderRealtime,
      subscribeToReservationRealtime,
    }),
    [
      isConnected,
      notifications,
      badgeCount,
      removeNotification,
      subscribeToOrderRealtime,
      subscribeToReservationRealtime,
    ],
  )

  return (
    <AdminSocketContext.Provider value={value}>
      {children}
    </AdminSocketContext.Provider>
  )
}

export function useAdminSocket() {
  const ctx = useContext(AdminSocketContext)
  if (!ctx) {
    throw new Error("useAdminSocket debe usarse dentro de AdminSocketProvider")
  }
  return ctx
}
