import { cn } from "@/lib/utils"

/** Mapeo para `orders.status` (string en BD) y valores legacy de la UI. */
const ORDER_STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Borrador",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-300",
  },
  placed: {
    label: "Pedido recibido",
    className: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  pending_payment: {
    label: "Pago pendiente",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  preparing: {
    label: "En preparación",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  shipped: {
    label: "Enviado",
    className: "bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300",
  },
  delivered: {
    label: "Entregado",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  processing: {
    label: "En proceso",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "Completado",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
}

const RESERVATION_STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  /** Cancelación por el usuario (backend `closed`). */
  closed: {
    label: "Cancelada",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
}

const ORDER_PAYMENT_STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  unpaid: {
    label: "Sin cobrar",
    className: "bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200",
  },
  paid: {
    label: "Cobrado",
    className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  deferred: {
    label: "Pago al entregar",
    className: "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200",
  },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  const config = ORDER_STATUS_BADGE[key] ?? {
    label: status,
    className:
      "bg-muted text-muted-foreground dark:bg-muted/80",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

/** Cobro (`payment_status`), independiente de la logística (`OrderStatusBadge`). */
export function OrderPaymentStatusBadge({ paymentStatus }: { paymentStatus: string }) {
  const key = paymentStatus.toLowerCase()
  const config = ORDER_PAYMENT_STATUS_BADGE[key] ?? {
    label: paymentStatus,
    className:
      "bg-muted text-muted-foreground dark:bg-muted/80",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

export function ReservationStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase()
  const config = RESERVATION_STATUS_BADGE[key] ?? {
    label: status,
    className:
      "bg-muted text-muted-foreground dark:bg-muted/80",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
