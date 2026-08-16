"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Check,
  CircleHelp,
  Loader2,
  Search,
  Tag,
  UtensilsCrossed,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatMenuItemPrice } from "@/lib/format-menu-price"
import {
  linkedCandidatesOf,
  productCardRoleMeta,
  type PromotionEntityCard,
  type PromotionEntityCardIcon,
  type PromotionMenuCandidate,
} from "@/lib/requests/promotions"

const ENTITY_ICONS: Record<PromotionEntityCardIcon, typeof UtensilsCrossed> = {
  utensils: UtensilsCrossed,
  tag: Tag,
  "circle-help": CircleHelp,
}

const MIN_SEARCH_CHARS = 3
const SEARCH_DEBOUNCE_MS = 400

function Thumbnail({
  url,
  icon,
  size = "md",
}: {
  url: string | null
  icon: PromotionEntityCardIcon
  size?: "sm" | "md"
}) {
  const Icon = ENTITY_ICONS[icon] ?? CircleHelp
  const box = size === "sm" ? "h-10 w-10" : "h-14 w-14"
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={cn(box, "shrink-0 rounded-lg object-cover")}
      />
    )
  }
  return (
    <div
      className={cn(
        box,
        "flex shrink-0 items-center justify-center rounded-lg bg-muted",
      )}
    >
      <Icon className="size-5 text-muted-foreground" />
    </div>
  )
}

function LinkedProductCard({
  item,
  linkedLabel,
  disabled,
  onRemove,
}: {
  item: PromotionMenuCandidate
  linkedLabel: string
  disabled?: boolean
  onRemove?: () => void
}) {
  return (
    <div className="flex max-w-[92%] items-start gap-3 rounded-2xl rounded-tl-md border bg-muted/40 p-3 shadow-sm">
      <Thumbnail url={item.thumbnailUrl} icon="utensils" />
      <div className="min-w-0 flex-1">
        <Link
          href={`/menu-items/${item.menuItemId}/edit`}
          className="font-medium hover:underline"
        >
          {item.name}
        </Link>
        <p className="text-sm text-muted-foreground">
          {formatMenuItemPrice(item.price, item.currencyCode)}
          {item.matchedVariation ? ` · ${item.matchedVariation}` : null}
        </p>
        <div className="mt-1.5 flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-3.5" />
          {linkedLabel}
        </div>
      </div>
      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Quitar ${item.name}`}
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  )
}

export function EntityCard({
  card,
  disabled,
  resolving,
  onSelectCandidate,
  onNameCommit,
}: {
  card: PromotionEntityCard
  disabled?: boolean
  resolving?: boolean
  onSelectCandidate?: (candidate: PromotionMenuCandidate) => void
  onNameCommit?: (name: string) => void
}) {
  const [name, setName] = useState(card.name)
  const lastQueryRef = useRef(card.name.trim())
  const onNameCommitRef = useRef(onNameCommit)
  onNameCommitRef.current = onNameCommit
  const candidates = card.candidates ?? []
  const linkedItems = linkedCandidatesOf(card)
  const linkedIds = new Set(linkedItems.map((item) => item.menuItemId))
  const availableCandidates = candidates.filter(
    (item) => !linkedIds.has(item.menuItemId),
  )
  const showSearch = Boolean(onNameCommit) && card.kind === "product"
  const showResults =
    showSearch &&
    Boolean(onSelectCandidate) &&
    availableCandidates.length > 0 &&
    !resolving

  useEffect(() => {
    if (!card.name.trim()) return
    setName(card.name)
    lastQueryRef.current = card.name.trim()
  }, [card.name])

  const runSearch = (raw: string, options?: { force?: boolean }) => {
    const commit = onNameCommitRef.current
    if (!commit) return
    const next = raw.trim()
    if (!next) return
    if (!options?.force && next.length < MIN_SEARCH_CHARS) return
    if (next === lastQueryRef.current) return
    lastQueryRef.current = next
    commit(next)
  }

  useEffect(() => {
    if (!showSearch) return
    const timer = window.setTimeout(() => {
      runSearch(name)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [name, showSearch])

  const roleMeta = productCardRoleMeta(card)
  const canClickSearch = name.trim().length > 0 && !disabled && !resolving

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Badge
            variant={roleMeta.role === "benefit" ? "default" : "secondary"}
          >
            {roleMeta.title}
          </Badge>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                aria-label={`Qué es ${roleMeta.title}`}
              >
                <CircleHelp className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="max-w-64 text-xs leading-relaxed"
            >
              {roleMeta.hint}
            </PopoverContent>
          </Popover>
        </div>
        {card.name.trim() ? (
          <div className="max-w-[60%] rounded-2xl rounded-tr-md bg-primary px-3 py-2 text-sm text-primary-foreground">
            {card.name}
          </div>
        ) : null}
      </div>

      {linkedItems.length > 0 ? (
        <div className="space-y-2">
          {linkedItems.map((item) => (
            <LinkedProductCard
              key={item.menuItemId}
              item={item}
              linkedLabel={roleMeta.linkedLabel}
              disabled={disabled}
              onRemove={
                onSelectCandidate
                  ? () => onSelectCandidate(item)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tocá un resultado para vincularlo a la promoción.
        </p>
      )}

      {showSearch ? (
        <div className="space-y-2">
          <InputGroup>
            <InputGroupInput
              value={name}
              disabled={disabled || resolving}
              placeholder="Buscá platillos del menú…"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  runSearch(name, { force: true })
                }
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                disabled={!canClickSearch}
                aria-label="Buscar platillo"
                onClick={() => runSearch(name, { force: true })}
              >
                {resolving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {resolving ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Buscando en el menú…
            </p>
          ) : null}
        </div>
      ) : null}

      {showResults ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Resultados de búsqueda
          </p>
          {availableCandidates.map((candidate) => (
            <button
              key={candidate.menuItemId}
              type="button"
              disabled={disabled || resolving}
              onClick={() => onSelectCandidate?.(candidate)}
              className="flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors hover:bg-muted/60"
            >
              <Thumbnail
                url={candidate.thumbnailUrl}
                icon="utensils"
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{candidate.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatMenuItemPrice(
                    candidate.price,
                    candidate.currencyCode,
                  )}
                </div>
                {candidate.matchedVariation ? (
                  <div className="text-xs text-muted-foreground">
                    Coincide con la variación {candidate.matchedVariation}
                  </div>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {showSearch && !resolving && candidates.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No hay resultados. Probá con otro nombre.
        </p>
      ) : null}
      {showSearch &&
      !resolving &&
      candidates.length > 0 &&
      availableCandidates.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Todos los resultados de esta búsqueda ya están vinculados.
        </p>
      ) : null}
    </div>
  )
}
