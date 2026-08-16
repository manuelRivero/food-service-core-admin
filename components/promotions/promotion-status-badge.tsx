import { Badge } from "@/components/ui/badge"
import type { PromotionStatus } from "@/lib/requests/promotions"

const VARIANT: Record<
  PromotionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  archived: "destructive",
}

export function PromotionStatusBadge({
  status,
  label,
}: {
  status: PromotionStatus
  label: string
}) {
  return <Badge variant={VARIANT[status] ?? "secondary"}>{label}</Badge>
}
