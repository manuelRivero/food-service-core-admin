"use client"

import Link from "next/link"

import { PromotionComposer } from "@/components/promotions/promotion-composer"

export default function NewPromotionPage() {
  return (
    <div className="space-y-4">
      <Link
        href="/promotions"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Volver al listado
      </Link>
      <PromotionComposer />
    </div>
  )
}
