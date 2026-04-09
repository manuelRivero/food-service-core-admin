"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NumberInputFieldProps {
  id: string
  label: string
  description?: string
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
  placeholder?: string
  min?: number
}

export function NumberInputField({
  id,
  label,
  description,
  value,
  onChange,
  disabled = false,
  placeholder,
  min = 0,
}: NumberInputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === "") {
      onChange(null)
      return
    }
    const num = parseInt(val, 10)
    if (!isNaN(num) && num >= min) {
      onChange(num)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={id}
        className={disabled ? "text-muted-foreground" : ""}
      >
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        value={value ?? ""}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className="max-w-[200px]"
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
