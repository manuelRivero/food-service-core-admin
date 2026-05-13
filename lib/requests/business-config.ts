import { api } from "@/lib/api"

export const ADMIN_BUSINESS_CONFIG_PATH = "/admin/config"

export interface AdminBusinessConfig {
  bot_enabled: boolean
  allow_human_handoff: boolean
  human_handoff_auto_timeout_minutes: number | null
  send_idle_reminders: boolean
  idle_reminder_minutes: number
  idle_close_minutes: number
  send_order_reminders: boolean
  draft_order_reminder_minutes: number
  draft_order_expire_minutes: number
  reservations_enabled: boolean
  reservation_min_lead_minutes: number
  reservation_max_days_ahead: number
  reservation_default_duration_minutes: number
  reservation_require_confirmation: boolean
  reservation_allow_same_day: boolean
  orders_enabled: boolean
  checkout_enabled: boolean
  /** Si el backend lo expone: retiro en local; condiciona validación de dirección. */
  takeaway_enabled?: boolean
}

export type AdminBusinessConfigPatch = Partial<AdminBusinessConfig>

export async function fetchAdminBusinessConfig(): Promise<AdminBusinessConfig> {
  const { data } = await api.get<AdminBusinessConfig>(ADMIN_BUSINESS_CONFIG_PATH)
  return data
}

export async function upsertAdminBusinessConfig(
  payload: AdminBusinessConfigPatch,
): Promise<AdminBusinessConfig> {
  const { data } = await api.post<AdminBusinessConfig>(
    ADMIN_BUSINESS_CONFIG_PATH,
    payload,
  )
  return data
}

export async function patchAdminBusinessConfig(
  payload: AdminBusinessConfigPatch,
): Promise<AdminBusinessConfig> {
  const { data } = await api.patch<AdminBusinessConfig>(
    ADMIN_BUSINESS_CONFIG_PATH,
    payload,
  )
  return data
}

export async function resetAdminBusinessConfig(): Promise<void> {
  await api.delete(ADMIN_BUSINESS_CONFIG_PATH)
}
