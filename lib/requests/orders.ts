import { api } from "@/lib/api"
import type { AdminPatchableOrderStatus } from "@/lib/constants/orderWorkflow"
import type { Order, OrderCustomer, OrderLineItem } from "@/lib/data"

/** Relativo a `NEXT_PUBLIC_API` (si ya incluye `/api`, no repetir `/api` en la ruta). */
export const ADMIN_ORDERS_PATH = "/admin/orders"

function parseDecimal(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  const n = parseFloat(String(v).replace(",", "."))
  return Number.isFinite(n) ? n : null
}

/** Valor especial: no se envía `status` al API (todos los estados). */
export const ADMIN_ORDERS_STATUS_ALL = "all" as const

export interface AdminOrdersListParams {
  page: number
  dateFrom: string
  dateTo: string
  customerPhone?: string
  /** Si es `all` u omite, el backend no filtra por estado. */
  status?: string
}

export interface AdminOrdersListResponse {
  total: number
  page: number
  pageSize: number
  totalPages: number
  items: AdminOrderRaw[]
}

export interface AdminOrderMenuItemRaw {
  id: string
  name: string
}

export interface AdminOrderItemRaw {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: string | number
  serves_people: number | null
  menu_item?: AdminOrderMenuItemRaw | null
}

export interface AdminCustomerRaw {
  id: string
  phone_number: string
  name: string | null
}

export interface AdminCustomerAddressRaw {
  id: string
  street_address?: string | null
  apartment?: string | null
  neighborhood?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
  label?: string | null
}

export interface AdminOrderRaw {
  id: string
  business_id: string
  customer_id: string
  conversation_id: string | null
  status: string
  /** Si el backend aún no lo envía, se asume `deferred`. */
  payment_status?: string | null
  currency_code: string
  total_amount: string | number | null
  created_at: string
  customer_address_id: string | null
  delivery_address_snapshot: Record<string, unknown> | null
  customer?: AdminCustomerRaw | null
  customer_address?: AdminCustomerAddressRaw | null
  order_item: AdminOrderItemRaw[]
}

export async function fetchAdminOrderById(id: string) {
  const { data } = await api.get<AdminOrderRaw>(`${ADMIN_ORDERS_PATH}/${id}`)
  return mapAdminOrderToOrder(data)
}

export interface PatchAdminOrderStatusResponseRaw {
  order: AdminOrderRaw
  customerNotified: boolean
  notificationReason?: string
}

export async function patchAdminOrderStatus(
  id: string,
  status: AdminPatchableOrderStatus,
) {
  const { data } = await api.patch<PatchAdminOrderStatusResponseRaw>(
    `${ADMIN_ORDERS_PATH}/${id}/status`,
    { status },
  )
  return {
    order: mapAdminOrderToOrder(data.order),
    customerNotified: data.customerNotified,
    notificationReason: data.notificationReason,
  }
}

export async function fetchAdminOrders(params: AdminOrdersListParams) {
  const statusParam =
    params.status &&
    params.status !== ADMIN_ORDERS_STATUS_ALL
      ? params.status
      : undefined
  const { data } = await api.get<AdminOrdersListResponse>(ADMIN_ORDERS_PATH, {
    params: {
      page: params.page,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      ...(params.customerPhone?.trim()
        ? { customerPhone: params.customerPhone.trim() }
        : {}),
      ...(statusParam ? { status: statusParam } : {}),
    },
  })
  return data
}

function snapshotFromCustomerAddress(
  addr: AdminCustomerAddressRaw | null | undefined,
): Record<string, unknown> | null {
  if (!addr) return null
  return {
    label: addr.label,
    street_address: addr.street_address,
    apartment: addr.apartment,
    neighborhood: addr.neighborhood,
    city: addr.city,
    postal_code: addr.postal_code,
    country: addr.country,
  }
}

function mapCustomer(raw: AdminOrderRaw): OrderCustomer {
  const c = raw.customer
  if (!c) {
    return { name: null, phoneNumber: "" }
  }
  return {
    name: c.name,
    phoneNumber: c.phone_number ?? "",
  }
}

function mapLineItems(raw: AdminOrderRaw): OrderLineItem[] {
  const list = raw.order_item ?? []
  return list.map((oi) => {
    const unitPrice = parseDecimal(oi.unit_price) ?? 0
    const quantity = oi.quantity
    const lineTotal = Math.round(quantity * unitPrice * 100) / 100
    return {
      id: oi.id,
      menuItemId: oi.menu_item_id ?? oi.menu_item?.id ?? "",
      name: oi.menu_item?.name?.trim() || "Producto sin nombre",
      quantity,
      unitPrice,
      lineTotal,
      servesPeople: oi.serves_people,
    }
  })
}

export function mapAdminOrderToOrder(raw: AdminOrderRaw): Order {
  const delivery =
    raw.delivery_address_snapshot && Object.keys(raw.delivery_address_snapshot).length > 0
      ? raw.delivery_address_snapshot
      : snapshotFromCustomerAddress(raw.customer_address)

  return {
    id: raw.id,
    businessId: raw.business_id,
    customerId: raw.customer_id,
    conversationId: raw.conversation_id,
    status: raw.status,
    paymentStatus: raw.payment_status ?? "deferred",
    currencyCode: raw.currency_code,
    totalAmount: parseDecimal(raw.total_amount),
    createdAt: new Date(raw.created_at),
    customerAddressId: raw.customer_address_id,
    deliveryAddressSnapshot: delivery,
    customer: mapCustomer(raw),
    items: mapLineItems(raw),
  }
}
