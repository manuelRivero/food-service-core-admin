export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "online", label: "Pago online" },
  { value: "transfer", label: "Transferencia" },
] as const

export type PaymentMethodId = (typeof PAYMENT_METHOD_OPTIONS)[number]["value"]

const PAYMENT_METHOD_IDS = new Set<string>(
  PAYMENT_METHOD_OPTIONS.map((o) => o.value),
)

export function isValidPaymentMethodId(value: string): value is PaymentMethodId {
  return PAYMENT_METHOD_IDS.has(value)
}

export function getPaymentMethodLabel(id: string): string {
  return PAYMENT_METHOD_OPTIONS.find((o) => o.value === id)?.label ?? id
}
