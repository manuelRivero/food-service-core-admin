"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

export const VARIATIONS_MAX_COUNT = 10
export const VARIATIONS_MAX_LENGTH = 60

interface VariationsInputProps {
  id?: string
  label?: string
  value: string[]
  onChange: (variations: string[]) => void
  placeholder?: string
  disabled?: boolean
  error?: string
}

export function VariationsInput({
  id = "variations",
  label = "Variaciones",
  value,
  onChange,
  placeholder = "Escribí y Enter para agregar…",
  disabled,
  error,
}: VariationsInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayError = error ?? localError

  const addVariation = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setInputValue("")
      setLocalError(null)
      return
    }

    if (trimmed.length > VARIATIONS_MAX_LENGTH) {
      setLocalError(
        `Cada variación puede tener como máximo ${VARIATIONS_MAX_LENGTH} caracteres`,
      )
      return
    }

    if (value.length >= VARIATIONS_MAX_COUNT) {
      setLocalError(
        `Podés agregar como máximo ${VARIATIONS_MAX_COUNT} variaciones`,
      )
      setInputValue("")
      return
    }

    onChange([...value, trimmed])
    setInputValue("")
    setLocalError(null)
  }

  const removeVariation = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
    setLocalError(null)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addVariation(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeVariation(value.length - 1)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label
          htmlFor={id}
          className={displayError ? "text-destructive" : undefined}
        >
          {label}
        </Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value.length}/{VARIATIONS_MAX_COUNT}
        </span>
      </div>
      <div
        className={`flex min-h-10 flex-wrap gap-1.5 cursor-text rounded-md border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring ${
          displayError ? "border-destructive" : ""
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((variation, i) => (
          <Badge
            key={`${variation}-${i}`}
            variant="secondary"
            className="gap-1 pr-1 text-xs font-normal"
          >
            {variation}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeVariation(i)
                }}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="size-2.5" />
                <span className="sr-only">Eliminar {variation}</span>
              </button>
            )}
          </Badge>
        ))}
        {!disabled && value.length < VARIATIONS_MAX_COUNT && (
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              if (localError) setLocalError(null)
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue) addVariation(inputValue)
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            maxLength={VARIATIONS_MAX_LENGTH}
            className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={disabled}
          />
        )}
      </div>
      {displayError ? (
        <p className="text-sm text-destructive">{displayError}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Opciones del producto (ej. Especial, Roquefort). Enter o coma para
          agregar.
        </p>
      )}
    </div>
  )
}
