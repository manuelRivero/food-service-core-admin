"use client"

import { useCallback, useState } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  id: string
  label: string
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  className?: string
}

export function ImageUploader({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [disabled, onChange])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        onChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [onChange])

  const handleRemove = useCallback(() => {
    onChange(null)
  }, [onChange])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label>{label}</Label>
      
      {value ? (
        <div className="relative w-full max-w-xs">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized={value.startsWith("data:")}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 size-7"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="size-4" />
            <span className="sr-only">Eliminar imagen</span>
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            {isDragging ? (
              <Upload className="size-6 text-primary" />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? "Suelta la imagen aquí" : "Arrastra una imagen aquí"}
            </p>
            <p className="text-xs text-muted-foreground">
              o haz clic para seleccionar
            </p>
          </div>
          <input
            id={id}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="sr-only"
          />
        </label>
      )}
    </div>
  )
}
