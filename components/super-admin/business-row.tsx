"use client"

import { format } from "date-fns"
import { TableCell, TableRow } from "@/components/ui/table"
import { UsageProgress } from "./usage-progress"
import { BusinessStatusBadge } from "./business-status-badge"
import { BusinessActionsDropdown } from "./business-actions-dropdown"
import type { BusinessWithSubscription } from "./types"
import { getBusinessStatus, formatTokens } from "./types"

interface BusinessRowProps {
  business: BusinessWithSubscription
  onViewDetails: () => void
  onChangePlan: () => void
  onExtendSubscription: () => void
  onToggleBlock: () => void
  onResetTokens: () => void
}

export function BusinessRow({
  business,
  onViewDetails,
  onChangePlan,
  onExtendSubscription,
  onToggleBlock,
  onResetTokens,
}: BusinessRowProps) {
  const status = getBusinessStatus(business, business.subscription)
  const usagePercent = Math.round(
    (business.ai_monthly_tokens_used / business.ai_monthly_token_limit) * 100
  )

  return (
    <TableRow>
      <TableCell className="font-medium">{business.name}</TableCell>
      <TableCell>
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
          {business.subscription.plan_name}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatTokens(business.ai_monthly_tokens_used)} /{" "}
          {formatTokens(business.ai_monthly_token_limit)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <UsageProgress value={usagePercent} className="w-20" />
          <span className="text-xs text-muted-foreground w-10">{usagePercent}%</span>
        </div>
      </TableCell>
      <TableCell>
        <BusinessStatusBadge status={status} />
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(business.subscription.current_period_end), "MMM d, yyyy")}
        </span>
      </TableCell>
      <TableCell>
        <BusinessActionsDropdown
          business={business}
          status={status}
          onViewDetails={onViewDetails}
          onChangePlan={onChangePlan}
          onExtendSubscription={onExtendSubscription}
          onToggleBlock={onToggleBlock}
          onResetTokens={onResetTokens}
        />
      </TableCell>
    </TableRow>
  )
}
