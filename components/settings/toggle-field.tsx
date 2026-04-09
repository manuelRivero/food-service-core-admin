"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ToggleFieldProps {
  id: string
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function ToggleField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: ToggleFieldProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Label
          htmlFor={id}
          className={disabled ? "text-muted-foreground" : ""}
        >
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}
