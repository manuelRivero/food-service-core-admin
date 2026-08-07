"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { isAxiosError } from "axios"
import { Check, ExternalLink, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAdminSocket } from "@/contexts/admin-socket-context"
import { formatOrderMoney } from "@/lib/data"
import {
  fetchOrderPaymentProofs,
  reviewOrderPaymentProof,
} from "@/lib/requests/payment-proofs"
import {
  needsManualReviewOnly,
  PAYMENT_PROOF_CHECK_LABELS,
  PAYMENT_PROOF_STATUS_LABELS,
  type CheckResult,
  type PaymentProof,
  type PaymentProofCheckKey,
  type PaymentProofExtracted,
} from "@/lib/types/payment-proof"
import { cn } from "@/lib/utils"

const CHECK_KEYS = Object.keys(
  PAYMENT_PROOF_CHECK_LABELS,
) as PaymentProofCheckKey[]

function checkBadgeClass(result: CheckResult): string {
  switch (result) {
    case "pass":
      return "border-emerald-300 bg-emerald-50 text-emerald-800"
    case "fail":
      return "border-red-300 bg-red-50 text-red-800"
    case "unknown":
      return "border-muted-foreground/30 bg-muted text-muted-foreground"
  }
}

function checkResultLabel(result: CheckResult): string {
  switch (result) {
    case "pass":
      return "OK"
    case "fail":
      return "No"
    case "unknown":
      return "Sin dato"
  }
}

function statusBadgeClass(status: PaymentProof["status"]): string {
  switch (status) {
    case "received":
      return "border-amber-300 bg-amber-50 text-amber-900"
    case "auto_checked":
      return "border-sky-300 bg-sky-50 text-sky-900"
    case "approved":
      return "border-emerald-300 bg-emerald-50 text-emerald-900"
    case "rejected":
      return "border-red-300 bg-red-50 text-red-900"
  }
}

function formatExtractedAt(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d)
}

