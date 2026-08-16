import { isAxiosError } from "axios"

import { api } from "@/lib/api"

export const ADMIN_PROMOTIONS_PATH = "/admin/promotions"
export const ADMIN_PROMOTIONS_INTERPRET_PATH = `${ADMIN_PROMOTIONS_PATH}/interpret`
export const ADMIN_PROMOTIONS_RESOLVE_PATH = `${ADMIN_PROMOTIONS_PATH}/resolve-entities`

export const MAX_PROMOTION_TEXT_LENGTH = 4000
export const MAX_PROMOTION_AUDIO_BYTES = 10 * 1024 * 1024
export const PROMOTION_AUDIO_ACCEPT =
  "audio/ogg,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/wav,audio/wave,audio/x-wav,audio/aac,audio/amr,audio/webm,.ogg,.mp3,.m4a,.mp4,.wav,.aac,.amr,.webm"

const INTERPRET_TIMEOUT_MS = 120_000

export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "contains"

export type Condition = {
  field: string
  operator: ConditionOperator
  value: unknown
}

export type Benefit =
  | { type: "percentage_discount"; value: number }
  | { type: "fixed_discount"; value: number }
  | { type: "fixed_price"; value: number }
  | { type: "free_product"; productName: string; quantity: number }
  | { type: "free_shipping" }

export type StructuredOffer = {
  name: string
  conditions: Condition[]
  benefit?: Benefit | null
  validity?: {
    startsAt?: string
    endsAt?: string
    daysOfWeek?: number[]
    timeRange?: { from: string; to: string }
  }
  limits?: {
    maxUsesTotal?: number
    maxUsesPerCustomer?: number
  }
  stacking?: { allowed: boolean }
}

export type MissingInformation = { field: string; question: string }

export type UnresolvedEntity = {
  type: "product" | "category" | "other"
  text: string
  path: string
}

export type PromotionEntityCardIcon = "utensils" | "tag" | "circle-help"

export type PromotionMenuCandidate = {
  menuItemId: string
  name: string
  thumbnailUrl: string | null
  price: number
  currencyCode: string
  score: number
  source: string
  matchedVariation: string | null
}

export type PromotionEntityCard = {
  name: string
  kind: "product" | "category" | "other"
  icon: PromotionEntityCardIcon
  productId: string | null
  thumbnailUrl: string | null
  resolved: boolean
  path: string
  subtitle: string
  candidates?: PromotionMenuCandidate[]
  /** Platillos marcados en UI; una mención puede vincular varios. */
  linkedCandidates?: PromotionMenuCandidate[]
}

export type PromotionDisplay = {
  statusLabel: string
  benefitLabel: string
  conditions: Array<{ index: number; label: string }>
  validityLines: string[]
  stackingLabel: string | null
  entityCards: PromotionEntityCard[]
}

export type PromotionInterpretation =
  | {
      status: "complete" | "needs_clarification"
      offer: StructuredOffer
      missingInformation?: MissingInformation[]
      unresolvedEntities?: UnresolvedEntity[]
      display: PromotionDisplay
    }
  | { status: "error" }

export type PromotionInterpretResponse = {
  input: { type: "text"; text: string } | { type: "audio" }
  transcription: {
    text: string
    language?: string
    duration?: number
  } | null
  interpretation: PromotionInterpretation
}

export type PromotionStatus = "draft" | "active" | "paused" | "archived"
export type PromotionSourceType = "text" | "audio"
export type ProductLinkRole = "condition" | "benefit"

export type PromotionProductLink = {
  path: string
  role: ProductLinkRole
  menuItemId: string
  sourceText: string
  quantity: number
}

export type PromotionProductPreview = {
  menuItemId: string
  name: string
  thumbnailUrl: string | null
  role: ProductLinkRole
}

export type PromotionDto = {
  id: string
  name: string
  status: PromotionStatus
  statusLabel: string
  summaryLine: string
  products: PromotionProductPreview[]
  sourceType: PromotionSourceType
  sourceText: string
  offer: StructuredOffer
  display: PromotionDisplay
  createdAt: string
  updatedAt: string
  productLinks?: PromotionProductLink[]
}

