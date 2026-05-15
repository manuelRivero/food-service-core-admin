function parseDecimal(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  const n = parseFloat(String(v).replace(",", "."))
  return Number.isFinite(n) ? n : null
}

function hasFractionalPart(value: number): boolean {
  return Math.abs(value - Math.round(value)) > 1e-9
}

function formatAmount(value: number): string {
  const hasDecimals = hasFractionalPart(value)
  const [integerPart, decimalPart = ""] = hasDecimals
    ? value.toFixed(2).split(".")
    : [String(Math.round(value)), ""]
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return hasDecimals ? `${groupedInteger},${decimalPart}` : groupedInteger
}

export function formatMenuItemPrice(
  price: number | string | null | undefined,
  currencyCode?: string | null,
): string {
  const amount = parseDecimal(price)
  if (amount == null) return "—"

  const formattedAmount = formatAmount(amount)
  const currency = currencyCode?.trim()
  return currency ? `${currency} ${formattedAmount}` : formattedAmount
}
