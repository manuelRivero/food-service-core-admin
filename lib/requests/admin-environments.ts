import { api } from "@/lib/api"

export const ADMIN_ENVIRONMENTS_PATH = "/admin/environments"

export interface AdminEnvironment {
  id: string
  businessId: string
  name: string
  description: string | null
  isOutdoor: boolean
  isActive: boolean
  createdAt: string | null
}

export interface AdminEnvironmentsListResponse {
  items: AdminEnvironment[]
}

export interface CreateAdminEnvironmentInput {
  name: string
  description?: string | null
  isOutdoor?: boolean
  isActive?: boolean
}

function mapEnvironment(raw: Record<string, unknown>): AdminEnvironment {
  return {
    id: String(raw.id ?? ""),
    businessId: String(raw.businessId ?? raw.business_id ?? ""),
    name: String(raw.name ?? ""),
    description:
      raw.description === null || raw.description === undefined
        ? null
        : String(raw.description),
    isOutdoor: Boolean(raw.isOutdoor ?? raw.is_outdoor ?? false),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    createdAt:
      raw.createdAt == null && raw.created_at == null
        ? null
        : String(raw.createdAt ?? raw.created_at ?? ""),
  }
}

export async function fetchAdminEnvironments(): Promise<AdminEnvironment[]> {
  const { data } = await api.get<AdminEnvironmentsListResponse | { items?: unknown[] }>(
    ADMIN_ENVIRONMENTS_PATH,
  )
  const items = Array.isArray(data.items) ? data.items : []
  return items.map((row) => mapEnvironment(row as Record<string, unknown>))
}

export async function createAdminEnvironment(
  input: CreateAdminEnvironmentInput,
): Promise<AdminEnvironment> {
  const name = input.name.trim()
  const body: {
    name: string
    description: string | null
    isOutdoor: boolean
    isActive: boolean
  } = {
    name,
    description: null,
    isOutdoor: input.isOutdoor ?? false,
    isActive: input.isActive ?? true,
  }
  if (input.description != null) {
    const t = String(input.description).trim()
    body.description = t === "" ? null : t
  }
  const { data } = await api.post(ADMIN_ENVIRONMENTS_PATH, body)
  return mapEnvironment(data as Record<string, unknown>)
}