export type PromotionsListResponse = {
  items: PromotionDto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type CreatePromotionPayload = {
  offer: StructuredOffer
  status: "draft" | "active"
  sourceType: PromotionSourceType
  sourceText: string
  productLinks: PromotionProductLink[]
}

export type PatchPromotionPayload = {
  offer?: StructuredOffer
  status?: PromotionStatus
  productLinks?: PromotionProductLink[]
}

export type ResolveEntitiesPayload = {
  entities: Array<{
    text: string
    type: "product" | "category" | "other"
    path: string
  }>
}

type PromotionErrorBody = {
  error?: string
  message?: string
  code?: string
  details?: unknown
  missing?: unknown
} & Partial<PromotionInterpretResponse>

function extractErrorBody(err: unknown): PromotionErrorBody {
  if (!isAxiosError(err)) return {}
  const data = err.response?.data
  if (!data || typeof data !== "object") return {}
  return data as PromotionErrorBody
}

function formatDetails(details: unknown): string | null {
  if (details == null) return null
  if (typeof details === "string") return details
  if (Array.isArray(details)) {
    const lines = details.map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object") {
        const record = item as {
          message?: string
          path?: unknown
          field?: string
        }
        const path = Array.isArray(record.path)
          ? record.path.join(".")
          : record.field
        if (record.message && path) return `${path}: ${record.message}`
        if (record.message) return record.message
      }
      try {
        return JSON.stringify(item)
      } catch {
        return String(item)
      }
    })
    return lines.filter(Boolean).join("\n")
  }
  try {
    return JSON.stringify(details)
  } catch {
    return null
  }
}

export function formatPromotionMissing(missing: unknown): string[] {
  if (!Array.isArray(missing)) return []
  return missing.map((item) => {
    if (typeof item === "string") return item
    if (item && typeof item === "object") {
      const record = item as { message?: string; field?: string; question?: string }
      return record.message ?? record.question ?? record.field ?? JSON.stringify(item)
    }
    return String(item)
  })
}

export function getPromotionApiErrorMessage(err: unknown): string {
  if (!isAxiosError(err)) return "No pudimos completar la acción. Probá de nuevo."
  const status = err.response?.status
  const data = extractErrorBody(err)
  const code = data.code

  if (status === 402) return "Se agotó la cuota de IA del negocio"
  if (status === 422) {
    return "No pudimos transcribir el audio. Grabá de nuevo o escribí el texto."
  }
  if (status === 502) return "No pudimos interpretar. Probá de nuevo."
  if (code === "PROMOTION_PRODUCT_FOREIGN") {
    return "Un platillo no es de este negocio. Recargá e intentá de nuevo."
  }
  if (code === "PROMOTION_INVALID_OFFER") {
    return data.error ?? data.message ?? "La oferta editada quedó inválida."
  }
  if (code === "PROMOTION_NOT_FOUND") {
    return "No encontramos esa promoción."
  }
  if (code === "PROMOTION_INVALID_TRANSITION") {
    return data.error ?? data.message ?? "Ese cambio de estado no está permitido."
  }
  if (code === "PROMOTION_INCOMPLETE" || status === 409) {
    const missing = formatPromotionMissing(data.missing)
    if (missing.length > 0) return missing.join("\n")
    return data.error ?? data.message ?? "La promoción está incompleta."
  }
  if (status === 400) {
    const details = formatDetails(data.details)
    const base =
      data.error ??
      data.message ??
      "El pedido no es válido."
    return details ? `${base}\n${details}` : base
  }
  return data.message ?? data.error ?? "No pudimos completar la acción. Probá de nuevo."
}

export function getPromotionInterpretErrorMessage(err: unknown): string {
  return getPromotionApiErrorMessage(err)
}

export function getPromotionInterpretErrorPayload(
  err: unknown,
): Partial<PromotionInterpretResponse> | null {
  if (!isAxiosError(err)) return null
  const data = extractErrorBody(err)
  if (data.interpretation || data.transcription || data.input) {
    return data
  }
  return null
}

export function getPromotionErrorMissing(err: unknown): string[] {
  if (!isAxiosError(err)) return []
  return formatPromotionMissing(extractErrorBody(err).missing)
}

