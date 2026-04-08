import { api } from "@/lib/api"
import type { MenuItem } from "@/components/menu-items/types"

export const ADMIN_MENU_ITEMS_PATH = "/admin/menu-items"
export const ADMIN_MENU_CATEGORIES_OPTIONS_PATH = "/admin/menu-categories/options"

export interface FetchAdminMenuItemsParams {
  page?: number
  pageSize?: number
  categoryId?: string
  q?: string
  includeUnavailable?: boolean
}

export interface UpsertAdminMenuItemInput {
  name?: string
  description?: string | null
  categoryId?: string | null
  imageUrl?: string | null
  isAvailable?: boolean
  isFeatured?: boolean
  servesPeople?: number | null
  ingredients?: string | null
  ingredientsNotes?: string | null
  preparation?: string | null
}

interface AdminMenuCategoryRaw {
  id?: string | null
  name?: string | null
}

interface AdminMenuItemRaw {
  id?: string
  name?: string | null
  description?: string | null
  category_id?: string | null
  categoryId?: string | null
  categoryName?: string | null
  category?: {
    id?: string | null
    name?: string | null
  } | null
  menu_category?: AdminMenuCategoryRaw | null
  menuCategory?: AdminMenuCategoryRaw | null
  image?: string | null
  image_url?: string | null
  imageUrl?: string | null
  is_available?: boolean | null
  isAvailable?: boolean | null
  is_featured?: boolean | null
  isFeatured?: boolean | null
  serves_people?: number | null
  servesPeople?: number | null
  ingredients?: string | null
  ingredients_notes?: string | null
  ingredientsNotes?: string | null
  preparation?: string | null
  created_at?: string | null
  createdAt?: string | null
}

interface AdminMenuItemsListResponseRaw {
  items?: AdminMenuItemRaw[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
}

export interface AdminMenuItemsListResponse {
  items: MenuItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface MenuCategoryOptionRaw {
  id?: string
  name?: string
}

interface AdminMenuCategoriesOptionsResponseRaw {
  items?: MenuCategoryOptionRaw[]
}

export interface MenuCategoryOption {
  id: string
  name: string
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value
  return fallback
}

function mapAdminMenuItem(raw: AdminMenuItemRaw): MenuItem {
  const createdAtRaw = raw.createdAt ?? raw.created_at
  const createdAt = createdAtRaw ? new Date(createdAtRaw) : new Date()
  const menuCategory = raw.menuCategory ?? raw.menu_category ?? null
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: toStringOrNull(raw.description),
    categoryId: toStringOrNull(raw.categoryId ?? raw.category_id),
    categoryName: toStringOrNull(raw.categoryName ?? raw.category?.name),
    menuCategoryId: toStringOrNull(menuCategory?.id ?? raw.categoryId ?? raw.category_id),
    menuCategoryName: toStringOrNull(menuCategory?.name),
    imageUrl: toStringOrNull(raw.imageUrl ?? raw.image_url ?? raw.image),
    available: toBoolean(raw.isAvailable ?? raw.is_available, true),
    featured: toBoolean(raw.isFeatured ?? raw.is_featured, false),
    servesPeople:
      typeof (raw.servesPeople ?? raw.serves_people) === "number"
        ? (raw.servesPeople ?? raw.serves_people)
        : null,
    ingredients: toStringOrNull(raw.ingredients),
    ingredientsNotes: toStringOrNull(
      raw.ingredientsNotes ?? raw.ingredients_notes,
    ),
    preparation: toStringOrNull(raw.preparation),
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
  }
}

export async function fetchAdminMenuItems(
  params: FetchAdminMenuItemsParams = {},
): Promise<AdminMenuItemsListResponse> {
  const page = params.page ?? 1
  const pageSize = Math.min(params.pageSize ?? 20, 100)
  const { data } = await api.get<AdminMenuItemsListResponseRaw>(
    ADMIN_MENU_ITEMS_PATH,
    {
      params: {
        page,
        pageSize,
        ...(params.categoryId?.trim()
          ? { categoryId: params.categoryId.trim() }
          : {}),
        ...(params.q?.trim() ? { q: params.q.trim() } : {}),
        ...(typeof params.includeUnavailable === "boolean"
          ? { includeUnavailable: params.includeUnavailable }
          : {}),
      },
    },
  )

  return {
    items: Array.isArray(data.items) ? data.items.map(mapAdminMenuItem) : [],
    total: Number.isFinite(data.total) ? Number(data.total) : 0,
    page: Number.isFinite(data.page) ? Number(data.page) : page,
    pageSize: Number.isFinite(data.pageSize) ? Number(data.pageSize) : pageSize,
    totalPages: Number.isFinite(data.totalPages) ? Number(data.totalPages) : 0,
  }
}

export async function fetchAdminMenuCategoriesOptions(): Promise<
  MenuCategoryOption[]
> {
  const { data } = await api.get<AdminMenuCategoriesOptionsResponseRaw>(
    ADMIN_MENU_CATEGORIES_OPTIONS_PATH,
  )
  return Array.isArray(data.items)
    ? data.items
        .map((it) => ({
          id: typeof it.id === "string" ? it.id : "",
          name: typeof it.name === "string" ? it.name : "",
        }))
        .filter((it) => it.id && it.name)
    : []
}

export async function deleteAdminMenuItem(id: string): Promise<void> {
  await api.delete(`${ADMIN_MENU_ITEMS_PATH}/${id}`)
}

function toApiPayload(input: UpsertAdminMenuItemInput): Record<string, unknown> {
  return {
    ...(input.name != null ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
    ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
    ...(input.servesPeople !== undefined ? { servesPeople: input.servesPeople } : {}),
    ...(input.ingredients !== undefined ? { ingredients: input.ingredients } : {}),
    ...(input.ingredientsNotes !== undefined
      ? { ingredientsNotes: input.ingredientsNotes }
      : {}),
    ...(input.preparation !== undefined ? { preparation: input.preparation } : {}),
  }
}

export async function createAdminMenuItem(
  input: UpsertAdminMenuItemInput,
): Promise<MenuItem> {
  const { data } = await api.post<AdminMenuItemRaw>(
    ADMIN_MENU_ITEMS_PATH,
    toApiPayload(input),
  )
  return mapAdminMenuItem(data)
}

export async function patchAdminMenuItem(
  id: string,
  input: UpsertAdminMenuItemInput,
): Promise<MenuItem> {
  const { data } = await api.patch<AdminMenuItemRaw>(
    `${ADMIN_MENU_ITEMS_PATH}/${id}`,
    toApiPayload(input),
  )
  return mapAdminMenuItem(data)
}
