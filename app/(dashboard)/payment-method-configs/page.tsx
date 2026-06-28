"use client"

import { useCallback, useEffect, useState } from "react"
import { isAxiosError } from "axios"
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Separator } from "@/components/ui/separator"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  type AdminPaymentMethodConfig,
  type CreatePaymentMethodConfigPayload,
  type UpdatePaymentMethodConfigPayload,
  createPaymentMethodConfig,
  deletePaymentMethodConfig,
  fetchPaymentMethodConfigs,
  updatePaymentMethodConfig,
} from "@/lib/requests/payment-method-configs"
import { CreditCard } from "lucide-react"

const COMMON_PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "online", label: "Online" },
  { value: "transfer", label: "Transferencia" },
]

interface FormState {
  paymentMethod: string
  label: string
  adjustmentType: "PERCENT" | "FIXED"
  adjustmentValue: string
  isSurcharge: boolean
  isActive: boolean
}

const emptyForm: FormState = {
  paymentMethod: "",
  label: "",
  adjustmentType: "PERCENT",
  adjustmentValue: "",
  isSurcharge: false,
  isActive: true,
}

interface FormErrors {
  paymentMethod?: string
  label?: string
  adjustmentValue?: string
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!form.paymentMethod.trim()) {
    errors.paymentMethod = "El identificador del método es requerido"
  }
  if (!form.label.trim()) {
    errors.label = "La etiqueta es requerida"
  }
  const val = Number(form.adjustmentValue.trim().replace(",", "."))
  if (!form.adjustmentValue.trim() || !Number.isFinite(val) || val <= 0) {
    errors.adjustmentValue = "Ingresa un valor válido mayor a cero"
  } else if (form.adjustmentType === "PERCENT" && val > 100) {
    errors.adjustmentValue = "El porcentaje no puede superar el 100%"
  }
  return errors
}

function formatAdjustment(config: AdminPaymentMethodConfig): string {
  const prefix = config.isSurcharge ? "+" : "−"
  if (config.adjustmentType === "PERCENT") {
    return `${prefix}${config.adjustmentValue}%`
  }
  return `${prefix}$${config.adjustmentValue}`
}

