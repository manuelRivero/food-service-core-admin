import { api } from "@/lib/api"

export const ADMIN_PAYMENT_METHOD_CONFIGS_PATH = "/admin/payment-method-configs"

export interface AdminPaymentMethodConfig {
  id: string
  paymentMethod: string
  label: string
  adjustmentType: "PERCENT" | "FIXED"
  adjustmentValue: number
  isSurcharge: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentMethodConfigPayload {
  paymentMethod: string
  label: string
  adjustmentType: "PERCENT" | "FIXED"
  adjustmentValue: number
  isSurcharge: boolean
  isActive?: boolean
}

export interface UpdatePaymentMethodConfigPayload {
  paymentMethod?: string
  label?: string
  adjustmentType?: "PERCENT" | "FIXED"
  adjustmentValue?: number
  isSurcharge?: boolean
  isActive?: boolean
}

interface AdminPaymentMethodConfigRaw {
  id?: string
  paymentMethod?: string | null
  payment_method?: string | null
  label?: string | null
  adjustmentType?: string | null
  adjustment_type?: string | null
  adjustmentValue?: string | number | null
  adjustment_value?: string | number | null
  isSurcharge?: boolean | null
  is_surcharge?: boolean | null
  isActive?: boolean | null
  is_active?: boolean | null
  createdAt?: string | null
  created_at?: string | null
  updatedAt?: string | null
  updated_at?: string | null
}

function parseDecimal(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  const n = parseFloat(String(v).replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

function toBoolean(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v
  return fallback
}

function mapConfig(raw: AdminPaymentMethodConfigRaw): AdminPaymentMethodConfig {
  const rawType = raw.adjustmentType ?? raw.adjustment_type ?? ""
  const adjustmentType: "PERCENT" | "FIXED" =
    rawType === "PERCENT" || rawType === "FIXED" ? rawType : "PERCENT"

  return {
    id: String(raw.id ?? ""),
    paymentMethod: String(raw.paymentMethod ?? raw.payment_method ?? ""),
    label: String(raw.label ?? ""),
    adjustmentType,
    adjustmentValue: parseDecimal(raw.adjustmentValue ?? raw.adjustment_value),
    isSurcharge: toBoolean(raw.isSurcharge ?? raw.is_surcharge, false),
    isActive: toBoolean(raw.isActive ?? raw.is_active, true),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  }
}

export async function fetchPaymentMethodConfigs(): Promise<AdminPaymentMethodConfig[]> {
  const { data } = await api.get<AdminPaymentMethodConfigRaw[] | { items?: AdminPaymentMethodConfigRaw[] }>(
    ADMIN_PAYMENT_METHOD_CONFIGS_PATH,
  )
  const list = Array.isArray(data) ? data : (data as { items?: AdminPaymentMethodConfigRaw[] }).items ?? []
  return list.map(mapConfig)
}

export async function createPaymentMethodConfig(
  payload: CreatePaymentMethodConfigPayload,
): Promise<AdminPaymentMethodConfig> {
  const { data } = await api.post<AdminPaymentMethodConfigRaw>(
    ADMIN_PAYMENT_METHOD_CONFIGS_PATH,
    payload,
  )
  return mapConfig(data)
}

export async function updatePaymentMethodConfig(
  id: string,
  payload: UpdatePaymentMethodConfigPayload,
): Promise<AdminPaymentMethodConfig> {
  const { data } = await api.patch<AdminPaymentMethodConfigRaw>(
    `${ADMIN_PAYMENT_METHOD_CONFIGS_PATH}/${id}`,
    payload,
  )
  return mapConfig(data)
}

export async function deletePaymentMethodConfig(id: string): Promise<void> {
  await api.delete(`${ADMIN_PAYMENT_METHOD_CONFIGS_PATH}/${id}`)
}
