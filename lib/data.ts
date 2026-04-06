/**
 * Tipos alineados al esquema Prisma: `orders`, `order_item`, `customer`, `currency`.
 * El API puede enviar snake_case; normalízalo a camelCase antes de pasar a la UI.
 */

/** Estado del pedido (`orders.status` en BD: string libre; default "draft"). */
export type OrderStatus = string

export interface OrderCustomer {
  /** `customer.name` (nullable en BD) */
  name: string | null
  /** `customer.phone_number` */
  phoneNumber: string
}

/** `order_item` + nombre resuelto de `menu_item` */
export interface OrderLineItem {
  id: string
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  /** Cantidad × unit_price (no está persistido como tal en BD). */
  lineTotal: number
  /** `order_item.serves_people` */
  servesPeople?: number | null
}

/** Snapshot JSON (`orders.delivery_address_snapshot`) — claves habituales de `customer_address` */
export type DeliveryAddressSnapshot = Record<string, unknown>

export interface Order {
  id: string
  businessId: string
  customerId: string
  conversationId: string | null
  /** Logística / cocina / entrega (`OrderStatus` en backend). */
  status: OrderStatus
  /** Cobro acordado o registrado (`OrderPaymentStatus`); independiente de `status`. */
  paymentStatus: string
  currencyCode: string
  totalAmount: number | null
  createdAt: Date
  customerAddressId: string | null
  deliveryAddressSnapshot: DeliveryAddressSnapshot | null
  customer: OrderCustomer
  items: OrderLineItem[]
}

export function orderCustomerLabel(c: OrderCustomer): string {
  const n = c.name?.trim()
  if (n) return n
  return c.phoneNumber
}