export function productLinkRoleFromPath(path: string): ProductLinkRole {
  return path.includes("benefit") ? "benefit" : "condition"
}

export type ProductCardRole = ProductLinkRole | "extra"

export function productCardRoleMeta(card: PromotionEntityCard): {
  role: ProductCardRole
  title: string
  hint: string
  linkedLabel: string
} {
  if (isManualProductCard(card)) {
    return {
      role: "extra",
      title: "Otros productos (opcional)",
      hint: "Platillos extra que no salieron del audio. Úsalo si te olvidaste de mencionar alguno.",
      linkedLabel: "Vinculado a la promoción",
    }
  }
  if (productLinkRoleFromPath(card.path) === "benefit") {
    return {
      role: "benefit",
      title: "Producto de regalo",
      hint: "Este es el beneficio: lo que se lleva de más (por ejemplo el producto gratis).",
      linkedLabel: "Regalo de la promoción",
    }
  }
  return {
    role: "condition",
    title: "Producto requerido",
    hint: "Hay que comprarlo para que la promo aplique (por ejemplo las dos unidades de la condición).",
    linkedLabel: "Requerido para la promoción",
  }
}

export function linkedCandidatesOf(
  card: PromotionEntityCard,
): PromotionMenuCandidate[] {
  if (card.linkedCandidates && card.linkedCandidates.length > 0) {
    return card.linkedCandidates
  }
  if (!card.productId) return []
  const fromSearch = card.candidates?.find(
    (item) => item.menuItemId === card.productId,
  )
  if (fromSearch) return [fromSearch]
  return [
    {
      menuItemId: card.productId,
      name: card.name,
      thumbnailUrl: card.thumbnailUrl,
      price: 0,
      currencyCode: "",
      score: 1,
      source: "selected",
      matchedVariation: null,
    },
  ]
}

export const MANUAL_PRODUCTS_PATH = "offer.manualProducts"

export function isManualProductCard(card: PromotionEntityCard): boolean {
  return card.path === MANUAL_PRODUCTS_PATH
}

export function createManualProductCard(): PromotionEntityCard {
  return {
    name: "",
    kind: "product",
    icon: "utensils",
    productId: null,
    thumbnailUrl: null,
    resolved: false,
    path: MANUAL_PRODUCTS_PATH,
    subtitle: "Buscá platillos del menú",
    candidates: [],
    linkedCandidates: [],
  }
}

export function withProductSearchCard(
  cards: PromotionEntityCard[],
): PromotionEntityCard[] {
  const seeded = cards.map(seedLinkedCandidates)
  if (seeded.some((card) => isManualProductCard(card))) return seeded
  return [...seeded, createManualProductCard()]
}

export function seedLinkedCandidates(
  card: PromotionEntityCard,
): PromotionEntityCard {
  if (card.kind !== "product") return card
  const linked = linkedCandidatesOf(card)
  if (linked.length === 0) return card
  return { ...card, linkedCandidates: linked, resolved: true }
}

export function toggleCandidateOnCard(
  card: PromotionEntityCard,
  candidate: PromotionMenuCandidate,
): PromotionEntityCard {
  const current = linkedCandidatesOf(card)
  const exists = current.some((item) => item.menuItemId === candidate.menuItemId)
  const next = exists
    ? current.filter((item) => item.menuItemId !== candidate.menuItemId)
    : [...current, candidate]
  const primary = next[0] ?? null
  return {
    ...card,
    linkedCandidates: next,
    productId: primary?.menuItemId ?? null,
    thumbnailUrl: primary?.thumbnailUrl ?? null,
    resolved: next.length > 0,
    subtitle:
      next.length > 0 ? "Vinculado a la promoción" : "Elegí el platillo del menú",
  }
}

export function applyCandidateToCard(
  card: PromotionEntityCard,
  candidate: PromotionMenuCandidate,
): PromotionEntityCard {
  return toggleCandidateOnCard(card, candidate)
}

