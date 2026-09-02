import { api } from "@/lib/api"

export const ADMIN_BUSINESS_USERS_PATH = "/admin/business-users"

export const ASSIGNABLE_BUSINESS_USER_ROLES = [
  "OWNER",
  "ADMIN",
  "STAFF",
  "DELIVERY",
] as const

export type AssignableBusinessUserRole =
  (typeof ASSIGNABLE_BUSINESS_USER_ROLES)[number]

export type BusinessUserRole =
  | AssignableBusinessUserRole
  | "SUPER_ADMIN"
  | "MANAGER"
  | "UNKNOWN"

export interface BusinessUser {
  id: string
  userId: string
  email: string
  name: string | null
  role: BusinessUserRole
  createdAt: string
  userCreatedAt: string
}

export interface CreateBusinessUserPayload {
  email: string
  name: string
  role: AssignableBusinessUserRole
  password?: string
}

export interface UpdateBusinessUserPayload {
  name?: string
  role?: AssignableBusinessUserRole
  password?: string
}

interface BusinessUserRaw {
  id?: string
  userId?: string
  user_id?: string
  email?: string | null
  name?: string | null
  role?: string | null
  createdAt?: string | null
  created_at?: string | null
  userCreatedAt?: string | null
  user_created_at?: string | null
}

type ListResponse =
  | BusinessUserRaw[]
  | {
      items?: BusinessUserRaw[]
      users?: BusinessUserRaw[]
    }

function toStringOrNull(v: unknown): string | null {
  if (v == null) return null
  if (typeof v !== "string") return null
  const t = v.trim()
  return t === "" ? null : t
}

function mapBusinessUser(raw: BusinessUserRaw): BusinessUser {
  const roleRaw = String(raw.role ?? "UNKNOWN").toUpperCase()
  const role = (
    ASSIGNABLE_BUSINESS_USER_ROLES as readonly string[]
  ).includes(roleRaw)
    ? (roleRaw as AssignableBusinessUserRole)
    : (roleRaw as BusinessUserRole)

  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? raw.user_id ?? ""),
    email: String(raw.email ?? ""),
    name: toStringOrNull(raw.name),
    role,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    userCreatedAt: String(raw.userCreatedAt ?? raw.user_created_at ?? ""),
  }
}

function extractList(data: ListResponse | null | undefined): BusinessUserRaw[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.items ?? data.users ?? []
}

/** Trim + colapsa espacios múltiples (misma normalización que el backend). */
export function normalizeBusinessUserName(name: string): string {
  return name.trim().replace(/\s+/g, " ")
}

export interface FetchBusinessUsersParams {
  role?: AssignableBusinessUserRole
}

export async function fetchBusinessUsers(
  params?: FetchBusinessUsersParams,
): Promise<BusinessUser[]> {
  const { data } = await api.get<ListResponse>(ADMIN_BUSINESS_USERS_PATH, {
    ...(params?.role ? { params: { role: params.role } } : {}),
  })
  return extractList(data).map(mapBusinessUser)
}

export async function fetchDeliveryBusinessUsers(): Promise<BusinessUser[]> {
  return fetchBusinessUsers({ role: "DELIVERY" })
}

export async function fetchBusinessUserById(id: string): Promise<BusinessUser> {
  const { data } = await api.get<BusinessUserRaw>(
    `${ADMIN_BUSINESS_USERS_PATH}/${encodeURIComponent(id)}`,
  )
  return mapBusinessUser(data)
}

export async function createBusinessUser(
  payload: CreateBusinessUserPayload,
): Promise<BusinessUser> {
  const { data } = await api.post<BusinessUserRaw>(
    ADMIN_BUSINESS_USERS_PATH,
    {
      ...payload,
      email: payload.email.trim().toLowerCase(),
      name: normalizeBusinessUserName(payload.name),
    },
  )
  return mapBusinessUser(data)
}

export async function updateBusinessUser(
  id: string,
  payload: UpdateBusinessUserPayload,
): Promise<BusinessUser> {
  const body: UpdateBusinessUserPayload = {}
  if (payload.name !== undefined) {
    body.name = normalizeBusinessUserName(payload.name)
  }
  if (payload.role !== undefined) body.role = payload.role
  if (payload.password !== undefined && payload.password.trim() !== "") {
    body.password = payload.password
  }

  const { data } = await api.patch<BusinessUserRaw>(
    `${ADMIN_BUSINESS_USERS_PATH}/${encodeURIComponent(id)}`,
    body,
  )
  return mapBusinessUser(data)
}

export async function deleteBusinessUser(id: string): Promise<void> {
  await api.delete(`${ADMIN_BUSINESS_USERS_PATH}/${encodeURIComponent(id)}`)
}
