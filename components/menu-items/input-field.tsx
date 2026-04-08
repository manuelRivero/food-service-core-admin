"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface InputFieldProps {
  id: string
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "number" | "textarea"
  required?: boolean
  error?: string
  disabled?: boolean
  className?: string
  rows?: number
}

export function InputField({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  disabled = false,
  className,
  rows = 3,
}: InputFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {type === "textarea" ? (
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={rows}
          aria-invalid={!!error}
          className={cn(error && "border-destructive")}
        />
      ) : (
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(error && "border-destructive")}
        />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
