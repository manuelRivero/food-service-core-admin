"use client"

import { cn } from "@/lib/utils"

interface UsageProgressProps {
  value: number
  className?: string
}

export function UsageProgress({ value, className }: UsageProgressProps) {
  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500"
    if (percent >= 70) return "bg-amber-500"
    return "bg-emerald-500"
  }

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className={cn(
          "h-full transition-all",
          getProgressColor(value)
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
