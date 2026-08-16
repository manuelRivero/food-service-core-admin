import type {
  Benefit,
  ConditionOperator,
  StructuredOffer,
} from "@/lib/requests/promotions"

export const DAY_LABELS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
] as const

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: "igual a",
  neq: "distinto de",
  gt: "mayor que",
  gte: "mayor o igual a",
  lt: "menor que",
  lte: "menor o igual a",
  in: "incluido en",
  contains: "contiene",
}

export const BENEFIT_TYPE_LABELS: Record<Benefit["type"], string> = {
  percentage_discount: "Descuento porcentual",
  fixed_discount: "Descuento fijo",
  fixed_price: "Precio fijo",
  free_product: "Producto de regalo",
  free_shipping: "Envío gratis",
}

export function formatConditionValue(value: unknown): string {
  if (value == null) return "—"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function emptyOffer(): StructuredOffer {
  return {
    name: "",
    conditions: [],
    benefit: null,
    validity: {},
    limits: {},
    stacking: { allowed: false },
  }
}

export function cloneOffer(offer: StructuredOffer): StructuredOffer {
  return structuredClone(offer)
}