export function buildProductLinks(
  cards: PromotionEntityCard[],
  offer: StructuredOffer,
): PromotionProductLink[] {
  return cards.flatMap((card) => {
    if (card.kind !== "product") return []
    const role = productLinkRoleFromPath(card.path)
    const quantity =
      role === "benefit" && offer.benefit?.type === "free_product"
        ? offer.benefit.quantity
        : 1
    return linkedCandidatesOf(card).map((item) => ({
      path: card.path,
      role,
      menuItemId: item.menuItemId,
      sourceText: card.name,
      quantity,
    }))
  })
}

export function canSavePromotion(
  offer: StructuredOffer,
  cards: PromotionEntityCard[],
): boolean {
  if (!offer.benefit) return false
  return cards
    .filter((card) => card.kind === "product" && !isManualProductCard(card))
    .every((card) => linkedCandidatesOf(card).length > 0)
}

export function allowedStatusTransitions(
  status: PromotionStatus,
): PromotionStatus[] {
  if (status === "archived") return []
  if (status === "draft") return ["active", "archived"]
  if (status === "active") return ["draft", "paused", "archived"]
  if (status === "paused") return ["active", "archived"]
  return []
}

export async function interpretPromotionFromText(
  text: string,
): Promise<PromotionInterpretResponse> {
  const { data } = await api.post<PromotionInterpretResponse>(
    ADMIN_PROMOTIONS_INTERPRET_PATH,
    { type: "text", text },
    { timeout: INTERPRET_TIMEOUT_MS },
  )
  return data
}

export async function interpretPromotionFromAudio(
  file: File,
): Promise<PromotionInterpretResponse> {
  const form = new FormData()
  form.append("type", "audio")
  form.append("audio", file)
  const { data } = await api.post<PromotionInterpretResponse>(
    ADMIN_PROMOTIONS_INTERPRET_PATH,
    form,
    {
      timeout: INTERPRET_TIMEOUT_MS,
      transformRequest: [
        (body, headers) => {
          if (headers && typeof headers === "object") {
            delete (headers as Record<string, unknown>)["Content-Type"]
          }
          return body
        },
      ],
    },
  )
  return data
}

export async function resolvePromotionEntities(
  payload: ResolveEntitiesPayload,
): Promise<PromotionEntityCard[]> {
  const { data } = await api.post<{
    entityCards?: PromotionEntityCard[]
    display?: PromotionDisplay
  }>(ADMIN_PROMOTIONS_RESOLVE_PATH, payload)
  return data.entityCards ?? data.display?.entityCards ?? []
}

export async function fetchPromotions(params: {
  page?: number
  pageSize?: number
  status?: PromotionStatus | "all"
  q?: string
  includeArchived?: boolean
}): Promise<PromotionsListResponse> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const query: Record<string, string | number | boolean> = { page, pageSize }
  if (params.q?.trim()) query.q = params.q.trim()
  if (params.status && params.status !== "all") query.status = params.status
  if (params.includeArchived) query.includeArchived = true

  const { data } = await api.get<PromotionsListResponse>(ADMIN_PROMOTIONS_PATH, {
    params: query,
  })
  return {
    items: data.items ?? [],
    total: Number(data.total) || 0,
    page: Number(data.page) || page,
    pageSize: Number(data.pageSize) || pageSize,
    totalPages: Number(data.totalPages) > 0 ? Number(data.totalPages) : 1,
  }
}

export async function fetchPromotionById(id: string): Promise<PromotionDto> {
  const { data } = await api.get<PromotionDto>(
    `${ADMIN_PROMOTIONS_PATH}/${encodeURIComponent(id)}`,
  )
  return data
}

export async function createPromotion(
  payload: CreatePromotionPayload,
): Promise<PromotionDto> {
  const { data } = await api.post<PromotionDto>(ADMIN_PROMOTIONS_PATH, payload)
  return data
}

export async function patchPromotion(
  id: string,
  payload: PatchPromotionPayload,
): Promise<PromotionDto> {
  const { data } = await api.patch<PromotionDto>(
    `${ADMIN_PROMOTIONS_PATH}/${encodeURIComponent(id)}`,
    payload,
  )
  return data
}

export async function archivePromotion(id: string): Promise<void> {
  await api.delete(`${ADMIN_PROMOTIONS_PATH}/${encodeURIComponent(id)}`)
}
