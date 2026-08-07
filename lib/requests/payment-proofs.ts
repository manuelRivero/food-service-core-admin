import { api } from "@/lib/api"
import { ADMIN_ORDERS_PATH } from "@/lib/requests/orders"
import type {
  CheckResult,
  PaymentProof,
  PaymentProofChecks,
  PaymentProofExtracted,
  PaymentProofStatus,
} from "@/lib/types/payment-proof"

export type PaymentProofReviewDecision = "approve" | "reject"

export interface PaymentProofRaw {
  id: string
  business_id: string
  order_id: string
  customer_id: string
  conversation_id: string | null
  media_key: string
  media_url: string
  media_mime: string
  media_sha256: string | null
  perceptual_hash: string | null
  status: PaymentProofStatus
  extracted: PaymentProofExtracted | null
  checks: PaymentProofChecks | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
  updated_at: string
}

export interface PaymentProofsListResponseRaw {
  items: PaymentProofRaw[]
}

function isCheckResult(v: unknown): v is CheckResult {
  return v === "pass" || v === "fail" || v === "unknown"
}

function mapChecks(raw: PaymentProofChecks | null): PaymentProofChecks | null {
  if (!raw || typeof raw !== "object") return null
  const keys = [
    "amount_matches",
    "destination_matches",
    "date_within_window",
    "operation_number_unique",
    "image_not_reused",
  ] as const
  for (const k of keys) {
    if (!isCheckResult(raw[k])) return null
  }
  const mapped: PaymentProofChecks = {
    amount_matches: raw.amount_matches,
    destination_matches: raw.destination_matches,
    date_within_window: raw.date_within_window,
    operation_number_unique: raw.operation_number_unique,
    image_not_reused: raw.image_not_reused,
  }
  if (
    raw.image_reused_in_order_id != null &&
    typeof raw.image_reused_in_order_id === "string"
  ) {
    mapped.image_reused_in_order_id = raw.image_reused_in_order_id
  }
  return mapped
}

export function mapPaymentProofRaw(raw: PaymentProofRaw): PaymentProof {
  return {
    id: raw.id,
    businessId: raw.business_id,
    orderId: raw.order_id,
    customerId: raw.customer_id,
    conversationId: raw.conversation_id,
    mediaKey: raw.media_key,
    mediaUrl: raw.media_url,
    mediaMime: raw.media_mime,
    mediaSha256: raw.media_sha256,
    perceptualHash: raw.perceptual_hash,
    status: raw.status,
    extracted: raw.extracted ?? null,
    checks: mapChecks(raw.checks),
    reviewedBy: raw.reviewed_by,
    reviewedAt: raw.reviewed_at,
    reviewNote: raw.review_note,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export async function fetchOrderPaymentProofs(orderId: string) {
  const { data } = await api.get<PaymentProofsListResponseRaw>(
    `${ADMIN_ORDERS_PATH}/${orderId}/payment-proofs`,
  )
  const items = (data.items ?? []).map(mapPaymentProofRaw)
  items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  return items
}

export async function reviewOrderPaymentProof(
  orderId: string,
  proofId: string,
  body: { decision: PaymentProofReviewDecision; note?: string },
) {
  const payload: { decision: PaymentProofReviewDecision; note?: string } = {
    decision: body.decision,
  }
  const note = body.note?.trim()
  if (note) payload.note = note

  const { data } = await api.post<PaymentProofRaw>(
    `${ADMIN_ORDERS_PATH}/${orderId}/payment-proofs/${proofId}/review`,
    payload,
  )
  return mapPaymentProofRaw(data)
}
