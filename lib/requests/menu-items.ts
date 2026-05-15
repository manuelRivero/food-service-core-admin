import { api } from "@/lib/api"
import type { MenuItem } from "@/components/menu-items/types"

export const ADMIN_MENU_ITEMS_PATH = "/admin/menu-items"
export const ADMIN_MENU_CATEGORIES_OPTIONS_PATH = "/admin/menu-categories/options"
export const ADMIN_MENU_CATEGORY_TAGS_OPTIONS_PATH =
  "/admin/menu-category-tags/options"

export interface FetchAdminMenuItemsParams {
  /** Si es `true`, envía `all=true` y omite paginación en la API. */
  all?: boolean
  page?: number
  pageSize?: number
  categoryId?: string
  q?: string
  includeUnavailable?: boolean
}

export interface UpsertAdminMenuItemPriceInput {
  amount: number
  currencyCode: string
}

export interface UpsertAdminMenuItemInput {
  name?: string
  description?: string | null
  categoryId?: string | null
  categoryTag?: string | null
  sectionId?: string | null
  image?: string | null
  isAvailable?: boolean
  isFeatured?: boolean
  servesPeople?: number | null
  ingredients?: string | null
  ingredientsNotes?: string | null
  preparation?: string | null
  price?: UpsertAdminMenuItemPriceInput | null
}

interface AdminMenuCategoryRaw {
  id?: string | null
  name?: string | null
  tag?: string | null
  category_tag?: string | null
  categoryTag?: string | null
}

interface AdminMenuItemPriceRaw {
  id?: string
  currencyCode?: string
  currency_code?: string
  amount?: string | number | null
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
  menu_category_id?: string | null
  menuCategoryId?: string | null
  menu_category_name?: string | null
  menuCategoryName?: string | null
  category_tag?: string | null
  categoryTag?: string | null
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
  price?: AdminMenuItemPriceRaw | string | number | null
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
  tag?: string
  category_tag?: string
  categoryTag?: string
}

interface AdminMenuCategoriesOptionsResponseRaw {
  items?: MenuCategoryOptionRaw[]
}

export interface MenuCategoryOption {
  id: string
  name: string
  tag?: string | null
}

interface MenuCategoryTagOptionRaw {
  id?: string
  name?: string
}

interface AdminMenuCategoryTagsOptionsResponseRaw {
  items?: MenuCategoryTagOptionRaw[]
}

/** id = MenuCategoryTag (p. ej. STARTER), name = etiqueta en español */
export interface MenuCategoryTagOption {
  id: string
  name: string
}

function normalizeCategoryName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function inferCategoryTagFromName(name: string | null | undefined): string | null {
  const n = normalizeCategoryName(name)
  if (!n) return null
  if (n.includes("entrada")) return "STARTER"
  if (n.includes("plato")) return "MAIN"
  if (n.includes("bebida")) return "DRINK"
  if (n.includes("postre")) return "DESSERT"
  return null
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value
  return fallback
}

function parseDecimal(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  const n = parseFloat(String(v).replace(",", "."))
  return Number.isFinite(n) ? n : null
}

