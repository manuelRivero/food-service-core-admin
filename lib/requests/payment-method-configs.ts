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
  instructions: string | null
  sortOrder: number
  bankAlias: string | null
  bankCbu: string | null
  bankHolder: string | null
  createdAt: string
  updatedAt: string
}

/** Vacío o `null` limpia el campo en el backend. */
export type NullableStringField = string | null

export interface CreatePaymentMethodConfigPayload {
  paymentMethod: string
  label: string
  adjustmentType: "PERCENT" | "FIXED"
  adjustmentValue: number
  isSurcharge: boolean
  isActive?: boolean
  instructions?: NullableStringField
  sortOrder?: number
  bankAlias?: NullableStringField
  bankCbu?: NullableStringField
  bankHolder?: NullableStringField
}

export interface UpdatePaymentMethodConfigPayload {
  paymentMethod?: string
  label?: string
  adjustmentType?: "PERCENT" | "FIXED"
  adjustmentValue?: number
  isSurcharge?: boolean
  isActive?: boolean
  instructions?: NullableStringField
  sortOrder?: number
  bankAlias?: NullableStringField
  bankCbu?: NullableStringField
  bankHolder?: NullableStringField
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
  instructions?: string | null
  sortOrder?: number | null
  sort_order?: number | null
  bankAlias?: string | null
  bank_alias?: string | null
  bankCbu?: string | null
  bank_cbu?: string | null
  bankHolder?: string | null
  bank_holder?: string | null
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

function toStringOrNull(v: unknown): string | null {
  if (v == null) return null
  if (typeof v !== "string") return null
  return v === "" ? null : v
}

function mapConfig(raw: AdminPaymentMethodConfigRaw): AdminPaymentMethodConfig {
  const rawType = raw.adjustmentType ?? raw.adjustment_type ?? ""
  const adjustmentType: "PERCENT" | "FIXED" =
    rawType === "PERCENT" || rawType === "FIXED" ? rawType : "PERCENT"
  const sortRaw = raw.sortOrder ?? raw.sort_order

  return {
    id: String(raw.id ?? ""),
    paymentMethod: String(raw.paymentMethod ?? raw.payment_method ?? ""),
    label: String(raw.label ?? ""),
    adjustmentType,
    adjustmentValue: parseDecimal(raw.adjustmentValue ?? raw.adjustment_value),
    isSurcharge: toBoolean(raw.isSurcharge ?? raw.is_surcharge, false),
    isActive: toBoolean(raw.isActive ?? raw.is_active, true),
    instructions: toStringOrNull(raw.instructions),
    sortOrder: typeof sortRaw === "number" && Number.isFinite(sortRaw) ? sortRaw : 0,
    bankAlias: toStringOrNull(raw.bankAlias ?? raw.bank_alias),
    bankCbu: toStringOrNull(raw.bankCbu ?? raw.bank_cbu),
    bankHolder: toStringOrNull(raw.bankHolder ?? raw.bank_holder),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ""),
  }
}

type FetchResponse =
  | AdminPaymentMethodConfigRaw[]
  | {
      configs?: AdminPaymentMethodConfigRaw[]
      items?: AdminPaymentMethodConfigRaw[]
      catalog?: unknown
    }

function extractConfigList(data: FetchResponse): AdminPaymentMethodConfigRaw[] {
  if (Array.isArray(data)) return data
  return data.configs ?? data.items ?? []
}

/** Vacío → `null` (limpia en el backend). */
export function emptyToNull(value: string): string | null {
  const t = value.trim()
  return t === "" ? null : t
}

export async function fetchPaymentMethodConfigs(): Promise<AdminPaymentMethodConfig[]> {
  const { data } = await api.get<FetchResponse>(ADMIN_PAYMENT_METHOD_CONFIGS_PATH)
  return extractConfigList(data ?? []).map(mapConfig)
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
