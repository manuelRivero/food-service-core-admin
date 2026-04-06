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
