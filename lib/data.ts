export type OrderStatus = "pending" | "processing" | "completed" | "cancelled"

export interface Order {
  id: string
  customerName: string
  status: OrderStatus
  total: number
  createdAt: Date
}

export type ReservationStatus = "pending" | "confirmed" | "cancelled"

export interface Reservation {
  id: string
  customerName: string
  date: Date
  time: string
  guests: number
  status: ReservationStatus
}

// Mock orders data
export const orders: Order[] = [
  {
    id: "ORD-001",
    customerName: "John Smith",
    status: "completed",
    total: 125.00,
    createdAt: new Date("2026-04-01"),
  },
  {
    id: "ORD-002",
    customerName: "Sarah Johnson",
    status: "processing",
    total: 89.50,
    createdAt: new Date("2026-04-02"),
  },
  {
    id: "ORD-003",
    customerName: "Mike Brown",
    status: "pending",
    total: 245.00,
    createdAt: new Date("2026-04-03"),
  },
  {
    id: "ORD-004",
    customerName: "Emily Davis",
    status: "completed",
    total: 67.25,
    createdAt: new Date("2026-04-03"),
  },
  {
    id: "ORD-005",
    customerName: "Alex Wilson",
    status: "cancelled",
    total: 190.00,
    createdAt: new Date("2026-04-04"),
  },
  {
    id: "ORD-006",
    customerName: "Jessica Lee",
    status: "processing",
    total: 312.50,
    createdAt: new Date("2026-04-04"),
  },
  {
    id: "ORD-007",
    customerName: "David Chen",
    status: "pending",
    total: 78.00,
    createdAt: new Date("2026-04-05"),
  },
  {
    id: "ORD-008",
    customerName: "Lisa Wang",
    status: "completed",
    total: 156.75,
    createdAt: new Date("2026-04-05"),
  },
]

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
