/**
 * Alineado con el backend (`AdminOrderRealtimePayload`).
 * Evento: `admin:order` con discriminador `type`.
 */
export type AdminOrderRealtimePayload =
  | {
      type: "order.created"
      businessId: string
      orderId: string
      at: string
      total?: string
      currency?: string
    }
  | {
      type: "order.status_changed"
      businessId: string
      orderId: string
      status: string
      at: string
    }

export function isAdminOrderRealtimePayload(
  value: unknown,
): value is AdminOrderRealtimePayload {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  const t = o.type
  if (t === "order.created") {
    return (
      typeof o.businessId === "string" &&
      typeof o.orderId === "string" &&
      typeof o.at === "string"
    )
  }
  if (t === "order.status_changed") {
    return (
      typeof o.businessId === "string" &&
      typeof o.orderId === "string" &&
      typeof o.status === "string" &&
      typeof o.at === "string"
    )
  }
  return false
}

/**
 * Alineado con el backend (`AdminReservationRealtimePayload`).
 * Evento único: `admin:reservation` con discriminador `type`.
 */
export type AdminReservationRealtimePayload =
  | {
      type: "reservation.created"
      businessId: string
      reservationId: string
      at: string
    }
  | {
      type: "reservation.cancelled"
      businessId: string
      reservationId: string
      status: string
      at: string
    }
  | {
      type: "reservation.edit_started"
      businessId: string
      reservationId: string
      at: string
    }

export function isAdminReservationRealtimePayload(
  value: unknown,
): value is AdminReservationRealtimePayload {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  const t = o.type
  if (t === "reservation.created") {
    return (
      typeof o.businessId === "string" &&
      typeof o.reservationId === "string" &&
      typeof o.at === "string"
    )
  }
  if (t === "reservation.cancelled") {
    return (
      typeof o.businessId === "string" &&
      typeof o.reservationId === "string" &&
      typeof o.status === "string" &&
      typeof o.at === "string"
    )
  }
  if (t === "reservation.edit_started") {
    return (
      typeof o.businessId === "string" &&
      typeof o.reservationId === "string" &&
      typeof o.at === "string"
    )
  }
  return false
}

/** Evento `admin:whatsapp` — mensaje nuevo en una conversación. */
export interface AdminWhatsappMessageCreatedPayload {
  type: "whatsapp.message_created"
  businessId: string
  conversationId: string
  messageId: string
  sender: string
  message: string
  isAiGenerated: boolean
  createdAt: string
}

/** Evento `admin:whatsapp` — el cliente no logra su objetivo y pide intervención humana. */
export interface AdminWhatsappSupportRequestedPayload {
  type: "whatsapp.support_requested"
  businessId: string
  conversationId: string
  customerId: string
  customerPhone: string
  /** Puede llegar como null desde el backend cuando no hay nombre registrado. */
  customerName?: string | null
  at: string
}

/**
 * Evento `admin:whatsapp` — el bot fue reactivado automáticamente por el timeout
 * de handoff configurado en `human_handoff_auto_timeout_minutes`.
 */
export interface AdminWhatsappBotAutoReactivatedPayload {
  type: "whatsapp.bot_auto_reactivated"
  businessId: string
  conversationId: string
  at: string
}

export type AdminWhatsappRealtimePayload =
  | AdminWhatsappMessageCreatedPayload
  | AdminWhatsappSupportRequestedPayload
  | AdminWhatsappBotAutoReactivatedPayload

export function isAdminWhatsappMessageCreatedPayload(
  value: unknown,
): value is AdminWhatsappMessageCreatedPayload {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  return (
    o.type === "whatsapp.message_created" &&
    typeof o.businessId === "string" &&
    typeof o.conversationId === "string" &&
    typeof o.messageId === "string" &&
    typeof o.sender === "string" &&
    typeof o.message === "string" &&
    typeof o.isAiGenerated === "boolean" &&
    typeof o.createdAt === "string"
  )
}

export function isAdminWhatsappSupportRequestedPayload(
  value: unknown,
): value is AdminWhatsappSupportRequestedPayload {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  if (o.type !== "whatsapp.support_requested") return false
  if (
    typeof o.businessId !== "string" ||
    typeof o.conversationId !== "string" ||
    typeof o.customerId !== "string" ||
    typeof o.customerPhone !== "string" ||
    typeof o.at !== "string"
  ) {
    return false
  }
  // customerName puede llegar como null desde el backend además de undefined o string
  if (
    o.customerName !== undefined &&
    o.customerName !== null &&
    typeof o.customerName !== "string"
  ) {
    return false
  }
  return true
}

export function isAdminWhatsappBotAutoReactivatedPayload(
  value: unknown,
): value is AdminWhatsappBotAutoReactivatedPayload {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  return (
    o.type === "whatsapp.bot_auto_reactivated" &&
    typeof o.businessId === "string" &&
    typeof o.conversationId === "string" &&
    typeof o.at === "string"
  )
}

export function isAdminWhatsappRealtimePayload(
  value: unknown,
): value is AdminWhatsappRealtimePayload {
  return (
    isAdminWhatsappMessageCreatedPayload(value) ||
    isAdminWhatsappSupportRequestedPayload(value) ||
    isAdminWhatsappBotAutoReactivatedPayload(value)
  )
}
