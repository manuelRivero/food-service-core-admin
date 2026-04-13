import { api } from "@/lib/api"

export const ADMIN_TABLES_PATH = "/admin/tables"

/** Fila tal como la devuelve GET (camelCase). */
export interface AdminTable {
  id: string
  businessId: string
  environmentId: string
  environmentName: string
  name: string
  capacity: number
  isActive: boolean
  createdAt: string
  x: number | null
  y: number | null
  shape: "rect" | string | null
  width: number | null
  height: number | null
  rotation: number | null
}

export interface AdminTablesListResponse {
  items: AdminTable[]
}

export interface CreateAdminTableInput {
  environmentId: string
  name: string
  capacity: number
}

export type PatchAdminTableInput = Partial<{
  name: string
  capacity: number
  isActive: boolean
  x: number
  y: number
  shape: "rect" | null
  width: number | null
  height: number | null
  rotation: number | null
  environmentId: string
}>

interface DeleteAdminTableResponse {
  success?: boolean
  id?: string
}

function mapRow(raw: Record<string, unknown>): AdminTable {
  const shape = raw.shape
  return {
    id: String(raw.id ?? ""),
    businessId: String(raw.businessId ?? raw.business_id ?? ""),
    environmentId: String(raw.environmentId ?? raw.environment_id ?? ""),
    environmentName: String(raw.environmentName ?? raw.environment_name ?? ""),
    name: String(raw.name ?? ""),
    capacity: typeof raw.capacity === "number" ? raw.capacity : Number(raw.capacity) || 0,
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
    x: typeof raw.x === "number" ? raw.x : raw.x == null ? null : Number(raw.x),
    y: typeof raw.y === "number" ? raw.y : raw.y == null ? null : Number(raw.y),
    shape: shape === "rect" || shape === "circle" ? shape : shape == null ? null : String(shape),
    width: typeof raw.width === "number" ? raw.width : raw.width == null ? null : Number(raw.width),
    height:
      typeof raw.height === "number" ? raw.height : raw.height == null ? null : Number(raw.height),
    rotation:
      typeof raw.rotation === "number"
        ? raw.rotation
        : raw.rotation == null
          ? null
          : Number(raw.rotation),
  }
}

export async function fetchAdminTables(): Promise<AdminTable[]> {
  const { data } = await api.get<AdminTablesListResponse | { items?: unknown[] }>(
    ADMIN_TABLES_PATH,
  )
  const items = Array.isArray(data.items) ? data.items : []
  return items.map((row) => mapRow(row as Record<string, unknown>))
}

export async function fetchAdminTableById(id: string): Promise<AdminTable> {
  const { data } = await api.get(ADMIN_TABLES_PATH + `/${encodeURIComponent(id)}`)
  return mapRow(data as Record<string, unknown>)
}

export async function createAdminTable(input: CreateAdminTableInput): Promise<AdminTable> {
  const { data } = await api.post(ADMIN_TABLES_PATH, input)
  return mapRow(data as Record<string, unknown>)
}

export async function patchAdminTable(
  id: string,
  input: PatchAdminTableInput,
): Promise<AdminTable> {
  const { data } = await api.patch(ADMIN_TABLES_PATH + `/${encodeURIComponent(id)}`, input)
  return mapRow(data as Record<string, unknown>)
}

export async function deleteAdminTable(id: string): Promise<void> {
  await api.delete<DeleteAdminTableResponse>(ADMIN_TABLES_PATH + `/${encodeURIComponent(id)}`)
}

/** Modelo de la pantalla de plano (siempre con posición y forma concretas). */
export type UiTableShape = "circle" | "rect"

export interface UiTable {
  id: string
  environmentId: string
  environmentName: string
  name: string
  capacity: number
  isActive: boolean
  createdAt: string
  shape: UiTableShape
  x: number
  y: number
  width?: number
  height?: number
  rotation: number
}

export function adminTableToUi(t: AdminTable): UiTable {
  const shape: UiTableShape = t.shape === "rect" ? "rect" : "circle"
  const x = t.x ?? 80
  const y = t.y ?? 80
  const rotation = Number.isFinite(t.rotation ?? 0) ? (t.rotation as number) : 0
  const width = t.width ?? undefined
  const height = t.height ?? undefined
  return {
    id: t.id,
    environmentId: t.environmentId,
    environmentName: t.environmentName,
    name: t.name,
    capacity: t.capacity,
    isActive: t.isActive,
    createdAt: t.createdAt,
    shape,
    x,
    y,
    rotation,
    ...(shape === "rect"
      ? {
          width: width ?? 100,
          height: height ?? 60,
        }
      : {}),
  }
}

/** Payload para guardar geometría / datos alineados al API. */
export function uiTableToPatch(t: UiTable): PatchAdminTableInput {
  const base: PatchAdminTableInput = {
    name: t.name,
    capacity: t.capacity,
    isActive: t.isActive,
    x: t.x,
    y: t.y,
    rotation: t.rotation,
    shape: t.shape === "rect" ? "rect" : null,
  }
  if (t.shape === "rect") {
    base.width = t.width ?? 100
    base.height = t.height ?? 60
  } else {
    base.width = null
    base.height = null
  }
  return base
}
