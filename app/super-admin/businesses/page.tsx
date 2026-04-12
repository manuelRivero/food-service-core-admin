"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { BusinessesTable } from "@/components/super-admin/businesses-table"
import { ChangePlanModal } from "@/components/super-admin/change-plan-modal"
import { ExtendSubscriptionModal } from "@/components/super-admin/extend-subscription-modal"
import { BlockModal } from "@/components/super-admin/block-modal"
import { ResetTokensModal } from "@/components/super-admin/reset-tokens-modal"
import { mockBusinesses } from "@/components/super-admin/mock-data"
import type { BusinessWithSubscription, Subscription } from "@/components/super-admin/types"
import { getBusinessStatus } from "@/components/super-admin/types"

const ITEMS_PER_PAGE = 8

export default function BusinessesPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<BusinessWithSubscription[]>(mockBusinesses)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal states
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithSubscription | null>(null)
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [resetTokensOpen, setResetTokensOpen] = useState(false)

  // Filter businesses by search query
  const filteredBusinesses = useMemo(() => {
    if (!searchQuery.trim()) return businesses
    const query = searchQuery.toLowerCase()
    return businesses.filter((b) =>
      b.name.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query) ||
      b.subscription.plan_name.toLowerCase().includes(query)
    )
  }, [businesses, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredBusinesses.length / ITEMS_PER_PAGE)
  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredBusinesses.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredBusinesses, currentPage])

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // Action handlers
  const handleViewDetails = (business: BusinessWithSubscription) => {
    router.push(`/super-admin/businesses/${business.id}`)
  }

  const handleChangePlan = (business: BusinessWithSubscription) => {
    setSelectedBusiness(business)
    setChangePlanOpen(true)
  }

  const handleExtendSubscription = (business: BusinessWithSubscription) => {
    setSelectedBusiness(business)
    setExtendOpen(true)
  }

  const handleToggleBlock = (business: BusinessWithSubscription) => {
    setSelectedBusiness(business)
    setBlockOpen(true)
  }

  const handleResetTokens = (business: BusinessWithSubscription) => {
    setSelectedBusiness(business)
    setResetTokensOpen(true)
  }

  // Confirm handlers
  const confirmChangePlan = (plan: Subscription["plan_name"]) => {
    if (!selectedBusiness) return
    
    const tokenLimits: Record<Subscription["plan_name"], number> = {
      Basic: 50000,
      Pro: 100000,
      Business: 250000,
    }
    
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === selectedBusiness.id
          ? {
              ...b,
              ai_monthly_token_limit: tokenLimits[plan],
              subscription: { ...b.subscription, plan_name: plan },
            }
          : b
      )
    )
    toast.success(`Plan changed to ${plan} for ${selectedBusiness.name}`)
  }

  const confirmExtendSubscription = (newEndDate: Date) => {
    if (!selectedBusiness) return
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === selectedBusiness.id
          ? {
              ...b,
              subscription: {
                ...b.subscription,
                current_period_end: newEndDate.toISOString(),
              },
            }
          : b
      )
    )
    toast.success(`Subscription extended for ${selectedBusiness.name}`)
  }

  const confirmToggleBlock = () => {
    if (!selectedBusiness) return
    const wasBlocked = selectedBusiness.ai_blocked
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === selectedBusiness.id
          ? { ...b, ai_blocked: !b.ai_blocked }
          : b
      )
    )
    toast.success(
      wasBlocked
        ? `${selectedBusiness.name} has been unblocked`
        : `${selectedBusiness.name} has been blocked`
    )
  }

  const confirmResetTokens = () => {
    if (!selectedBusiness) return
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === selectedBusiness.id
          ? { ...b, ai_monthly_tokens_used: 0 }
          : b
      )
    )
    toast.success(`Tokens reset for ${selectedBusiness.name}`)
  }

  const selectedStatus = selectedBusiness
    ? getBusinessStatus(selectedBusiness, selectedBusiness.subscription)
    : "Active"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
        <p className="text-muted-foreground">
          Manage all businesses and their subscriptions
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-base font-medium">All Businesses</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <BusinessesTable
            businesses={paginatedBusinesses}
            onViewDetails={handleViewDetails}
            onChangePlan={handleChangePlan}
            onExtendSubscription={handleExtendSubscription}
            onToggleBlock={handleToggleBlock}
            onResetTokens={handleResetTokens}
          />
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((p) => Math.max(1, p - 1))
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(page)
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              return null
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Modals */}
      <ChangePlanModal
        business={selectedBusiness}
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        onConfirm={confirmChangePlan}
      />
      <ExtendSubscriptionModal
        business={selectedBusiness}
        open={extendOpen}
        onOpenChange={setExtendOpen}
        onConfirm={confirmExtendSubscription}
      />
      <BlockModal
        business={selectedBusiness}
        status={selectedStatus}
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onConfirm={confirmToggleBlock}
      />
      <ResetTokensModal
        business={selectedBusiness}
        open={resetTokensOpen}
        onOpenChange={setResetTokensOpen}
        onConfirm={confirmResetTokens}
      />
    </div>
  )
}