function resolveMenuItemPrice(raw: AdminMenuItemRaw): {
  price: number | null
  currencyCode: string | null
} {
  const priceField = raw.price
  if (priceField && typeof priceField === "object") {
    return {
      price: parseDecimal(priceField.amount),
      currencyCode: toStringOrNull(
        priceField.currencyCode ?? priceField.currency_code,
      ),
    }
  }
  return {
    price: parseDecimal(
      typeof priceField === "string" || typeof priceField === "number"
        ? priceField
        : null,
    ),
    currencyCode: null,
  }
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
    categoryName: toStringOrNull(
      raw.categoryName ?? menuCategory?.name ?? raw.category?.name,
    ),
    menuCategoryId: toStringOrNull(
      menuCategory?.id ?? raw.menuCategoryId ?? raw.menu_category_id,
    ),
    menuCategoryName: toStringOrNull(
      menuCategory?.name ?? raw.menuCategoryName ?? raw.menu_category_name,
    ),
    menuCategoryTag: toStringOrNull(
      raw.categoryTag ??
        raw.category_tag ??
        menuCategory?.categoryTag ??
        menuCategory?.category_tag ??
        menuCategory?.tag ??
        inferCategoryTagFromName(
          menuCategory?.name ?? raw.menuCategoryName ?? raw.menu_category_name,
        ),
    ),
    imageUrl: toStringOrNull(raw.imageUrl ?? raw.image_url ?? raw.image),
    available: toBoolean(raw.isAvailable ?? raw.is_available, true),
    featured: toBoolean(raw.isFeatured ?? raw.is_featured, false),
    ...resolveMenuItemPrice(raw),
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
  const useAll = params.all === true
  const page = params.page ?? 1
  const pageSize = Math.min(params.pageSize ?? 20, 100)

  const common = {
    ...(params.categoryId?.trim()
      ? { categoryId: params.categoryId.trim() }
      : {}),
    ...(params.q?.trim() ? { q: params.q.trim() } : {}),
    ...(typeof params.includeUnavailable === "boolean"
      ? { includeUnavailable: params.includeUnavailable }
      : {}),
  }

  const { data } = await api.get<AdminMenuItemsListResponseRaw>(
    ADMIN_MENU_ITEMS_PATH,
    {
      params: useAll
        ? { all: true, ...common }
        : { page, pageSize, ...common },
    },
  )

  const items = Array.isArray(data.items) ? data.items.map(mapAdminMenuItem) : []
  const resolvedTotal = Number.isFinite(data.total)
    ? Number(data.total)
    : useAll
      ? items.length
      : 0

  return {
    items,
    total: resolvedTotal,
    page: Number.isFinite(data.page) ? Number(data.page) : page,
    pageSize: Number.isFinite(data.pageSize)
      ? Number(data.pageSize)
      : useAll
        ? items.length
        : pageSize,
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
          tag:
            typeof it.categoryTag === "string"
              ? it.categoryTag
              : typeof it.category_tag === "string"
                ? it.category_tag
                : typeof it.tag === "string"
                  ? it.tag
                  : inferCategoryTagFromName(it.name),
        }))
        .filter((it) => it.id && it.name)
    : []
}

export async function fetchAdminMenuCategoryTagsOptions(): Promise<
  MenuCategoryTagOption[]
> {
  const { data } = await api.get<AdminMenuCategoryTagsOptionsResponseRaw>(
    ADMIN_MENU_CATEGORY_TAGS_OPTIONS_PATH,
  )
  return Array.isArray(data.items)
    ? data.items
        .map((it) => ({
          id: typeof it.id === "string" ? it.id.trim().toUpperCase() : "",
          name: typeof it.name === "string" ? it.name : "",
        }))
        .filter((it) => it.id && it.name)
    : []
}

export async function deleteAdminMenuItem(id: string): Promise<void> {
  await api.delete(`${ADMIN_MENU_ITEMS_PATH}/${id}`)
}

export async function fetchAdminMenuItemById(id: string): Promise<MenuItem> {
  const { data } = await api.get<AdminMenuItemRaw>(`${ADMIN_MENU_ITEMS_PATH}/${id}`)
  return mapAdminMenuItem(data)
}

function toApiPayload(input: UpsertAdminMenuItemInput): Record<string, unknown> {
  return {
    ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    ...(input.categoryTag !== undefined ? { categoryTag: input.categoryTag } : {}),
    ...(input.sectionId !== undefined ? { sectionId: input.sectionId } : {}),
    ...(input.name != null ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.ingredients !== undefined ? { ingredients: input.ingredients } : {}),
    ...(input.preparation !== undefined ? { preparation: input.preparation } : {}),
    ...(input.servesPeople !== undefined ? { servesPeople: input.servesPeople } : {}),
    ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
    ...(input.image !== undefined ? { image: input.image } : {}),
    ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
    ...(input.ingredientsNotes !== undefined
      ? { ingredientsNotes: input.ingredientsNotes }
      : {}),
    ...(input.price != null ? { price: input.price } : {}),
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
