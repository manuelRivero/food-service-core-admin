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
import {
  isAdminReservationRealtimePayload,
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

export type AdminOrderSocketPayload = {
  type: string
  businessId: string
  orderId: string
  total?: string
  currency?: string
  at: string
}

type AdminSocketContextValue = {
  isConnected: boolean
  notifications: AdminNotification[]
  badgeCount: number
  removeNotification: (id: string) => void
  subscribeToNewOrders: (cb: (orderId: string) => void) => () => void
  /** Evento `admin:reservation` con payload discriminado (created / cancelled / edit_started). */
  subscribeToReservationRealtime: (
    cb: (payload: AdminReservationRealtimePayload) => void,
  ) => () => void
}

const AdminSocketContext = createContext<AdminSocketContextValue | null>(null)

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

  const orderListenersRef = useRef(new Set<(id: string) => void>())
  const reservationRealtimeListenersRef = useRef(
    new Set<(payload: AdminReservationRealtimePayload) => void>(),
  )
  const socketRef = useRef<Socket | null>(null)

  const subscribeToNewOrders = useCallback((cb: (orderId: string) => void) => {
    orderListenersRef.current.add(cb)
    return () => {
      orderListenersRef.current.delete(cb)
    }
  }, [])

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

    socket.on("admin:order", (p: AdminOrderSocketPayload) => {
      const orderId = p.orderId
      orderListenersRef.current.forEach((fn) => {
        try {
          fn(orderId)
        } catch {
          /* noop */
        }
      })

      const path = pathnameRef.current
      const read = path === "/orders"
      const subtitle =
        p.total != null && p.currency
          ? `${p.total} ${p.currency}`
          : p.total != null
            ? String(p.total)
            : undefined

      setNotifications((prev) => {
        const next: AdminNotification = {
          id: `order-${orderId}-${Date.now()}`,
          kind: "order",
          resourceId: orderId,
          at: p.at,
          title: "Nuevo pedido",
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
      subscribeToNewOrders,
      subscribeToReservationRealtime,
    }),
    [
      isConnected,
      notifications,
      badgeCount,
      removeNotification,
      subscribeToNewOrders,
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
