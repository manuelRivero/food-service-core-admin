export interface DeliveryZone {
  id: string
  name: string
  color: string
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
  createdAt: Date
  updatedAt: Date
}

export interface ZoneFormData {
  name: string
  color: string
}

export const ZONE_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Purple", value: "#a855f7" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Pink", value: "#ec4899" },
  { label: "Yellow", value: "#eab308" },
] as const
