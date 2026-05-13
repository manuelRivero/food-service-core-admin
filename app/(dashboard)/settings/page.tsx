"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SettingsSection } from "@/components/settings/settings-section"
import { ToggleField } from "@/components/settings/toggle-field"
import { NumberInputField } from "@/components/settings/number-input-field"
import {
  fetchAdminBusinessConfig,
  patchAdminBusinessConfig,
  resetAdminBusinessConfig,
  type AdminBusinessConfig,
  type AdminBusinessConfigPatch,
} from "@/lib/requests/business-config"

type SettingsData = AdminBusinessConfig

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [initialSettings, setInitialSettings] = useState<SettingsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const loadConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchAdminBusinessConfig()
      setSettings(data)
      setInitialSettings(data)
    } catch (e) {
      const message = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudo cargar la configuración."
      toast.error(typeof message === "string" && message ? message : "No se pudo cargar la configuración.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const patchPayload = useMemo<AdminBusinessConfigPatch>(() => {
    if (!settings || !initialSettings) return {}
    const entries = Object.entries(settings).filter(([key, value]) => {
      const typedKey = key as keyof SettingsData
      return value !== initialSettings[typedKey]
    })
    return Object.fromEntries(entries) as AdminBusinessConfigPatch
  }, [settings, initialSettings])

  const isDirty = Object.keys(patchPayload).length > 0

  const validate = (): boolean => {
    if (!settings) return false

    const requiredPositive: Array<keyof SettingsData> = [
      "idle_reminder_minutes",
      "idle_close_minutes",
      "draft_order_reminder_minutes",
      "draft_order_expire_minutes",
      "reservation_max_days_ahead",
      "reservation_default_duration_minutes",
    ]
    for (const key of requiredPositive) {
      const value = settings[key]
      if (typeof value !== "number" || value <= 0) {
        toast.error("Hay campos numéricos inválidos. Revisa valores mayores a 0.")
        return false
      }
    }

    if (
      settings.human_handoff_auto_timeout_minutes != null &&
      settings.human_handoff_auto_timeout_minutes <= 0
    ) {
      toast.error("El timeout de handoff humano debe ser mayor a 0 o vacío.")
      return false
    }

    if (
      typeof settings.reservation_min_lead_minutes !== "number" ||
      settings.reservation_min_lead_minutes < 0
    ) {
      toast.error("El tiempo mínimo de anticipación debe ser mayor o igual a 0.")
      return false
    }

    if (!settings.delivery_enabled && !settings.takeaway_enabled) {
      toast.error(
        "No podés desactivar envío y retiro a la vez: dejá al menos uno habilitado.",
      )
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!settings) return
    if (!isDirty) {
      toast.info("No hay cambios para guardar")
      return
    }
    if (!validate()) return

    setIsSaving(true)
    try {
      const updated = await patchAdminBusinessConfig(patchPayload)
      setSettings(updated)
      setInitialSettings(updated)
      toast.success("Configuración guardada correctamente")
    } catch (e) {
      const message = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "Error al guardar la configuración"
      toast.error(typeof message === "string" && message ? message : "Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (!initialSettings) return
    setSettings(initialSettings)
    toast.info("Cambios descartados")
  }

  const handleResetDefaults = async () => {
    setIsResetting(true)
    try {
      await resetAdminBusinessConfig()
      const refreshed = await fetchAdminBusinessConfig()
      setSettings(refreshed)
      setInitialSettings(refreshed)
      toast.success("Configuración restaurada a valores por defecto")
    } catch (e) {
      const message = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudo restaurar la configuración por defecto."
      toast.error(typeof message === "string" && message ? message : "No se pudo restaurar la configuración por defecto.")
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Configura el comportamiento del negocio, automatización, entrega y reservas
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Bot & Automation */}
        <SettingsSection
          title="Bot y Automatización"
          description="Configura las respuestas automáticas del bot"
        >
          <ToggleField
            id="bot-enabled"
            label="Habilitar Bot"
            description="Activar respuestas automáticas para los clientes"
            checked={settings.bot_enabled}
            onCheckedChange={(checked) => updateSetting("bot_enabled", checked)}
          />
        </SettingsSection>

        {/* Human Handoff */}
        <SettingsSection
          title="Transferencia a Humano"
          description="Permite que las conversaciones sean atendidas por un agente"
        >
          <ToggleField
            id="allow-human-handoff"
            label="Permitir Soporte Humano"
            description="Permitir transferir conversaciones a un agente humano"
            checked={settings.allow_human_handoff}
            onCheckedChange={(checked) =>
              updateSetting("allow_human_handoff", checked)
            }
          />
          <NumberInputField
            id="auto-timeout"
            label="Volver al Bot Después de (minutos)"
            description="Tiempo antes de regresar automáticamente al bot"
            value={settings.human_handoff_auto_timeout_minutes}
            onChange={(value) => updateSetting("human_handoff_auto_timeout_minutes", value)}
            disabled={!settings.allow_human_handoff}
            placeholder="Dejar vacío para desactivar"
            min={1}
          />
        </SettingsSection>

        {/* Idle & Reminders */}
        <SettingsSection
          title="Inactividad y Recordatorios"
          description="Configura los recordatorios por inactividad"
        >
          <ToggleField
            id="send-idle-reminders"
            label="Enviar Recordatorios de Inactividad"
            description="Notificar al cliente cuando está inactivo"
            checked={settings.send_idle_reminders}
            onCheckedChange={(checked) =>
              updateSetting("send_idle_reminders", checked)
            }
          />
          <NumberInputField
            id="idle-reminder-delay"
            label="Recordatorio Después de (minutos)"
            description="Tiempo de inactividad antes de enviar recordatorio"
            value={settings.idle_reminder_minutes}
            onChange={(value) =>
              updateSetting("idle_reminder_minutes", value ?? 1)
            }
            disabled={!settings.send_idle_reminders}
            min={1}
          />
          <NumberInputField
            id="auto-close-conversation"
            label="Cerrar Conversación Después de (minutos)"
            description="Tiempo de inactividad antes de cerrar la conversación"
            value={settings.idle_close_minutes}
            onChange={(value) =>
              updateSetting("idle_close_minutes", value ?? 1)
            }
            min={1}
          />
        </SettingsSection>

        {/* Order Reminders */}
        <SettingsSection
          title="Recordatorios de Pedidos"
          description="Configura los recordatorios para pedidos pendientes"
        >
          <ToggleField
            id="send-order-reminders"
            label="Enviar Recordatorios de Pedidos"
            description="Notificar sobre pedidos pendientes de completar"
            checked={settings.send_order_reminders}
            onCheckedChange={(checked) =>
              updateSetting("send_order_reminders", checked)
            }
          />
          <NumberInputField
            id="draft-order-reminder-delay"
            label="Recordatorio para Pedidos Pendientes (minutos)"
            description="Tiempo antes de recordar sobre un pedido en borrador"
            value={settings.draft_order_reminder_minutes}
            onChange={(value) =>
              updateSetting("draft_order_reminder_minutes", value ?? 1)
            }
            disabled={!settings.send_order_reminders}
            min={1}
          />
          <NumberInputField
            id="draft-order-expiration"
            label="Expirar Pedidos Pendientes Después de (minutos)"
            description="Tiempo antes de expirar automáticamente un pedido en borrador"
            value={settings.draft_order_expire_minutes}
            onChange={(value) =>
              updateSetting("draft_order_expire_minutes", value ?? 1)
            }
            disabled={!settings.send_order_reminders}
            min={1}
          />
        </SettingsSection>

        {/* Pedidos: switches de pedidos/checkout comentados temporalmente
        <SettingsSection
          title="Pedidos"
          description="Configura las opciones de pedidos"
        >
          <ToggleField
            id="orders-enabled"
            label="Habilitar Pedidos"
            description="Permitir que los clientes realicen pedidos"
            checked={settings.orders_enabled}
            onCheckedChange={(checked) =>
              updateSetting("orders_enabled", checked)
            }
          />
          <ToggleField
            id="checkout-enabled"
            label="Habilitar Checkout"
            description="Permitir pagos en línea"
            checked={settings.checkout_enabled}
            onCheckedChange={(checked) =>
              updateSetting("checkout_enabled", checked)
            }
            disabled={!settings.orders_enabled}
          />
        </SettingsSection>
        */}

        <SettingsSection
          title="Entrega y retiro"
          description="Al menos una opción debe estar activa: envío a domicilio o retiro en local"
        >
          <ToggleField
            id="delivery-enabled"
            label="Envío a domicilio"
            description="Permitir pedidos con entrega"
            checked={settings.delivery_enabled}
            onCheckedChange={(checked) => {
              if (!checked && !settings.takeaway_enabled) {
                toast.error(
                  "No podés desactivar envío y retiro a la vez: habilitá retiro en local o dejá el envío activo.",
                )
                return
              }
              updateSetting("delivery_enabled", checked)
            }}
          />
          <ToggleField
            id="takeaway-enabled"
            label="Retiro en local"
            description="Permitir que el cliente retire el pedido en el local"
            checked={settings.takeaway_enabled}
            onCheckedChange={(checked) => {
              if (!checked && !settings.delivery_enabled) {
                toast.error(
                  "No podés desactivar envío y retiro a la vez: habilitá envío a domicilio o dejá el retiro activo.",
                )
                return
              }
              updateSetting("takeaway_enabled", checked)
            }}
          />
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="pickup-instructions"
              className={!settings.takeaway_enabled ? "text-muted-foreground" : ""}
            >
              Instrucciones de retiro (opcional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Texto que verá el cliente al elegir retiro (por ejemplo, acceso o mostrador).
            </p>
            <Textarea
              id="pickup-instructions"
              rows={3}
              placeholder="Ej.: Retirar por el mostrador de la calle lateral."
              value={settings.pickup_instructions ?? ""}
              onChange={(e) => {
                const v = e.target.value
                updateSetting(
                  "pickup_instructions",
                  v.trim() === "" ? null : v,
                )
              }}
              disabled={!settings.takeaway_enabled}
            />
          </div>
        </SettingsSection>

        {/* Reservations */}
        <SettingsSection
          title="Reservaciones"
          description="Configura las opciones de reservaciones"
        >
          <ToggleField
            id="reservations-enabled"
            label="Habilitar Reservaciones"
            description="Permitir que los clientes hagan reservaciones"
            checked={settings.reservations_enabled}
            onCheckedChange={(checked) =>
              updateSetting("reservations_enabled", checked)
            }
          />
          <NumberInputField
            id="min-advance-time"
            label="Tiempo Mínimo de Anticipación (minutos)"
            description="Tiempo mínimo antes de la reservación"
            value={settings.reservation_min_lead_minutes}
            onChange={(value) =>
              updateSetting("reservation_min_lead_minutes", value ?? 0)
            }
            disabled={!settings.reservations_enabled}
            min={0}
          />
          <NumberInputField
            id="max-days-ahead"
            label="Días Máximos de Anticipación"
            description="Máximo de días de anticipación para reservar"
            value={settings.reservation_max_days_ahead}
            onChange={(value) => updateSetting("reservation_max_days_ahead", value ?? 1)}
            disabled={!settings.reservations_enabled}
            min={1}
          />
          <NumberInputField
            id="default-duration"
            label="Duración Predeterminada (minutos)"
            description="Duración por defecto de cada reservación"
            value={settings.reservation_default_duration_minutes}
            onChange={(value) =>
              updateSetting("reservation_default_duration_minutes", value ?? 1)
            }
            disabled={!settings.reservations_enabled}
            min={1}
          />
          <ToggleField
            id="require-confirmation"
            label="Requerir Confirmación"
            description="Las reservaciones requieren confirmación manual"
            checked={settings.reservation_require_confirmation}
            onCheckedChange={(checked) =>
              updateSetting("reservation_require_confirmation", checked)
            }
            disabled={!settings.reservations_enabled}
          />
          <ToggleField
            id="allow-same-day"
            label="Permitir Reservaciones del Mismo Día"
            description="Permitir reservar para el día actual"
            checked={settings.reservation_allow_same_day}
            onCheckedChange={(checked) =>
              updateSetting("reservation_allow_same_day", checked)
            }
            disabled={!settings.reservations_enabled}
          />
        </SettingsSection>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button
          type="button"
          variant="destructive"
          onClick={handleResetDefaults}
          disabled={isSaving || isResetting}
        >
          {isResetting && <Loader2 className="mr-2 size-4 animate-spin" />}
          Restaurar defaults
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving || isResetting || !isDirty}
        >
          Cancelar
        </Button>
        <Button type="button" onClick={handleSave} disabled={isSaving || isResetting || !isDirty}>
          {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
