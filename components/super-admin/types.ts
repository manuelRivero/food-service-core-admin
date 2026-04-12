export interface Business {
  id: string
  name: string
  ai_blocked: boolean
  ai_monthly_tokens_used: number
  ai_monthly_token_limit: number
  created_at: string
}

export interface Subscription {
  plan_name: "Basic" | "Pro" | "Business"
  current_period_start: string
  current_period_end: string
  status: "active" | "canceled" | "past_due"
}

export interface BusinessWithSubscription extends Business {
  subscription: Subscription
}

export type BusinessStatus = "Active" | "Blocked" | "Expired"

export function getBusinessStatus(
  business: Business,
  subscription: Subscription
): BusinessStatus {
  if (business.ai_blocked) return "Blocked"
  if (new Date() > new Date(subscription.current_period_end)) return "Expired"
  return "Active"
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}k`
  }
  return tokens.toString()
}
