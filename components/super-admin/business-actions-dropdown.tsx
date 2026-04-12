"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  MoreHorizontal,
  Eye,
  CreditCard,
  CalendarPlus,
  Ban,
  Unlock,
  RotateCcw,
} from "lucide-react"
import type { BusinessWithSubscription, BusinessStatus } from "./types"

interface BusinessActionsDropdownProps {
  business: BusinessWithSubscription
  status: BusinessStatus
  onViewDetails: () => void
  onChangePlan: () => void
  onExtendSubscription: () => void
  onToggleBlock: () => void
  onResetTokens: () => void
}

export function BusinessActionsDropdown({
  status,
  onViewDetails,
  onChangePlan,
  onExtendSubscription,
  onToggleBlock,
  onResetTokens,
}: BusinessActionsDropdownProps) {
  const isBlocked = status === "Blocked"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open actions menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onViewDetails}>
          <Eye className="size-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onChangePlan}>
          <CreditCard className="size-4" />
          Change Plan
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExtendSubscription}>
          <CalendarPlus className="size-4" />
          Extend Subscription
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleBlock}>
          {isBlocked ? (
            <>
              <Unlock className="size-4" />
              Unblock
            </>
          ) : (
            <>
              <Ban className="size-4" />
              Block
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResetTokens}>
          <RotateCcw className="size-4" />
          Reset Tokens
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
