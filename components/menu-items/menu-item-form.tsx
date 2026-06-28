"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { SettingsFormFooter } from "@/components/settings/settings-form-footer"
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
import {
  aiMetadataToDraft,
  fetchAiMetadataOrNull,
  type AiMetadataDraft,
} from "@/lib/requests/ai-metadata"
import { AiEnrichmentModal } from "./ai-enrichment-modal"
import { AiMetadataStatusTag } from "./ai-metadata-status-tag"
import { ConfirmAiGenerationDialog } from "./confirm-ai-generation-dialog"

const DEFAULT_CURRENCY_CODE = "ARS"

const MENU_ITEM_UNSAVED_MESSAGE =
  "Modificaste el producto. Guardá los cambios para que se apliquen en el menú."

const MENU_ITEM_CREATE_UNSAVED_MESSAGE =
  "Creá el producto para agregarlo al menú."

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
  discountEnabled: boolean
  discountType: "PERCENT" | "FIXED"
  discountValue: string
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
  discountEnabled: false,
  discountType: "PERCENT",
  discountValue: "",
}

function normalizeFormData(data: MenuItemFormData) {
  return {
    name: data.name.trim(),
    description: data.description.trim(),
    categoryId: data.categoryId,
    available: data.available,
    featured: data.featured,
    servesPeople: data.servesPeople.trim(),
    price: data.price.trim().replace(",", "."),
    currencyCode: data.currencyCode.trim() || DEFAULT_CURRENCY_CODE,
    ingredients: data.ingredients.trim(),
    ingredientsNotes: data.ingredientsNotes.trim(),
    preparation: data.preparation.trim(),
    imageUrl: data.imageUrl,
    discountEnabled: data.discountEnabled,
    discountType: data.discountType,
    discountValue: data.discountValue.trim().replace(",", "."),
  }
}

function isFormDataEqual(a: MenuItemFormData, b: MenuItemFormData): boolean {
  const left = normalizeFormData(a)
  const right = normalizeFormData(b)
  return (
    left.name === right.name &&
    left.description === right.description &&
    left.categoryId === right.categoryId &&
    left.available === right.available &&
    left.featured === right.featured &&
    left.servesPeople === right.servesPeople &&
    left.price === right.price &&
    left.currencyCode === right.currencyCode &&
    left.ingredients === right.ingredients &&
    left.ingredientsNotes === right.ingredientsNotes &&
    left.preparation === right.preparation &&
    left.imageUrl === right.imageUrl &&
    left.discountEnabled === right.discountEnabled &&
    left.discountType === right.discountType &&
    left.discountValue === right.discountValue
  )
}

