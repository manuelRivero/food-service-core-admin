import { api } from "@/lib/api"

export const ADMIN_RESERVATION_SLOTS_PATH = "/admin/reservation-slots"

export interface AdminReservationSlot {
  id: string
  businessId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  capacityLimit: number | null
  isActive: boolean
  createdAt: string
}

export type AdminReservationSlotCreateInput = {
  dayOfWeek: number
  startTime: string
  endTime: string
  capacityLimit?: number | null
  isActive?: boolean
}

export type AdminReservationSlotPatchInput = Partial<{
  dayOfWeek: number
  startTime: string
  endTime: string
  capacityLimit: number | null
  isActive: boolean
}>

type ListResponse = { items?: unknown[] }
type DeleteResponse = { success?: boolean; id?: string }

function mapRow(raw: Record<string, unknown>): AdminReservationSlot {
  const capacityRaw = raw.capacityLimit ?? raw.capacity_limit
  return {
    id: String(raw.id ?? ""),
    businessId: String(raw.businessId ?? raw.business_id ?? ""),
    dayOfWeek: Number(raw.dayOfWeek ?? raw.day_of_week ?? 0),
    startTime: String(raw.startTime ?? raw.start_time ?? "00:00"),
    endTime: String(raw.endTime ?? raw.end_time ?? "00:00"),
    capacityLimit:
      capacityRaw == null || capacityRaw === ""
        ? null
        : Number(capacityRaw),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  }
}

export async function fetchAdminReservationSlots(): Promise<AdminReservationSlot[]> {
  const { data } = await api.get<ListResponse | unknown[]>(ADMIN_RESERVATION_SLOTS_PATH)
  const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []
  return items.map((row) => mapRow(row as Record<string, unknown>))
}

export async function createAdminReservationSlot(
  input: AdminReservationSlotCreateInput,
): Promise<AdminReservationSlot> {
  const payload: Record<string, unknown> = {
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    isActive: input.isActive ?? true,
  }
  if (input.capacityLimit !== undefined) {
    payload.capacityLimit = input.capacityLimit
  }

  const { data } = await api.post(ADMIN_RESERVATION_SLOTS_PATH, payload)
  return mapRow(data as Record<string, unknown>)
}

export async function fetchAdminReservationSlotById(
  id: string,
): Promise<AdminReservationSlot> {
  const { data } = await api.get(`${ADMIN_RESERVATION_SLOTS_PATH}/${encodeURIComponent(id)}`)
  return mapRow(data as Record<string, unknown>)
}

export async function patchAdminReservationSlot(
  id: string,
  input: AdminReservationSlotPatchInput,
): Promise<AdminReservationSlot> {
  const payload: Record<string, unknown> = {}
  if (input.dayOfWeek != null) payload.dayOfWeek = input.dayOfWeek
  if (input.startTime != null) payload.startTime = input.startTime
  if (input.endTime != null) payload.endTime = input.endTime
  if (input.capacityLimit !== undefined) payload.capacityLimit = input.capacityLimit
  if (input.isActive != null) payload.isActive = input.isActive

  const { data } = await api.patch(
    `${ADMIN_RESERVATION_SLOTS_PATH}/${encodeURIComponent(id)}`,
    payload,
  )
  return mapRow(data as Record<string, unknown>)
}

export async function deleteAdminReservationSlot(
  id: string,
): Promise<{ success: boolean; id: string }> {
  const { data } = await api.delete<DeleteResponse>(
    `${ADMIN_RESERVATION_SLOTS_PATH}/${encodeURIComponent(id)}`,
  )
  return {
    success: Boolean(data?.success),
    id: String(data?.id ?? id),
  }
}