function ExtractedFields({
  extracted,
  fallbackCurrency,
}: {
  extracted: PaymentProofExtracted
  fallbackCurrency: string
}) {
  const amountLabel =
    extracted.amount != null
      ? formatOrderMoney(
          extracted.amount,
          extracted.currency || fallbackCurrency,
        )
      : "—"

  const rows: { label: string; value: string }[] = [
    { label: "Monto", value: amountLabel },
    { label: "Nro. de operación", value: extracted.operation_number ?? "—" },
    {
      label: "Alias destino",
      value: extracted.destination_alias ?? "—",
    },
    { label: "CBU destino", value: extracted.destination_cbu ?? "—" },
    {
      label: "Fecha transferencia",
      value: formatExtractedAt(extracted.transferred_at),
    },
    { label: "Remitente", value: extracted.sender_name ?? "—" },
    { label: "Banco", value: extracted.bank ?? "—" },
    { label: "Titular destino", value: extracted.destination_holder ?? "—" },
  ]

  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{row.label}</dt>
          <dd className="truncate text-sm font-medium" title={row.value}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function PaymentProofCard({
  proof,
  orderCurrency,
  highlight,
  onReviewed,
}: {
  proof: PaymentProof
  orderCurrency: string
  highlight: boolean
  onReviewed: (updated: PaymentProof) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(
    null,
  )

  useEffect(() => {
    if (!highlight || !cardRef.current) return
    cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [highlight])

  const canReview =
    proof.status === "received" || proof.status === "auto_checked"
  const manualOnly = needsManualReviewOnly(proof.extracted)

  const handleReview = async (decision: "approve" | "reject") => {
    setSubmitting(decision)
    try {
      const updated = await reviewOrderPaymentProof(proof.orderId, proof.id, {
        decision,
        note: note.trim() || undefined,
      })
      onReviewed(updated)
      toast.success(
        decision === "approve"
          ? "Comprobante aprobado — pedido marcado como pagado"
          : "Comprobante rechazado",
      )
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { error?: string; message?: string })?.error ??
          (e.response?.data as { message?: string })?.message ??
          e.message
        : "No se pudo revisar el comprobante"
      toast.error(typeof msg === "string" ? msg : "Error al revisar")
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div
      ref={cardRef}
      id={`payment-proof-${proof.id}`}
      className={cn(
        "space-y-3 rounded-lg border p-3",
        highlight && "ring-2 ring-emerald-500 ring-offset-2",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn("font-normal", statusBadgeClass(proof.status))}
        >
          {PAYMENT_PROOF_STATUS_LABELS[proof.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatExtractedAt(proof.createdAt)}
        </span>
      </div>

      <a
        href={proof.mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-md border bg-muted/40"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={proof.mediaUrl}
          alt="Comprobante de transferencia"
          className="max-h-72 w-full object-contain"
        />
      </a>
      <p className="text-[11px] text-muted-foreground">
        {proof.mediaMime} ·{" "}
        <a
          href={proof.mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Abrir original
        </a>
      </p>

      {manualOnly ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-sm text-amber-950">
          Revisión manual: la visión no extrajo datos confiables. Contrastá con
          la imagen.
        </p>
      ) : proof.extracted ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Datos extraídos</p>
          <ExtractedFields
            extracted={proof.extracted}
            fallbackCurrency={orderCurrency}
          />
        </div>
      ) : null}

      {proof.checks ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Chequeos automáticos</p>
          <p className="text-xs text-muted-foreground">
            Solo informan; no aprueban solos.
          </p>
          <ul className="flex flex-col gap-1.5">
            {CHECK_KEYS.map((key) => {
              const result = proof.checks![key]
              return (
                <li
                  key={key}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-normal tabular-nums",
                      checkBadgeClass(result),
                    )}
                  >
                    {checkResultLabel(result)}
                  </Badge>
                  <span>{PAYMENT_PROOF_CHECK_LABELS[key]}</span>
                  {key === "image_not_reused" &&
                  result === "fail" &&
                  proof.checks?.image_reused_in_order_id ? (
                    <Link
                      href={`/orders?orderId=${encodeURIComponent(proof.checks.image_reused_in_order_id)}`}
                      className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
                    >
                      Ver otro pedido
                      <ExternalLink className="size-3" />
                    </Link>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : proof.status === "received" ? (
        <p className="text-sm text-muted-foreground">
          Análisis en curso o incompleto. Podés aprobar o rechazar con la
          imagen.
        </p>
      ) : null}

      {proof.reviewNote ? (
        <p className="text-sm text-muted-foreground">
          Nota de revisión: {proof.reviewNote}
        </p>
      ) : null}

      {canReview ? (
        <div className="space-y-2 border-t pt-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`proof-note-${proof.id}`}>
              Nota (opcional)
            </Label>
            <Textarea
              id={`proof-note-${proof.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Motivo visible para el equipo…"
              rows={2}
              disabled={submitting != null}
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting != null}
              onClick={() => void handleReview("reject")}
            >
              <X className="size-4" />
              {submitting === "reject" ? "Rechazando…" : "Rechazar"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting != null}
              onClick={() => void handleReview("approve")}
            >
              <Check className="size-4" />
              {submitting === "approve" ? "Aprobando…" : "Aprobar"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export interface OrderPaymentProofsProps {
  orderId: string
  orderCurrency: string
  /** Mostrar sección aunque aún no haya proofs (p. ej. transfer unpaid). */
  forceShow?: boolean
  highlightProofId?: string | null
  onPaymentPossiblyChanged?: () => void
}

export function OrderPaymentProofs({
  orderId,
  orderCurrency,
  forceShow = false,
  highlightProofId = null,
  onPaymentPossiblyChanged,
}: OrderPaymentProofsProps) {
  const { subscribeToOrderRealtime } = useAdminSocket()
  const [proofs, setProofs] = useState<PaymentProof[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProofs = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const items = await fetchOrderPaymentProofs(id)
      setProofs(items)
    } catch (e) {
      setProofs([])
      const msg = isAxiosError(e)
        ? (e.response?.data as { error?: string; message?: string })?.error ??
          (e.response?.data as { message?: string })?.message ??
          e.message
        : "No se pudieron cargar los comprobantes"
      setError(typeof msg === "string" ? msg : "Error al cargar comprobantes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProofs(orderId)
  }, [orderId])

  useEffect(() => {
    return subscribeToOrderRealtime((payload) => {
      if (payload.orderId !== orderId) return
      if (
        payload.type === "order.payment_proof_received" ||
        payload.type === "order.payment_proof_checked"
      ) {
        void loadProofs(orderId)
      }
      if (payload.type === "order.payment_status_changed") {
        onPaymentPossiblyChanged?.()
      }
    })
  }, [subscribeToOrderRealtime, orderId, onPaymentPossiblyChanged])

  // Sin forceShow: no flash mientras carga; se monta la UI cuando hay ítems.
  if (!forceShow && loading) return null
  if (!forceShow && !loading && proofs.length === 0 && !error) return null
  if (!forceShow && error && proofs.length === 0) return null

  return (
    <>
      <Separator />
      <div className="space-y-3">
      <h4 className="text-sm font-medium leading-none">
        Comprobantes de transferencia
      </h4>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : proofs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no llegó ningún comprobante por WhatsApp.
        </p>
      ) : (
        <div className="space-y-3">
          {proofs.map((proof) => (
            <PaymentProofCard
              key={proof.id}
              proof={proof}
              orderCurrency={orderCurrency}
              highlight={highlightProofId === proof.id}
              onReviewed={(updated) => {
                setProofs((prev) =>
                  prev.map((p) => (p.id === updated.id ? updated : p)),
                )
                onPaymentPossiblyChanged?.()
              }}
            />
          ))}
        </div>
      )}
    </div>
    </>
  )
}
