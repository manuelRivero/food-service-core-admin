export type PaymentProofStatus =
  | "received"
  | "auto_checked"
  | "approved"
  | "rejected"

export type CheckResult = "pass" | "fail" | "unknown"

export type PaymentProofExtracted = {
  kind: "transfer_voucher" | "other"
  legibility: "clear" | "partial" | "unreadable"
  amount: number | null
  currency: string | null
  operation_number: string | null
  transferred_at: string | null
  sender_name: string | null
  bank: string | null
  destination_alias: string | null
  destination_cbu: string | null
  destination_holder: string | null
}

export type PaymentProofChecks = {
  amount_matches: CheckResult
  destination_matches: CheckResult
  date_within_window: CheckResult
  operation_number_unique: CheckResult
  image_not_reused: CheckResult
  /** Solo si image_not_reused === 'fail' */
  image_reused_in_order_id?: string
}

export type PaymentProof = {
  id: string
  businessId: string
  orderId: string
  customerId: string
  conversationId: string | null
  mediaKey: string
  mediaUrl: string
  mediaMime: string
  mediaSha256: string | null
  perceptualHash: string | null
  status: PaymentProofStatus
  extracted: PaymentProofExtracted | null
  checks: PaymentProofChecks | null
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
}

export type PaymentProofCheckKey = Exclude<
  keyof PaymentProofChecks,
  "image_reused_in_order_id"
>

export const PAYMENT_PROOF_CHECK_LABELS: Record<PaymentProofCheckKey, string> =
  {
    amount_matches: "Monto = total del pedido",
    destination_matches: "Destino (alias/CBU) del local",
    date_within_window: "Fecha coherente con el pedido",
    operation_number_unique: "Nro. de operación no usado antes",
    image_not_reused: "Imagen no reutilizada",
  }

export const PAYMENT_PROOF_STATUS_LABELS: Record<PaymentProofStatus, string> = {
  received: "Pendiente de análisis",
  auto_checked: "Listo para revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
}

export function needsManualReviewOnly(
  extracted: PaymentProofExtracted | null,
): boolean {
  if (!extracted) return true
  return extracted.kind === "other" || extracted.legibility === "unreadable"
}

/** Primeros 8 chars del UUID sin guiones, en mayúsculas (mismo criterio que el bot). */
export function orderRefFromOrderId(orderId: string): string {
  return orderId.replace(/-/g, "").slice(0, 8).toUpperCase()
}
