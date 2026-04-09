export interface DeliveryZone {
  id: string
  name: string
  color: string
  polygon: GeoJSON.Polygon
  createdAt: string
  updatedAt: string
}

export interface ZoneFormData {
  name: string
  color: string
  polygon: GeoJSON.Polygon | null
}

export const ZONE_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#a855f7" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Pink", value: "#ec4899" },
  { name: "Yellow", value: "#eab308" },
] as const

export const DEFAULT_MAP_CENTER: [number, number] = [19.4326, -99.1332] // Mexico City
export const DEFAULT_MAP_ZOOM = 12