export function MenuItemForm({ mode, itemId }: MenuItemFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<MenuItemFormData>(initialFormData)
  const [initialFormDataState, setInitialFormDataState] =
    useState<MenuItemFormData | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof MenuItemFormData | "discountValue", string>>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<MenuCategoryOption[]>([])
  const [imageUrlBlocked, setImageUrlBlocked] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [savedItemId, setSavedItemId] = useState<string | null>(null)
  const [aiModalSource, setAiModalSource] = useState<"generate" | "edit-existing">(
    "generate",
  )
  const [aiModalDismissible, setAiModalDismissible] = useState(false)
  const [aiModalInitialDraft, setAiModalInitialDraft] = useState<
    AiMetadataDraft | undefined
  >(undefined)
  const [redirectAfterAiSave, setRedirectAfterAiSave] = useState(true)
  const [aiMetadataStatus, setAiMetadataStatus] = useState<
    "loading" | "present" | "missing"
  >("loading")
  const [aiMetadataDraft, setAiMetadataDraft] = useState<AiMetadataDraft | null>(
    null,
  )
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false)

  const handleImageBlockingChange = useCallback((blocked: boolean) => {
    setImageUrlBlocked(blocked)
    if (!blocked) {
      setErrors((prev) =>
        prev.imageUrl ? { ...prev, imageUrl: undefined } : prev
      )
    }
  }, [])

  const refreshAiMetadataStatus = useCallback(async (id: string) => {
    const metadata = await fetchAiMetadataOrNull(id)
    if (metadata) {
      setAiMetadataDraft(aiMetadataToDraft(metadata))
      setAiMetadataStatus("present")
    } else {
      setAiMetadataDraft(null)
      setAiMetadataStatus("missing")
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      if (mode === "edit") {
        setAiMetadataStatus("loading")
      }
      try {
        const [categoriesData, item, aiMetadata] = await Promise.all([
          fetchAdminMenuCategoriesOptions(),
          mode === "edit" && itemId
            ? fetchAdminMenuItemById(itemId)
            : Promise.resolve(null),
          mode === "edit" && itemId
            ? fetchAiMetadataOrNull(itemId)
            : Promise.resolve(null),
        ])

        setCategories(categoriesData)

        if (mode === "create") {
          setInitialFormDataState({ ...initialFormData })
        }

        if (item) {
          const loadedFormData: MenuItemFormData = {
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
            discountEnabled: item.discount != null,
            discountType: item.discount?.discountType ?? "PERCENT",
            discountValue: item.discount ? String(item.discount.discountValue) : "",
          }
          setFormData(loadedFormData)
          if (mode === "edit") {
            setInitialFormDataState(loadedFormData)
          }
        }

        if (mode === "edit") {
          if (aiMetadata) {
            setAiMetadataDraft(aiMetadataToDraft(aiMetadata))
            setAiMetadataStatus("present")
          } else {
            setAiMetadataDraft(null)
            setAiMetadataStatus("missing")
          }
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

  const isDirty = useMemo(() => {
    if (!initialFormDataState) return false
    return !isFormDataEqual(formData, initialFormDataState)
  }, [formData, initialFormDataState])

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

    const priceValue = formData.price.trim().replace(",", ".")
    const parsedPrice = priceValue === "" ? null : Number(priceValue)
    if (parsedPrice == null || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      newErrors.price = "Ingresa un precio válido"
    }

    if (imageUrlBlocked) {
      newErrors.imageUrl = "Revisa la URL de la imagen"
    }

    if (formData.discountEnabled) {
      const dv = Number(formData.discountValue.trim().replace(",", "."))
      if (!formData.discountValue.trim() || !Number.isFinite(dv) || dv <= 0) {
        newErrors.discountValue = "Ingresa un valor de descuento válido"
      } else if (formData.discountType === "PERCENT" && dv > 100) {
        newErrors.discountValue = "El porcentaje de descuento no puede superar el 100%"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Por favor corrige los errores del formulario")
      return
    }

    if (!isDirty) {
      toast.info(
        mode === "create" ? "Completá el formulario para crear el producto" : "No hay cambios para guardar",
      )
      return
    }

    setIsSaving(true)

    try {
      const priceValue = Number(formData.price.trim().replace(",", "."))

      const discountPayload = formData.discountEnabled
        ? {
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue.trim().replace(",", ".")),
          }
        : null

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        categoryId: formData.categoryId,
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
        discount: discountPayload,
      }

      let savedId: string
      if (mode === "create") {
        const created = await createAdminMenuItem(payload)
        savedId = created.id
      } else {
        await patchAdminMenuItem(itemId!, payload)
        savedId = itemId!
        setInitialFormDataState({ ...formData })
      }

      toast.success(
        mode === "create"
          ? "Producto creado correctamente"
          : "Cambios guardados correctamente"
      )
      setSavedItemId(savedId)
      setAiModalSource("generate")
      setAiModalDismissible(false)
      setAiModalInitialDraft(undefined)
      setRedirectAfterAiSave(true)
      setAiModalOpen(true)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string })?.message ?? e.message
        : "Error al guardar el producto"
      toast.error(typeof msg === "string" ? msg : "Error al guardar el producto")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSave()
  }

  const handleCancel = () => {
    if (mode === "create") {
      router.push("/menu-items")
      return
    }

    if (!initialFormDataState) return
    setFormData(initialFormDataState)
    setErrors({})
    toast.info("Cambios descartados")
  }

  const handleAiDone = async () => {
    setAiModalOpen(false)
    setAiModalInitialDraft(undefined)

    if (mode === "edit" && itemId) {
      try {
        await refreshAiMetadataStatus(itemId)
      } catch {
        // El guardado ya fue exitoso; el tag se actualizará en la próxima carga.
      }
    }

    if (redirectAfterAiSave) {
      router.push("/menu-items")
      router.refresh()
    }
  }

  const handleAiCancel = () => {
    setAiModalOpen(false)
    setAiModalInitialDraft(undefined)
  }

  const openEditAiModal = () => {
    if (!itemId || !aiMetadataDraft) return
    setSavedItemId(itemId)
    setAiModalSource("edit-existing")
    setAiModalDismissible(true)
    setAiModalInitialDraft(aiMetadataDraft)
    setRedirectAfterAiSave(false)
    setAiModalOpen(true)
  }

  const handleAiStatusTagClick = () => {
    if (mode !== "edit" || !itemId || aiMetadataStatus === "loading") return

    if (aiMetadataStatus === "present") {
      openEditAiModal()
      return
    }

    setConfirmGenerateOpen(true)
  }

  const handleConfirmGenerate = () => {
    if (!itemId) return
    setConfirmGenerateOpen(false)
    setSavedItemId(itemId)
    setAiModalSource("generate")
    setAiModalDismissible(false)
    setAiModalInitialDraft(undefined)
    setRedirectAfterAiSave(false)
    setAiModalOpen(true)
  }

  if (isLoading) {
    return <MenuItemFormSkeleton />
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-28">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/menu-items">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === "create" ? "Nuevo producto" : "Editar producto"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "Completa los datos para agregar un nuevo producto al menú"
                : "Modifica los datos del producto"}
            </p>
          </div>
          {mode === "edit" && (
            <AiMetadataStatusTag
              status={aiMetadataStatus}
              onClick={handleAiStatusTagClick}
              disabled={isSaving}
            />
          )}
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

          {/* Discount */}
          <FormSection
            title="Descuento"
            description="Aplica un descuento sobre el precio del producto"
          >
            <ToggleSwitch
              id="discountEnabled"
              label="Activar descuento"
              description="Aplica un descuento visible en el menú"
              checked={formData.discountEnabled}
              onCheckedChange={(checked) => {
                updateField("discountEnabled", checked)
                if (!checked) {
                  setErrors((prev) => ({ ...prev, discountValue: undefined }))
                }
              }}
              disabled={isSaving}
            />
            <div className={`flex flex-col gap-3 ${formData.discountEnabled ? "" : "opacity-50 pointer-events-none"}`}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="discountType">Tipo de descuento</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) =>
                    updateField("discountType", value as "PERCENT" | "FIXED")
                  }
                  disabled={isSaving || !formData.discountEnabled}
                >
                  <SelectTrigger id="discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Porcentaje (%)</SelectItem>
                    <SelectItem value="FIXED">Monto fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="discountValue"
                  className={errors.discountValue ? "text-destructive" : ""}
                >
                  {formData.discountType === "PERCENT"
                    ? "Porcentaje (0–100)"
                    : "Monto fijo"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min={0}
                  max={formData.discountType === "PERCENT" ? 100 : undefined}
                  step="any"
                  placeholder={
                    formData.discountType === "PERCENT" ? "Ej: 15" : "Ej: 500"
                  }
                  value={formData.discountValue}
                  onChange={(e) => {
                    updateField("discountValue", e.target.value)
                    setErrors((prev) => ({ ...prev, discountValue: undefined }))
                  }}
                  disabled={isSaving || !formData.discountEnabled}
                  aria-invalid={!!errors.discountValue}
                  className={errors.discountValue ? "border-destructive" : ""}
                />
                {errors.discountValue && (
                  <p className="text-sm text-destructive">
                    {errors.discountValue}
                  </p>
                )}
              </div>
            </div>
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

      <SettingsFormFooter
        isDirty={isDirty}
        isSaving={isSaving}
        dirtyMessage={
          mode === "create"
            ? MENU_ITEM_CREATE_UNSAVED_MESSAGE
            : MENU_ITEM_UNSAVED_MESSAGE
        }
        saveLabel={mode === "create" ? "Crear producto" : "Guardar cambios"}
        onSave={() => void handleSave()}
        onCancel={handleCancel}
      />

      {savedItemId && (
        <AiEnrichmentModal
          open={aiModalOpen}
          menuItemId={savedItemId}
          menuItemName={formData.name}
          source={aiModalSource}
          dismissible={aiModalDismissible}
          initialDraft={aiModalInitialDraft}
          onDone={() => void handleAiDone()}
          onCancel={handleAiCancel}
        />
      )}

      {mode === "edit" && (
        <ConfirmAiGenerationDialog
          open={confirmGenerateOpen}
          productName={formData.name}
          onOpenChange={setConfirmGenerateOpen}
          onConfirm={handleConfirmGenerate}
        />
      )}
    </form>
  )
}

function MenuItemFormSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-28">
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
