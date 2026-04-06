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
  confirmed: {
    label: "Confirmado",
    className: "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  preparing: {
    label: "En preparación",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
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
    label: "Cancelado",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  closed: {
    label: "Cerrada",
    className: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300",
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