export function formatShortOrderId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…`
}

export function formatOrderMoney(
  amount: number | null,
  currencyCode: string,
): string {
  if (amount == null) return "—"
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currencyCode,
    }).format(amount)
  } catch {
    return `${amount} ${currencyCode}`
  }
}

/** Texto legible a partir de `delivery_address_snapshot` */
export function summarizeDeliverySnapshot(
  snapshot: DeliveryAddressSnapshot | null,
): string | null {
  if (!snapshot || typeof snapshot !== "object") return null
  const o = snapshot as Record<string, unknown>
  const parts: string[] = []
  if (typeof o.label === "string" && o.label) parts.push(o.label)
  if (typeof o.street === "string" && o.street) parts.push(o.street)
  if (typeof o.street_address === "string" && o.street_address)
    parts.push(o.street_address)
  if (typeof o.apartment === "string" && o.apartment)
    parts.push(`Depto ${o.apartment}`)
  if (typeof o.neighborhood === "string" && o.neighborhood)
    parts.push(o.neighborhood)
  if (typeof o.city === "string" && o.city) parts.push(o.city)
  if (typeof o.postal_code === "string" && o.postal_code)
    parts.push(`CP ${o.postal_code}`)
  if (typeof o.country === "string" && o.country) parts.push(o.country)
  if (
    typeof o.delivery_instructions === "string" &&
    o.delivery_instructions
  ) {
    parts.push(`Indicaciones: ${o.delivery_instructions}`)
  }
  return parts.length ? parts.join(" · ") : null
}

function line(
  id: string,
  menuItemId: string,
  name: string,
  quantity: number,
  unitPrice: number,
  servesPeople?: number | null,
): OrderLineItem {
  const lineTotal = Math.round(quantity * unitPrice * 100) / 100
  return { id, menuItemId, name, quantity, unitPrice, lineTotal, servesPeople }
}

const MOCK_BUSINESS_ID = "a0000000-0000-4000-8000-000000000001"

// Mock orders (UUIDs coherentes con @db.Uuid)
export const orders: Order[] = [
  {
    id: "11111111-1111-4111-8111-111111111101",
    businessId: MOCK_BUSINESS_ID,
    customerId: "c0000001-0000-4000-8000-000000000001",
    conversationId: "f0000001-0000-4000-8000-000000000001",
    status: "delivered",
    paymentStatus: "paid",
    currencyCode: "ARS",
    totalAmount: 125.0,
    createdAt: new Date("2026-04-01T12:00:00.000Z"),
    customerAddressId: "ca000001-0000-4000-8000-000000000001",
    deliveryAddressSnapshot: {
      label: "Casa",
      street_address: "Av. Corrientes 1234",
      apartment: "4B",
      neighborhood: "San Nicolás",
      city: "CABA",
      postal_code: "C1043",
      country: "AR",
      delivery_instructions: "Timbre rojo",
    },
    customer: { name: "John Smith", phoneNumber: "+5491112345678" },
    items: [
      line(
        "oi101",
        "m0000001-0000-4000-8000-000000000001",
        "Caesar Salad",
        2,
        12.5,
        null,
      ),
      line(
        "oi102",
        "m0000002-0000-4000-8000-000000000002",
        "Grilled Salmon",
        1,
        35.0,
        2,
      ),
      line(
        "oi103",
        "m0000003-0000-4000-8000-000000000003",
        "House Red Wine (750ml)",
        1,
        40.0,
        null,
      ),
      line(
        "oi104",
        "m0000004-0000-4000-8000-000000000004",
        "Tiramisu",
        2,
        12.5,
        null,
      ),
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    businessId: MOCK_BUSINESS_ID,
    customerId: "c0000002-0000-4000-8000-000000000002",
    conversationId: "f0000002-0000-4000-8000-000000000002",
    status: "preparing",
    paymentStatus: "deferred",
    currencyCode: "ARS",
    totalAmount: 89.5,
    createdAt: new Date("2026-04-02T14:30:00.000Z"),
    customerAddressId: null,
    deliveryAddressSnapshot: null,
    customer: { name: "Sarah Johnson", phoneNumber: "+5491198765432" },
    items: [
      line("oi201", "m0000005-0000-4000-8000-000000000005", "Margherita Pizza", 1, 30.0, 2),
      line("oi202", "m0000006-0000-4000-8000-000000000006", "BBQ Ribs (half rack)", 1, 29.5, 2),
      line("oi203", "m0000007-0000-4000-8000-000000000007", "Garlic Bread & dips combo", 1, 30.0, null),
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    businessId: MOCK_BUSINESS_ID,
    customerId: "c0000003-0000-4000-8000-000000000003",
    conversationId: null,
    status: "confirmed",
    paymentStatus: "unpaid",
    currencyCode: "ARS",
    totalAmount: 245.0,
    createdAt: new Date("2026-04-03T20:15:00.000Z"),
    customerAddressId: "ca000003-0000-4000-8000-000000000003",
    deliveryAddressSnapshot: {
      street_address: "Av. Santa Fe 4500",
      city: "CABA",
      label: "Trabajo",
    },
    customer: { name: null, phoneNumber: "+549115551234" },
    items: [
      line("oi301", "m0000008-0000-4000-8000-000000000008", "Chef tasting menu", 2, 85.0, 2),
      line("oi302", "m0000009-0000-4000-8000-000000000009", "Wine pairing", 2, 35.0, 2),
      line("oi303", "m0000010-0000-4000-8000-000000000010", "Espresso", 2, 2.5, null),
    ],
  },
  {
    id: "44444444-4444-4444-8444-444444444404",
    businessId: MOCK_BUSINESS_ID,
    customerId: "c0000004-0000-4000-8000-000000000004",
    conversationId: "f0000004-0000-4000-8000-000000000004",
    status: "delivered",
    paymentStatus: "paid",
    currencyCode: "ARS",
    totalAmount: 67.25,
    createdAt: new Date("2026-04-03T19:00:00.000Z"),
    customerAddressId: null,
    deliveryAddressSnapshot: null,
    customer: { name: "Emily Davis", phoneNumber: "+549114442222" },
    items: [
      line("oi401", "m0000011-0000-4000-8000-000000000011", "Chicken Tikka Masala", 1, 18.5, null),
      line("oi402", "m0000012-0000-4000-8000-000000000012", "Basmati Rice", 1, 4.0, null),
      line("oi403", "m0000013-0000-4000-8000-000000000013", "Naan bread", 2, 3.75, null),
      line("oi404", "m0000014-0000-4000-8000-000000000014", "Mango Lassi", 2, 5.5, null),
      line("oi405", "m0000015-0000-4000-8000-000000000015", "Gulab Jamun", 1, 26.25, null),
    ],
  },
  {
    id: "55555555-5555-4555-8555-555555555505",
    businessId: MOCK_BUSINESS_ID,
    customerId: "c0000005-0000-4000-8000-000000000005",
    conversationId: null,
    status: "cancelled",
    paymentStatus: "deferred",
    currencyCode: "ARS",
    totalAmount: 190.0,
    createdAt: new Date("2026-04-04T10:00:00.000Z"),
    customerAddressId: "ca000005-0000-4000-8000-000000000005",
    deliveryAddressSnapshot: {
      street_address: "Av. Cabildo 2100",
      neighborhood: "Belgrano",
      city: "CABA",
    },
    customer: { name: "Alex Wilson", phoneNumber: "+549113334444" },
    items: [
      line("oi501", "m0000016-0000-4000-8000-000000000016", "Ribeye Steak (16oz)", 2, 42.0, 2),
      line("oi502", "m0000017-0000-4000-8000-000000000017", "Loaded Baked Potato", 2, 15.0, null),
      line("oi503", "m0000018-0000-4000-8000-000000000018", "Caesar Side Salad", 2, 20.0, null),
      line("oi504", "m0000019-0000-4000-8000-000000000019", "Old Fashioned cocktail", 2, 18.0, null),
    ],
  },
  {
    id: "66666666-6666-4666-8666-666666666606",
    businessId: MOCK_BUSINESS_ID,
    customerId: "c0000006-0000-4000-8000-000000000006",
    conversationId: "f0000006-0000-4000-8000-000000000006",
    status: "preparing",
    paymentStatus: "deferred",
    currencyCode: "ARS",
    totalAmount: 312.5,
    createdAt: new Date("2026-04-04T21:45:00.000Z"),
    customerAddressId: null,
    deliveryAddressSnapshot: null,
    customer: { name: "Jessica Lee", phoneNumber: "+549116667777" },
    items: [
      line("oi601", "m0000020-0000-4000-8000-000000000020", "Seafood tower (large)", 1, 100.0, 4),
      line("oi602", "m0000021-0000-4000-8000-000000000021", "Grill surf & turf bundle", 1, 100.0, 4),
      line("oi603", "m0000022-0000-4000-8000-000000000022", "Desserts & beverages bundle", 1, 112.5, null),
    ],
  },
  {
    id: "77777777-7777-4777-8777-777777777707",
    businessId: MOCK_BUSINESS_ID,
    customerId: "c0000007-0000-4000-8000-000000000007",
    conversationId: null,
    status: "draft",
    paymentStatus: "deferred",
    currencyCode: "ARS",
    totalAmount: 78.0,
    createdAt: new Date("2026-04-05T13:20:00.000Z"),
    customerAddressId: null,
    deliveryAddressSnapshot: null,
    customer: { name: "David Chen", phoneNumber: "+549118889999" },
    items: [
      line("oi701", "m0000023-0000-4000-8000-000000000023", "Veggie Burger", 2, 18.0, null),
      line("oi702", "m0000024-0000-4000-8000-000000000024", "Sweet Potato Fries", 2, 7.0, null),
      line("oi703", "m0000025-0000-4000-8000-000000000025", "Green Smoothie", 2, 10.0, null),
      line("oi704", "m0000026-0000-4000-8000-000000000026", "Brownie", 1, 8.0, null),
    ],
  },
  {
    id: "88888888-8888-4888-8888-888888888808",
    businessId: MOCK_BUSINESS_ID,
    customerId: "c0000008-0000-4000-8000-000000000008",
    conversationId: "f0000008-0000-4000-8000-000000000008",
    status: "delivered",
    paymentStatus: "paid",
    currencyCode: "ARS",
    totalAmount: 156.75,
    createdAt: new Date("2026-04-05T22:00:00.000Z"),
    customerAddressId: "ca000008-0000-4000-8000-000000000008",
    deliveryAddressSnapshot: {
      label: "Departamento",
      street_address: "Juramento 3200",
      apartment: "12A",
      city: "CABA",
    },
    customer: { name: "Lisa Wang", phoneNumber: "+549112223344" },
    items: [
      line("oi801", "m0000027-0000-4000-8000-000000000027", "Sushi combo (chef choice)", 2, 62.0, 2),
      line("oi802", "m0000028-0000-4000-8000-000000000028", "Miso Soup", 2, 4.5, null),
      line("oi803", "m0000029-0000-4000-8000-000000000029", "Edamame", 2, 5.0, null),
      line("oi804", "m0000030-0000-4000-8000-000000000030", "Green Tea Ice Cream", 2, 6.875, null),
    ],
  },
]

/** Valores habituales del API: pending, confirmed, cancelled, etc. */
export type ReservationStatus = string

export interface Reservation {
  id: string
  customerName: string
  date: Date
  time: string
  guests: number
  status: ReservationStatus
  /** Mesas y ambiente resumidos desde `reservation_table`. */
  tablesLabel?: string | null
  notes?: string | null
}

// Mock reservations data
export const reservations: Reservation[] = [
  {
    id: "RES-001",
    customerName: "Robert Miller",
    date: new Date("2026-04-06"),
    time: "18:00",
    guests: 4,
    status: "confirmed",
  },
  {
    id: "RES-002",
    customerName: "Amanda Taylor",
    date: new Date("2026-04-06"),
    time: "19:30",
    guests: 2,
    status: "pending",
  },
  {
    id: "RES-003",
    customerName: "Chris Anderson",
    date: new Date("2026-04-07"),
    time: "20:00",
    guests: 6,
    status: "confirmed",
  },
  {
    id: "RES-004",
    customerName: "Rachel Green",
    date: new Date("2026-04-07"),
    time: "18:30",
    guests: 3,
    status: "cancelled",
  },
  {
    id: "RES-005",
    customerName: "Tom Harris",
    date: new Date("2026-04-08"),
    time: "19:00",
    guests: 5,
    status: "pending",
  },
  {
    id: "RES-006",
    customerName: "Karen White",
    date: new Date("2026-04-08"),
    time: "20:30",
    guests: 2,
    status: "confirmed",
  },
  {
    id: "RES-007",
    customerName: "James Clark",
    date: new Date("2026-04-09"),
    time: "18:00",
    guests: 8,
    status: "pending",
  },
  {
    id: "RES-008",
    customerName: "Nicole Young",
    date: new Date("2026-04-09"),
    time: "19:00",
    guests: 4,
    status: "confirmed",
  },
]
