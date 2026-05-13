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
import { usePathname, useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { toast } from "sonner"

import { getAuthCookie } from "@/lib/auth"
import { getSocketBaseUrl } from "@/lib/socket-base-url"
import { getOrderStatusLabelEs } from "@/lib/constants/orderWorkflow"
import {
  startSupportAlertLoop,
  stopSupportAlertLoop,
} from "@/lib/support-alert-audio"
import {
  isAdminOrderRealtimePayload,
  isAdminReservationRealtimePayload,
  isAdminWhatsappMessageCreatedPayload,
  isAdminWhatsappSupportRequestedPayload,
  isAdminWhatsappBotAutoReactivatedPayload,
  type AdminOrderRealtimePayload,
  type AdminReservationRealtimePayload,
  type AdminWhatsappRealtimePayload,
} from "@/lib/types/admin-realtime"

export type AdminNotificationKind =
  | "order"
  | "reservation"
  | "whatsapp_support"

export interface AdminNotification {
  id: string
  kind: AdminNotificationKind
  resourceId: string
  at: string
  title: string
  subtitle?: string
  read: boolean
}

export type WhatsappSupportConversationMeta = {
  customerName: string
  customerPhone: string
  at: string
}

type AdminSocketContextValue = {
  isConnected: boolean
  notifications: AdminNotification[]
  badgeCount: number
  removeNotification: (id: string) => void
  /** Conversaciones con solicitud de soporte pendiente (badge listado / sidebar). */
  whatsappSupportByConversation: Record<string, WhatsappSupportConversationMeta>
  whatsappSupportPendingCount: number
  acknowledgeWhatsappSupportConversation: (conversationId: string) => void
  /** Evento `admin:order` con payload discriminado (created / status_changed). */
  subscribeToOrderRealtime: (
    cb: (payload: AdminOrderRealtimePayload) => void,
  ) => () => void
  /** Evento `admin:reservation` con payload discriminado (created / cancelled / edit_started). */
  subscribeToReservationRealtime: (
    cb: (payload: AdminReservationRealtimePayload) => void,
  ) => () => void
  /** Evento `admin:whatsapp` (`whatsapp.message_created` | `whatsapp.support_requested`). */
  subscribeToWhatsappRealtime: (
    cb: (payload: AdminWhatsappRealtimePayload) => void,
  ) => () => void
}

function isMessagesPath(path: string): boolean {
  return path === "/messages" || path.startsWith("/messages/")
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
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router

  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [whatsappSupportByConversation, setWhatsappSupportByConversation] =
    useState<Record<string, WhatsappSupportConversationMeta>>({})

  const orderRealtimeListenersRef = useRef(
    new Set<(payload: AdminOrderRealtimePayload) => void>(),
  )
  const reservationRealtimeListenersRef = useRef(
    new Set<(payload: AdminReservationRealtimePayload) => void>(),
  )
  const whatsappRealtimeListenersRef = useRef(
    new Set<(payload: AdminWhatsappRealtimePayload) => void>(),
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

  const subscribeToWhatsappRealtime = useCallback(
    (cb: (payload: AdminWhatsappRealtimePayload) => void) => {
      whatsappRealtimeListenersRef.current.add(cb)
      return () => {
        whatsappRealtimeListenersRef.current.delete(cb)
      }
    },
    [],
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const acknowledgeWhatsappSupportConversation = useCallback(
    (conversationId: string) => {
      setWhatsappSupportByConversation((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, conversationId)) {
          return prev
        }
        const { [conversationId]: _removed, ...rest } = prev
        return rest
      })
      setNotifications((prev) =>
        prev.filter(
          (n) =>
            !(
              n.kind === "whatsapp_support" &&
              n.resourceId === conversationId
            ),
        ),
      )
    },
    [],
  )

  const whatsappSupportPendingCount = useMemo(
    () => Object.keys(whatsappSupportByConversation).length,
    [whatsappSupportByConversation],
  )

  useEffect(() => {
    if (isMessagesPath(pathname)) {
      stopSupportAlertLoop()
    }
  }, [pathname])

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

    socket.on("admin:whatsapp", (raw: unknown) => {
      if (isAdminWhatsappMessageCreatedPayload(raw)) {
        const p = raw
        whatsappRealtimeListenersRef.current.forEach((fn) => {
          try {
            fn(p)
          } catch {
            /* noop */
          }
        })
        return
      }

      if (isAdminWhatsappBotAutoReactivatedPayload(raw)) {
        const p = raw
        whatsappRealtimeListenersRef.current.forEach((fn) => {
          try {
            fn(p)
          } catch {
            /* noop */
          }
        })
        return
      }

      if (isAdminWhatsappSupportRequestedPayload(raw)) {
        const p = raw
        whatsappRealtimeListenersRef.current.forEach((fn) => {
          try {
            fn(p)
          } catch {
            /* noop */
          }
        })

        const trimmedName = (p.customerName ?? "").trim()
        const contactLabel =
          trimmedName.length > 0 ? trimmedName : "Usuario no agendado"
        const subtitle = `${contactLabel} · ${p.customerPhone}`

        setWhatsappSupportByConversation((prev) => ({
          ...prev,
          [p.conversationId]: {
            customerName: contactLabel,
            customerPhone: p.customerPhone,
            at: p.at,
          },
        }))

        setNotifications((prev) => {
          const next: AdminNotification = {
            id: `${p.type}-${p.conversationId}-${Date.now()}`,
            kind: "whatsapp_support",
            resourceId: p.conversationId,
            at: p.at,
            title: "Cliente necesita atención (WhatsApp)",
            subtitle,
            read: false,
          }
          return [next, ...prev].slice(0, 40)
        })

        const path = pathnameRef.current
        const onMessages = isMessagesPath(path)
        if (!onMessages) {
          startSupportAlertLoop()
        }

        const conversationQuery = encodeURIComponent(p.conversationId)
        const openChat = () => {
          routerRef.current.push(`/messages?conversation=${conversationQuery}`)
        }

        toast.custom(
          (tid) => (
            <button
              type="button"
              className="group flex w-full max-w-sm flex-col gap-0.5 rounded-lg border border-amber-400/70 bg-amber-50 px-3 py-3 text-left text-amber-950 shadow-md transition hover:bg-amber-100/90"
              onClick={() => {
                toast.dismiss(tid)
                openChat()
              }}
            >
              <span className="text-sm font-semibold leading-snug">
                Un cliente necesita atención en WhatsApp
              </span>
              <span className="text-xs leading-snug text-amber-900/90">
                {subtitle}
              </span>
              <span className="pt-0.5 text-[11px] font-medium text-amber-800 underline-offset-2 group-hover:underline">
                Tocar para abrir la conversación
              </span>
            </button>
          ),
          { duration: 60_000 },
        )

        return
      }
    })

    return () => {
      stopSupportAlertLoop()
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
      whatsappSupportByConversation,
      whatsappSupportPendingCount,
      acknowledgeWhatsappSupportConversation,
      subscribeToOrderRealtime,
      subscribeToReservationRealtime,
      subscribeToWhatsappRealtime,
    }),
    [
      isConnected,
      notifications,
      badgeCount,
      removeNotification,
      whatsappSupportByConversation,
      whatsappSupportPendingCount,
      acknowledgeWhatsappSupportConversation,
      subscribeToOrderRealtime,
      subscribeToReservationRealtime,
      subscribeToWhatsappRealtime,
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
