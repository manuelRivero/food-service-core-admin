"use client"

import { useCallback, useEffect, useState } from "react"
import { ImageIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  id: string
  label: string
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  className?: string
  /** Si hay error de formato o la imagen no carga, el formulario puede bloquear el envío */
  onBlockingValidationChange?: (hasBlockingError: boolean) => void
}

function getUrlFormatError(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null
  if (s.startsWith("data:image/")) return null
  try {
    const u = new URL(s)
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return "La URL debe usar http:// o https://"
    }
    return null
  } catch {
    return "Introduce una URL válida"
  }
}

function getPreviewSrc(raw: string | null): string | null {
  if (raw == null) return null
  const s = raw.trim()
  if (!s) return null
  if (getUrlFormatError(s)) return null
  return s
}

export function ImageUploader({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className,
  onBlockingValidationChange,
}: ImageUploaderProps) {
  const text = value ?? ""
  const formatError = getUrlFormatError(text)
  const [loadError, setLoadError] = useState<string | null>(null)
  const previewSrc = getPreviewSrc(value)

  useEffect(() => {
    setLoadError(null)
  }, [text])

  const blockingError = Boolean(formatError) || Boolean(loadError)

  useEffect(() => {
    onBlockingValidationChange?.(blockingError)
  }, [blockingError, onBlockingValidationChange])

  const handleImageLoad = useCallback(() => {
    setLoadError(null)
  }, [])

  const handleImageError = useCallback(() => {
    setLoadError(
      "No se pudo mostrar la imagen. Comprueba que la URL sea accesible y apunte a un archivo de imagen."
    )
  }, [])

  /*
   * --- Subida por archivo / arrastrar (reservado para uso futuro) ---
   *
   * const [isDragging, setIsDragging] = useState(false)
   *
   * const handleDragOver = useCallback((e: React.DragEvent) => { ... }, [disabled])
   * const handleDragLeave = useCallback((e: React.DragEvent) => { ... }, [])
   * const handleDrop = useCallback((e: React.DragEvent) => {
   *   ...
   *   const file = e.dataTransfer.files?.[0]
   *   if (file && file.type.startsWith("image/")) {
   *     const reader = new FileReader()
   *     reader.onloadend = () => { onChange(reader.result as string) }
   *     reader.readAsDataURL(file)
   *   }
   * }, [disabled, onChange])
   *
   * const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
   *   const file = e.target.files?.[0]
   *   if (file && file.type.startsWith("image/")) {
   *     const reader = new FileReader()
   *     reader.onloadend = () => { onChange(reader.result as string) }
   *     reader.readAsDataURL(file)
   *   }
   * }, [onChange])
   *
   * <label htmlFor={id} onDragOver={...} onDragLeave={...} onDrop={...}>
   *   ...
   *   <input id={id} type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
   * </label>
   */

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>

      <Input
        id={id}
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="https://ejemplo.com/imagen.jpg"
        value={text}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === "" ? null : v)
        }}
        disabled={disabled}
        aria-invalid={Boolean(formatError || loadError)}
        className={cn((formatError || loadError) && "border-destructive")}
      />

      {(formatError || loadError) && (
        <p className="text-sm text-destructive" role="alert">
          {formatError ?? loadError}
        </p>
      )}

      <div
        className={cn(
          "relative w-full max-w-xs overflow-hidden rounded-lg border bg-muted",
          previewSrc ? "aspect-video" : "min-h-40"
        )}
      >
        {previewSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria; onLoad/onError nativos */}
            <img
              src={previewSrc}
              alt="Vista previa del producto"
              className="absolute inset-0 size-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {/* Quitar imagen: antes botón X; ahora se borra vaciando el input de URL
            {!disabled && text.trim() !== "" && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 size-7"
                onClick={handleRemove}
              >
                <X className="size-4" />
                <span className="sr-only">Quitar imagen</span>
              </Button>
            )}
            */}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-muted-foreground">
            <ImageIcon className="size-10 opacity-60" />
            <p className="text-sm">
              {text.trim() === ""
                ? "La vista previa aparecerá cuando indiques una URL válida"
                : "Vista previa no disponible hasta que la URL sea válida"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
