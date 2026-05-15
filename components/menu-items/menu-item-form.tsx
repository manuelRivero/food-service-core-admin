"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { isAxiosError } from "axios"

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
import {
  createAdminMenuItem,
  fetchAdminMenuCategoriesOptions,
  fetchAdminMenuItemById,
  patchAdminMenuItem,
  type MenuCategoryOption,
} from "@/lib/requests/menu-items"

const DEFAULT_CURRENCY_CODE = "ARS"

interface MenuItemFormData {
  name: string
  description: string
  categoryId: string
  available: boolean
  featured: boolean
  servesPeople: string
  price: string
  currencyCode: string
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
  price: "",
  currencyCode: DEFAULT_CURRENCY_CODE,
  ingredients: "",
  ingredientsNotes: "",
  preparation: "",
  imageUrl: null,
}

export function MenuItemForm({ mode, itemId }: MenuItemFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<MenuItemFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof MenuItemFormData, string>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<MenuCategoryOption[]>([])
  const [imageUrlBlocked, setImageUrlBlocked] = useState(false)

  const handleImageBlockingChange = useCallback((blocked: boolean) => {
    setImageUrlBlocked(blocked)
    if (!blocked) {
      setErrors((prev) =>
        prev.imageUrl ? { ...prev, imageUrl: undefined } : prev
      )
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [categoriesData, item] = await Promise.all([
          fetchAdminMenuCategoriesOptions(),
          mode === "edit" && itemId
            ? fetchAdminMenuItemById(itemId)
            : Promise.resolve(null),
        ])

        setCategories(categoriesData)

        if (item) {
          setFormData({
            name: item.name,
            description: item.description || "",
            categoryId: item.categoryId || "",
            available: item.available,
            featured: item.featured,
            servesPeople: item.servesPeople?.toString() || "",
            price: item.price != null ? String(item.price) : "",
            currencyCode: item.currencyCode || DEFAULT_CURRENCY_CODE,
            ingredients: item.ingredients || "",
            ingredientsNotes: item.ingredientsNotes || "",
            preparation: item.preparation || "",
            imageUrl: item.imageUrl,
          })
        }
      } catch (e) {
        const msg = isAxiosError(e)
          ? (e.response?.data as { message?: string })?.message ?? e.message
          : "Error al cargar el formulario"
        toast.error(typeof msg === "string" ? msg : "Error al cargar el formulario")
        router.push("/menu-items")
      } finally {
        setIsLoading(false)
      }
    }
    void load()
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
    } else {
      const selectedCategory = categories.find((c) => c.id === formData.categoryId)
      if (!selectedCategory?.tag?.trim()) {
        newErrors.categoryId = "La categoría seleccionada no tiene sección asignada"
      }
    }

    const priceValue = formData.price.trim().replace(",", ".")
    const parsedPrice = priceValue === "" ? null : Number(priceValue)
    if (parsedPrice == null || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      newErrors.price = "Ingresa un precio válido"
    }

    if (imageUrlBlocked) {
      newErrors.imageUrl = "Revisa la URL de la imagen"
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
      const selectedCategory = categories.find((c) => c.id === formData.categoryId)
      const categoryTag = selectedCategory?.tag?.trim().toUpperCase() ?? null
      const priceValue = Number(formData.price.trim().replace(",", "."))

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        categoryId: formData.categoryId,
        categoryTag,
        sectionId: categoryTag,
        isAvailable: formData.available,
        isFeatured: formData.featured,
        servesPeople: formData.servesPeople.trim()
          ? Number(formData.servesPeople)
          : null,
        ingredients: formData.ingredients.trim() || null,
        ingredientsNotes: formData.ingredientsNotes.trim() || null,
        preparation: formData.preparation.trim() || null,
        image: formData.imageUrl,
        price: {
          amount: priceValue,
          currencyCode: formData.currencyCode.trim() || DEFAULT_CURRENCY_CODE,
        },
      }

      if (mode === "create") {
        await createAdminMenuItem(payload)
      } else if (itemId) {
        await patchAdminMenuItem(itemId, payload)
      }

      toast.success(
        mode === "create"
          ? "Producto creado correctamente"
          : "Cambios guardados correctamente"
      )
      router.push("/menu-items")
      router.refresh()
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string })?.message ?? e.message
        : "Error al guardar el producto"
      toast.error(typeof msg === "string" ? msg : "Error al guardar el producto")
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
                  {categories.map((category) => (
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

            <InputField
              id="price"
              label="Precio"
              placeholder="Ej: 4500"
              value={formData.price}
              onChange={(value) => updateField("price", value)}
              type="number"
              required
              error={errors.price}
              disabled={isSaving}
            />

            <InputField
              id="currencyCode"
              label="Moneda"
              value={formData.currencyCode}
              onChange={(value) => updateField("currencyCode", value)}
              disabled
            />
          </FormSection>

          {/* Image */}
          <FormSection title="Imagen">
            <ImageUploader
              id="image"
              label="Enlace a la imagen"
              value={formData.imageUrl}
              onChange={(value) => updateField("imageUrl", value)}
              disabled={isSaving}
              onBlockingValidationChange={handleImageBlockingChange}
            />
            {errors.imageUrl && (
              <p className="text-sm text-destructive">{errors.imageUrl}</p>
            )}
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