export default function PaymentMethodConfigsPage() {
  const [configs, setConfigs] = useState<AdminPaymentMethodConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AdminPaymentMethodConfig | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminPaymentMethodConfig | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadConfigs = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchPaymentMethodConfigs()
      setConfigs(data)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudo cargar la configuración"
      toast.error(typeof msg === "string" && msg ? msg : "No se pudo cargar la configuración")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConfigs()
  }, [loadConfigs])

  const openCreate = () => {
    setEditingConfig(null)
    setForm(emptyForm)
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEdit = (config: AdminPaymentMethodConfig) => {
    setEditingConfig(config)
    setForm({
      paymentMethod: config.paymentMethod,
      label: config.label,
      adjustmentType: config.adjustmentType,
      adjustmentValue: String(config.adjustmentValue),
      isSurcharge: config.isSurcharge,
      isActive: config.isActive,
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  const updateFormField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSave = async () => {
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error("Por favor corrige los errores del formulario")
      return
    }

    setIsSaving(true)
    try {
      const adjustmentValue = Number(form.adjustmentValue.trim().replace(",", "."))
      if (editingConfig) {
        const payload: UpdatePaymentMethodConfigPayload = {
          paymentMethod: form.paymentMethod.trim(),
          label: form.label.trim(),
          adjustmentType: form.adjustmentType,
          adjustmentValue,
          isSurcharge: form.isSurcharge,
          isActive: form.isActive,
        }
        const updated = await updatePaymentMethodConfig(editingConfig.id, payload)
        setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        toast.success("Configuración actualizada")
      } else {
        const payload: CreatePaymentMethodConfigPayload = {
          paymentMethod: form.paymentMethod.trim(),
          label: form.label.trim(),
          adjustmentType: form.adjustmentType,
          adjustmentValue,
          isSurcharge: form.isSurcharge,
          isActive: form.isActive,
        }
        const created = await createPaymentMethodConfig(payload)
        setConfigs((prev) => [...prev, created])
        toast.success("Configuración creada")
      }
      setDialogOpen(false)
    } catch (e) {
      const errData = isAxiosError(e)
        ? (e.response?.data as { error?: string | { fieldErrors?: Record<string, string[]> }; message?: string })
        : null
      if (errData?.error && typeof errData.error === "object" && errData.error.fieldErrors) {
        const fe = errData.error.fieldErrors
        const newErrors: FormErrors = {}
        if (fe.adjustmentValue?.length) newErrors.adjustmentValue = fe.adjustmentValue[0]
        if (fe.paymentMethod?.length) newErrors.paymentMethod = fe.paymentMethod[0]
        if (fe.label?.length) newErrors.label = fe.label[0]
        setFormErrors(newErrors)
        toast.error("Corrige los errores del formulario")
      } else {
        const msg = errData?.message ?? (typeof errData?.error === "string" ? errData.error : null) ?? "Error al guardar"
        toast.error(msg)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deletePaymentMethodConfig(deleteTarget.id)
      setConfigs((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      toast.success("Configuración eliminada")
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string })?.message ?? e.message
        : "Error al eliminar"
      toast.error(typeof msg === "string" ? msg : "Error al eliminar")
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleToggleActive = async (config: AdminPaymentMethodConfig) => {
    setTogglingId(config.id)
    try {
      const updated = await updatePaymentMethodConfig(config.id, {
        isActive: !config.isActive,
      })
      setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string })?.message ?? e.message
        : "Error al actualizar"
      toast.error(typeof msg === "string" ? msg : "Error al actualizar")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Ajustes por método de pago
          </h1>
          <p className="text-muted-foreground">
            Configura descuentos o recargos según el método de pago elegido por el cliente.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Agregar ajuste
        </Button>
      </div>

      {isLoading ? (
        <PaymentMethodConfigsSkeleton />
      ) : configs.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CreditCard />
            </EmptyMedia>
            <EmptyTitle>Sin ajustes configurados</EmptyTitle>
            <EmptyDescription>
              Agrega un ajuste para aplicar descuentos o recargos según el método de pago.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {configs.map((config) => (
            <Card key={config.id} className={config.isActive ? "" : "opacity-60"}>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 pb-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{config.label}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {config.paymentMethod}
                    </Badge>
                    <Badge
                      variant={config.isSurcharge ? "destructive" : "secondary"}
                      className={
                        config.isSurcharge
                          ? ""
                          : "text-green-700 dark:text-green-400"
                      }
                    >
                      {config.isSurcharge ? "Recargo" : "Descuento"}
                    </Badge>
                    {!config.isActive && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.adjustmentType === "PERCENT" ? "Porcentaje" : "Monto fijo"}{" "}
                    ·{" "}
                    <span className="font-medium tabular-nums">
                      {formatAdjustment(config)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={config.isActive}
                    onCheckedChange={() => void handleToggleActive(config)}
                    disabled={togglingId === config.id}
                    aria-label={config.isActive ? "Desactivar" : "Activar"}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => openEdit(config)}
                  >
                    <Pencil className="size-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(config)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Editar ajuste" : "Nuevo ajuste de pago"}
            </DialogTitle>
            <DialogDescription>
              {editingConfig
                ? "Modifica la configuración de ajuste por método de pago."
                : "Configura un descuento o recargo para un método de pago específico."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* paymentMethod */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="paymentMethod"
                className={formErrors.paymentMethod ? "text-destructive" : ""}
              >
                Identificador del método
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="paymentMethod"
                list="paymentMethodSuggestions"
                placeholder="Ej: cash, online, transfer"
                value={form.paymentMethod}
                onChange={(e) => updateFormField("paymentMethod", e.target.value)}
                disabled={isSaving}
                aria-invalid={!!formErrors.paymentMethod}
                className={formErrors.paymentMethod ? "border-destructive" : ""}
              />
              <datalist id="paymentMethodSuggestions">
                {COMMON_PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Valores comunes: cash, online, transfer. Podés ingresar un valor personalizado.
              </p>
              {formErrors.paymentMethod && (
                <p className="text-sm text-destructive">{formErrors.paymentMethod}</p>
              )}
            </div>

            {/* label */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="configLabel"
                className={formErrors.label ? "text-destructive" : ""}
              >
                Etiqueta visible
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="configLabel"
                placeholder="Ej: Descuento pago en efectivo"
                value={form.label}
                onChange={(e) => updateFormField("label", e.target.value)}
                disabled={isSaving}
                aria-invalid={!!formErrors.label}
                className={formErrors.label ? "border-destructive" : ""}
              />
              {formErrors.label && (
                <p className="text-sm text-destructive">{formErrors.label}</p>
              )}
            </div>

            {/* adjustmentType + adjustmentValue */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="adjustmentType">Tipo</Label>
                <Select
                  value={form.adjustmentType}
                  onValueChange={(v) =>
                    updateFormField("adjustmentType", v as "PERCENT" | "FIXED")
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger id="adjustmentType">
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
                  htmlFor="adjustmentValue"
                  className={formErrors.adjustmentValue ? "text-destructive" : ""}
                >
                  Valor
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="adjustmentValue"
                  type="number"
                  min={0}
                  max={form.adjustmentType === "PERCENT" ? 100 : undefined}
                  step="any"
                  placeholder={form.adjustmentType === "PERCENT" ? "Ej: 5" : "Ej: 200"}
                  value={form.adjustmentValue}
                  onChange={(e) => updateFormField("adjustmentValue", e.target.value)}
                  disabled={isSaving}
                  aria-invalid={!!formErrors.adjustmentValue}
                  className={formErrors.adjustmentValue ? "border-destructive" : ""}
                />
              </div>
            </div>
            {formErrors.adjustmentValue && (
              <p className="text-sm text-destructive -mt-2">{formErrors.adjustmentValue}</p>
            )}

            <Separator />

            {/* isSurcharge */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="isSurcharge" className="cursor-pointer">
                  ¿Es un recargo?
                </Label>
                <p className="text-sm text-muted-foreground">
                  Activado = recargo adicional · Desactivado = descuento
                </p>
              </div>
              <Switch
                id="isSurcharge"
                checked={form.isSurcharge}
                onCheckedChange={(v) => updateFormField("isSurcharge", v)}
                disabled={isSaving}
              />
            </div>

            {/* isActive */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="isActive" className="cursor-pointer">
                  Activo
                </Label>
                <p className="text-sm text-muted-foreground">
                  Si está desactivado, no se aplicará a los pedidos
                </p>
              </div>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => updateFormField("isActive", v)}
                disabled={isSaving}
              />
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving
                  ? "Guardando…"
                  : editingConfig
                    ? "Guardar cambios"
                    : "Crear ajuste"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ajuste?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la configuración{" "}
              <strong>{deleteTarget?.label}</strong> ({deleteTarget?.paymentMethod}).
              No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PaymentMethodConfigsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center justify-between pt-4 pb-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-9 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
