import { UtensilsCrossed } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PromotionProductPreview } from "@/lib/requests/promotions"

export function PromotionProductAvatars({
  products,
}: {
  products: PromotionProductPreview[]
}) {
  if (products.length === 0) return null
  return (
    <div className="flex -space-x-2">
      {products.slice(0, 4).map((product) => (
        <Avatar
          key={`${product.role}-${product.menuItemId}`}
          className="size-8 border-2 border-background"
        >
          {product.thumbnailUrl ? (
            <AvatarImage src={product.thumbnailUrl} alt={product.name} />
          ) : null}
          <AvatarFallback>
            <UtensilsCrossed className="size-3.5" />
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  )
}
