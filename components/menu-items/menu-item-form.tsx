"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { FormSection } from "./form-section"
import { InputField } from "./input-field"
import { ToggleSwitch } from "./toggle-switch"
import { ImageUploader } from "./image-uploader"
import type { MenuItem } from "./types"

// Mock categories
const CATEGORIES = [
  { id: "cat-1", name: "Platos principales" },
  { id: "cat-2", name: "Ensaladas" },
  { id: "cat-3", name: "Entradas" },
  { id: "cat-4", name: "Postres" },
  { id: "cat-5", name: "Bebidas" },
]

interface MenuItemFormData {
  name: string
  description: string
  categoryId: string
  available: boolean
  featured: boolean
  servesPeople: string
  ingredients: string
  ingredientsNotes: string
  preparation: string
  imageUrl: string | null
}

interface MenuItemFormProps {
  mode: "create" | "edit"
  itemId?: string
}

const initialFormData: MenuItemFormData = {
  name: "",
  description: "",
  categoryId: "",
  available: true,
  featured: false,
  servesPeople: "",
  ingredients: "",
  ingredientsNotes: "",
  preparation: "",
  imageUrl: null,
}

export function MenuItemForm({ mode, itemId }: MenuItemFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<MenuItemFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof MenuItemFormData, string>>>({})
  const [isLoading, setIsLoading] = useState(mode === "edit")
  const [isSaving, setIsSaving] = useState(false)

  // Load item data for edit mode
  useEffect(() => {
    if (mode === "edit" && itemId) {
      const loadItem = async () => {
        setIsLoading(true)
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 800))
          
          // Mock data for demo
          const mockItem: MenuItem = {
            id: itemId,
            name: "Milanesa de ternera con papas fritas",
            description: "Clásica milanesa de ternera empanizada, acompañada de papas fritas caseras crujientes.",
            categoryId: "cat-1",
            categoryName: "Platos principales",
            imageUrl: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=300&fit=crop",
            available: true,
            featured: true,
            servesPeople: 2,
            ingredients: "Ternera, huevo, pan rallado, papas, aceite, sal",
            ingredientsNotes: "Contiene gluten. Puede prepararse sin TACC bajo pedido.",
            preparation: "1. Filetear la carne y salpimentar.\n2. Pasar por huevo batido y luego por pan rallado.\n3. Freír en aceite caliente hasta dorar.\n4. Servir con papas fritas caseras.",
            createdAt: new Date(),
          }

          setFormData({
            name: mockItem.name,
            description: mockItem.description || "",
            categoryId: mockItem.categoryId || "",
            available: mockItem.available,
            featured: mockItem.featured,
            servesPeople: mockItem.servesPeople?.toString() || "",
            ingredients: mockItem.ingredients || "",
            ingredientsNotes: mockItem.ingredientsNotes || "",
            preparation: mockItem.preparation || "",
            imageUrl: mockItem.imageUrl,
          })
        } catch {
          toast.error("Error al cargar el producto")
          router.push("/menu-items")
        } finally {
          setIsLoading(false)
        }
      }
      void loadItem()
    }
  }, [mode, itemId, router])

  const updateField = <K extends keyof MenuItemFormData>(
    field: K,
    value: MenuItemFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof MenuItemFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Selecciona una categoría"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error("Por favor corrige los errores del formulario")
      return
    }

    setIsSaving(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success(
        mode === "create"
          ? "Producto creado correctamente"
          : "Cambios guardados correctamente"
      )
      router.push("/menu-items")
    } catch {
      toast.error("Error al guardar el producto")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <MenuItemFormSkeleton />
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/menu-items">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "create" ? "Nuevo producto" : "Editar producto"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Completa los datos para agregar un nuevo producto al menú"
              : "Modifica los datos del producto"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Basic Information */}
          <FormSection
            title="Información básica"
            description="Nombre, descripción y categoría del producto"
          >
            <InputField
              id="name"
              label="Nombre"
              placeholder="Ej: Milanesa de ternera"
              value={formData.name}
              onChange={(value) => updateField("name", value)}
              required
              error={errors.name}
              disabled={isSaving}
            />

            <InputField
              id="description"
              label="Descripción"
              placeholder="Describe el producto..."
              value={formData.description}
              onChange={(value) => updateField("description", value)}
              type="textarea"
              rows={3}
              disabled={isSaving}
            />

            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className={errors.categoryId ? "text-destructive" : ""}>
                Categoría
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => updateField("categoryId", value)}
                disabled={isSaving}
              >
                <SelectTrigger
                  id="category"
                  className={errors.categoryId ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId}</p>
              )}
            </div>
          </FormSection>

          {/* Content Details */}
          <FormSection
            title="Detalles del producto"
            description="Ingredientes, notas y preparación"
          >
            <InputField
              id="ingredients"
              label="Ingredientes"
              placeholder="Lista los ingredientes principales..."
              value={formData.ingredients}
              onChange={(value) => updateField("ingredients", value)}
              type="textarea"
              rows={3}
              disabled={isSaving}
            />

            <InputField
              id="ingredientsNotes"
              label="Notas de ingredientes"
              placeholder="Ej: Contiene gluten, opciones veganas disponibles..."
              value={formData.ingredientsNotes}
              onChange={(value) => updateField("ingredientsNotes", value)}
              type="textarea"
              rows={2}
              disabled={isSaving}
            />

            <InputField
              id="preparation"
              label="Preparación"
              placeholder="Describe el proceso de preparación..."
              value={formData.preparation}
              onChange={(value) => updateField("preparation", value)}
              type="textarea"
              rows={4}
              disabled={isSaving}
            />
          </FormSection>
        </div>

        {/* Sidebar - 1 column */}
        <div className="flex flex-col gap-6">
          {/* Availability & Configuration */}
          <FormSection title="Configuración">
            <ToggleSwitch
              id="available"
              label="Disponible"
              description="El producto aparecerá en el menú"
              checked={formData.available}
              onCheckedChange={(checked) => updateField("available", checked)}
              disabled={isSaving}
            />

            <ToggleSwitch
              id="featured"
              label="Destacado"
              description="Mostrar como producto destacado"
              checked={formData.featured}
              onCheckedChange={(checked) => updateField("featured", checked)}
              disabled={isSaving}
            />

            <InputField
              id="servesPeople"
              label="Porciones (personas)"
              placeholder="Ej: 2"
              value={formData.servesPeople}
              onChange={(value) => updateField("servesPeople", value)}
              type="number"
              disabled={isSaving}
            />
          </FormSection>

          {/* Image */}
          <FormSection title="Imagen">
            <ImageUploader
              id="image"
              label="Imagen del producto"
              value={formData.imageUrl}
              onChange={(value) => updateField("imageUrl", value)}
              disabled={isSaving}
            />
          </FormSection>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button type="button" variant="outline" asChild disabled={isSaving}>
          <Link href="/menu-items">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {mode === "create" ? "Crear producto" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}

function MenuItemFormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="size-9 rounded-md" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  )
}
