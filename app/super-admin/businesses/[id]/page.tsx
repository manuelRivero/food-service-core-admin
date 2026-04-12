"use client"

import { useState, useMemo, use } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import { ArrowLeft, Building2, CreditCard, Cpu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UsageProgress } from "@/components/super-admin/usage-progress"
import { BusinessStatusBadge } from "@/components/super-admin/business-status-badge"
import { ChangePlanModal } from "@/components/super-admin/change-plan-modal"
import { ExtendSubscriptionModal } from "@/components/super-admin/extend-subscription-modal"
import { BlockModal } from "@/components/super-admin/block-modal"
import { ResetTokensModal } from "@/components/super-admin/reset-tokens-modal"
import { mockBusinesses } from "@/components/super-admin/mock-data"
import type { BusinessWithSubscription, Subscription } from "@/components/super-admin/types"
import { getBusinessStatus, formatTokens } from "@/components/super-admin/types"

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>
}

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  
  const initialBusiness = useMemo(() => {
    return mockBusinesses.find((b) => b.id === id) || null
  }, [id])

  const [business, setBusiness] = useState<BusinessWithSubscription | null>(initialBusiness)

  // Modal states
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [resetTokensOpen, setResetTokensOpen] = useState(false)

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-medium">Business not found</h2>
        <p className="text-muted-foreground">
          The business you are looking for does not exist.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/super-admin/businesses")}
        >
          <ArrowLeft className="size-4" />
          Back to Businesses
        </Button>
      </div>
    )
  }

  const status = getBusinessStatus(business, business.subscription)
  const usagePercent = Math.round(
    (business.ai_monthly_tokens_used / business.ai_monthly_token_limit) * 100
  )

  // Confirm handlers
  const confirmChangePlan = (plan: Subscription["plan_name"]) => {
    const tokenLimits: Record<Subscription["plan_name"], number> = {
      Basic: 50000,
      Pro: 100000,
      Business: 250000,
    }
    
    setBusiness((prev) =>
      prev
        ? {
            ...prev,
            ai_monthly_token_limit: tokenLimits[plan],
            subscription: { ...prev.subscription, plan_name: plan },
          }
        : null
    )
    toast.success(`Plan changed to ${plan}`)
  }

  const confirmExtendSubscription = (newEndDate: Date) => {
    setBusiness((prev) =>
      prev
        ? {
            ...prev,
            subscription: {
              ...prev.subscription,
              current_period_end: newEndDate.toISOString(),
            },
          }
        : null
    )
    toast.success("Subscription extended")
  }

  const confirmToggleBlock = () => {
    const wasBlocked = business.ai_blocked
    setBusiness((prev) =>
      prev ? { ...prev, ai_blocked: !prev.ai_blocked } : null
    )
    toast.success(wasBlocked ? "Business unblocked" : "Business blocked")
  }

  const confirmResetTokens = () => {
    setBusiness((prev) =>
      prev ? { ...prev, ai_monthly_tokens_used: 0 } : null
    )
    toast.success("Tokens reset successfully")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/super-admin/businesses")}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Back to businesses</span>
        </Button>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {business.name}
            </h1>
            <BusinessStatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Business ID: {business.id}
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Business Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Building2 className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Business Info</CardTitle>
              <CardDescription>Basic information</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{business.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ID</span>
              <span className="text-sm font-mono">{business.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">
                {format(new Date(business.created_at), "MMM d, yyyy")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Subscription</CardTitle>
              <CardDescription>Plan and billing details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {business.subscription.plan_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <BusinessStatusBadge status={status} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Period Start</span>
              <span className="text-sm">
                {format(
                  new Date(business.subscription.current_period_start),
                  "MMM d, yyyy"
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Period End</span>
              <span className="text-sm">
                {format(
                  new Date(business.subscription.current_period_end),
                  "MMM d, yyyy"
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* AI Usage Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Cpu className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">AI Usage</CardTitle>
              <CardDescription>Token consumption this period</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tokens Used</span>
              <span className="text-sm font-medium">
                {formatTokens(business.ai_monthly_tokens_used)} /{" "}
                {formatTokens(business.ai_monthly_token_limit)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usage</span>
                <span className="font-medium">{usagePercent}%</span>
              </div>
              <UsageProgress value={usagePercent} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <span className="text-sm">
                {formatTokens(
                  business.ai_monthly_token_limit - business.ai_monthly_tokens_used
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Section */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Settings className="size-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">Actions</CardTitle>
            <CardDescription>Manage this business</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setChangePlanOpen(true)}>
              <CreditCard className="size-4" />
              Change Plan
            </Button>
            <Button variant="outline" onClick={() => setExtendOpen(true)}>
              Extend Subscription
            </Button>
            <Button
              variant={status === "Blocked" ? "default" : "outline"}
              onClick={() => setBlockOpen(true)}
            >
              {status === "Blocked" ? "Unblock" : "Block"}
            </Button>
            <Button variant="outline" onClick={() => setResetTokensOpen(true)}>
              Reset Tokens
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ChangePlanModal
        business={business}
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        onConfirm={confirmChangePlan}
      />
      <ExtendSubscriptionModal
        business={business}
        open={extendOpen}
        onOpenChange={setExtendOpen}
        onConfirm={confirmExtendSubscription}
      />
      <BlockModal
        business={business}
        status={status}
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onConfirm={confirmToggleBlock}
      />
      <ResetTokensModal
        business={business}
        open={resetTokensOpen}
        onOpenChange={setResetTokensOpen}
        onConfirm={confirmResetTokens}
      />
    </div>
  )
}
