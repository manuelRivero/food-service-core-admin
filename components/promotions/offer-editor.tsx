"use client"

import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type {
  Benefit,
  Condition,
  ConditionOperator,
  StructuredOffer,
} from "@/lib/requests/promotions"
import {
  BENEFIT_TYPE_LABELS,
  DAY_LABELS,
  OPERATOR_LABELS,
  formatConditionValue,
} from "@/components/promotions/format-offer"

const OPERATORS = Object.keys(OPERATOR_LABELS) as ConditionOperator[]
const BENEFIT_TYPES = Object.keys(BENEFIT_TYPE_LABELS) as Benefit["type"][]

function parseConditionValue(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  try {
    return JSON.parse(trimmed)
  } catch {
    return raw
  }
}

function toDatetimeLocal(iso?: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDatetimeLocal(value: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

function defaultBenefit(type: Benefit["type"]): Benefit {
  switch (type) {
    case "percentage_discount":
    case "fixed_discount":
    case "fixed_price":
      return { type, value: 0 }
    case "free_product":
      return { type, productName: "", quantity: 1 }
    case "free_shipping":
      return { type }
  }
}

export function OfferEditor({
  offer,
  onChange,
  disabled,
}: {
  offer: StructuredOffer
  onChange: (offer: StructuredOffer) => void
  disabled?: boolean
}) {
  const benefitType = offer.benefit?.type ?? "none"

  const update = (patch: Partial<StructuredOffer>) => {
    onChange({ ...offer, ...patch })
  }

  const updateCondition = (index: number, patch: Partial<Condition>) => {
    const conditions = offer.conditions.map((condition, i) =>
      i === index ? { ...condition, ...patch } : condition,
    )
    update({ conditions })
  }

  const toggleDay = (day: number, checked: boolean) => {
    const current = offer.validity?.daysOfWeek ?? []
    const daysOfWeek = checked
      ? [...current, day].sort((a, b) => a - b)
      : current.filter((item) => item !== day)
    update({
      validity: { ...offer.validity, daysOfWeek },
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="promo-name">Nombre</Label>
        <Input
          id="promo-name"
          value={offer.name}
          disabled={disabled}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Label>Beneficio</Label>
        <Select
          value={benefitType}
          disabled={disabled}
          onValueChange={(value) => {
            if (value === "none") {
              update({ benefit: null })
              return
            }
            update({ benefit: defaultBenefit(value as Benefit["type"]) })
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sin beneficio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin beneficio</SelectItem>
            {BENEFIT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {BENEFIT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {offer.benefit?.type === "percentage_discount" ||
        offer.benefit?.type === "fixed_discount" ||
        offer.benefit?.type === "fixed_price" ? (
          <div className="space-y-2">
            <Label htmlFor="benefit-value">Valor</Label>
            <Input
              id="benefit-value"
              type="number"
              min={0}
              step="0.01"
              disabled={disabled}
              value={offer.benefit.value}
              onChange={(e) =>
                update({
                  benefit: {
                    ...offer.benefit!,
                    value: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        ) : null}
        {offer.benefit?.type === "free_product" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="free-product-name">Producto de regalo</Label>
              <Input
                id="free-product-name"
                disabled={disabled}
                value={offer.benefit.productName}
                onChange={(e) =>
                  update({
                    benefit: {
                      ...offer.benefit!,
                      productName: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="free-product-qty">Cantidad</Label>
              <Input
                id="free-product-qty"
                type="number"
                min={1}
                disabled={disabled}
                value={offer.benefit.quantity}
                onChange={(e) =>
                  update({
                    benefit: {
                      ...offer.benefit!,
                      quantity: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Condiciones</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() =>
              update({
                conditions: [
                  ...offer.conditions,
                  { field: "", operator: "eq", value: "" },
                ],
              })
            }
          >
            <Plus className="size-4" />
            Agregar
          </Button>
        </div>
        {offer.conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin condiciones</p>
        ) : (
          <div className="space-y-3">
            {offer.conditions.map((condition, index) => (
              <div
                key={index}
                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_10rem_1fr_auto]"
              >
                <Input
                  placeholder="Campo"
                  disabled={disabled}
                  value={condition.field}
                  onChange={(e) =>
                    updateCondition(index, { field: e.target.value })
                  }
                />
                <Select
                  value={condition.operator}
                  disabled={disabled}
                  onValueChange={(value) =>
                    updateCondition(index, {
                      operator: value as ConditionOperator,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((operator) => (
                      <SelectItem key={operator} value={operator}>
                        {OPERATOR_LABELS[operator]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Valor"
                  disabled={disabled}
                  value={formatConditionValue(condition.value)}
                  onChange={(e) =>
                    updateCondition(index, {
                      value: parseConditionValue(e.target.value),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() =>
                    update({
                      conditions: offer.conditions.filter((_, i) => i !== index),
                    })
                  }
                  aria-label="Quitar condición"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="starts-at">Desde</Label>
          <Input
            id="starts-at"
            type="datetime-local"
            disabled={disabled}
            value={toDatetimeLocal(offer.validity?.startsAt)}
            onChange={(e) =>
              update({
                validity: {
                  ...offer.validity,
                  startsAt: fromDatetimeLocal(e.target.value),
                },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ends-at">Hasta</Label>
          <Input
            id="ends-at"
            type="datetime-local"
            disabled={disabled}
            value={toDatetimeLocal(offer.validity?.endsAt)}
            onChange={(e) =>
              update({
                validity: {
                  ...offer.validity,
                  endsAt: fromDatetimeLocal(e.target.value),
                },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time-from">Horario desde</Label>
          <Input
            id="time-from"
            type="time"
            disabled={disabled}
            value={offer.validity?.timeRange?.from ?? ""}
            onChange={(e) =>
              update({
                validity: {
                  ...offer.validity,
                  timeRange: {
                    from: e.target.value,
                    to: offer.validity?.timeRange?.to ?? "",
                  },
                },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time-to">Horario hasta</Label>
          <Input
            id="time-to"
            type="time"
            disabled={disabled}
            value={offer.validity?.timeRange?.to ?? ""}
            onChange={(e) =>
              update({
                validity: {
                  ...offer.validity,
                  timeRange: {
                    from: offer.validity?.timeRange?.from ?? "",
                    to: e.target.value,
                  },
                },
              })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Días de la semana</Label>
        <div className="flex flex-wrap gap-3">
          {DAY_LABELS.map((day) => {
            const checked = offer.validity?.daysOfWeek?.includes(day.value) ?? false
            return (
              <label key={day.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(value) =>
                    toggleDay(day.value, value === true)
                  }
                />
                {day.short}
              </label>
            )
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="max-uses-total">Máx. usos totales</Label>
          <Input
            id="max-uses-total"
            type="number"
            min={1}
            disabled={disabled}
            value={offer.limits?.maxUsesTotal ?? ""}
            onChange={(e) =>
              update({
                limits: {
                  ...offer.limits,
                  maxUsesTotal: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-uses-customer">Máx. usos por cliente</Label>
          <Input
            id="max-uses-customer"
            type="number"
            min={1}
            disabled={disabled}
            value={offer.limits?.maxUsesPerCustomer ?? ""}
            onChange={(e) =>
              update({
                limits: {
                  ...offer.limits,
                  maxUsesPerCustomer: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                },
              })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <Label htmlFor="stacking">Permitir combinar con otras promociones</Label>
        <Switch
          id="stacking"
          disabled={disabled}
          checked={offer.stacking?.allowed ?? false}
          onCheckedChange={(checked) =>
            update({ stacking: { allowed: checked } })
          }
        />
      </div>
    </div>
  )
}
