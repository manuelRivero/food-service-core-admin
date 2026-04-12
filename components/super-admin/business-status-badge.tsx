"use client"

import { Badge } from "@/components/ui/badge"
import type { BusinessStatus } from "./types"

interface BusinessStatusBadgeProps {
  status: BusinessStatus
}

export function BusinessStatusBadge({ status }: BusinessStatusBadgeProps) {
  const variants: Record<BusinessStatus, { className: string }> = {
    Active: {
      className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    },
    Blocked: {
      className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    },
    Expired: {
      className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    },
  }

  return (
    <Badge variant="outline" className={variants[status].className}>
      {status}
    </Badge>
  )
}
