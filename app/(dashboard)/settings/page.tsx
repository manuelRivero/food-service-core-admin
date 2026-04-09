"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SettingsSection } from "@/components/settings/settings-section"
import { ToggleField } from "@/components/settings/toggle-field"
import { NumberInputField } from "@/components/settings/number-input-field"

interface SettingsData {
  // Bot & Automation
  botEnabled: boolean

  // Human Handoff
  allowHumanHandoff: boolean
  autoTimeoutMinutes: number | null

  // Idle & Reminders
  sendIdleReminders: boolean
  idleReminderDelayMinutes: number | null
  autoCloseConversationMinutes: number | null

  // Order Reminders
  sendOrderReminders: boolean
  draftOrderReminderDelayMinutes: number | null
  draftOrderExpirationMinutes: number | null

  // Orders
  ordersEnabled: boolean
  checkoutEnabled: boolean

  // Reservations
  reservationsEnabled: boolean
  minAdvanceTimeMinutes: number | null
  maxDaysAhead: number | null
  defaultDurationMinutes: number | null
  requireConfirmation: boolean
  allowSameDayReservations: boolean
}

const defaultSettings: SettingsData = {
  botEnabled: true,
  allowHumanHandoff: true,
  autoTimeoutMinutes: 30,
  sendIdleReminders: true,
  idleReminderDelayMinutes: 15,
  autoCloseConversationMinutes: 60,
  sendOrderReminders: true,
  draftOrderReminderDelayMinutes: 30,
  draftOrderExpirationMinutes: 120,
  ordersEnabled: true,
  checkoutEnabled: true,
  reservationsEnabled: true,
  minAdvanceTimeMinutes: 60,
  maxDaysAhead: 30,
  defaultDurationMinutes: 90,
  requireConfirmation: true,
  allowSameDayReservations: false,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Simulate loading initial data
    const timer = setTimeout(() => {
      setSettings(defaultSettings)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Configuración guardada correctamente")
    } catch {
      toast.error("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setSettings(defaultSettings)
    toast.info("Cambios descartados")
  }

  if (isLoading) {
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
          Configura el comportamiento del negocio, automatización y reservas
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
            checked={settings.botEnabled}
            onCheckedChange={(checked) => updateSetting("botEnabled", checked)}
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
            checked={settings.allowHumanHandoff}
            onCheckedChange={(checked) =>
              updateSetting("allowHumanHandoff", checked)
            }
          />
          <NumberInputField
            id="auto-timeout"
            label="Volver al Bot Después de (minutos)"
            description="Tiempo antes de regresar automáticamente al bot"
            value={settings.autoTimeoutMinutes}
            onChange={(value) => updateSetting("autoTimeoutMinutes", value)}
            disabled={!settings.allowHumanHandoff}
            placeholder="Dejar vacío para desactivar"
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
            checked={settings.sendIdleReminders}
            onCheckedChange={(checked) =>
              updateSetting("sendIdleReminders", checked)
            }
          />
          <NumberInputField
            id="idle-reminder-delay"
            label="Recordatorio Después de (minutos)"
            description="Tiempo de inactividad antes de enviar recordatorio"
            value={settings.idleReminderDelayMinutes}
            onChange={(value) =>
              updateSetting("idleReminderDelayMinutes", value)
            }
            disabled={!settings.sendIdleReminders}
          />
          <NumberInputField
            id="auto-close-conversation"
            label="Cerrar Conversación Después de (minutos)"
            description="Tiempo de inactividad antes de cerrar la conversación"
            value={settings.autoCloseConversationMinutes}
            onChange={(value) =>
              updateSetting("autoCloseConversationMinutes", value)
            }
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
            checked={settings.sendOrderReminders}
            onCheckedChange={(checked) =>
              updateSetting("sendOrderReminders", checked)
            }
          />
          <NumberInputField
            id="draft-order-reminder-delay"
            label="Recordatorio para Pedidos Pendientes (minutos)"
            description="Tiempo antes de recordar sobre un pedido en borrador"
            value={settings.draftOrderReminderDelayMinutes}
            onChange={(value) =>
              updateSetting("draftOrderReminderDelayMinutes", value)
            }
            disabled={!settings.sendOrderReminders}
          />
          <NumberInputField
            id="draft-order-expiration"
            label="Expirar Pedidos Pendientes Después de (minutos)"
            description="Tiempo antes de expirar automáticamente un pedido en borrador"
            value={settings.draftOrderExpirationMinutes}
            onChange={(value) =>
              updateSetting("draftOrderExpirationMinutes", value)
            }
            disabled={!settings.sendOrderReminders}
          />
        </SettingsSection>

        {/* Orders */}
        <SettingsSection
          title="Pedidos"
          description="Configura las opciones de pedidos"
        >
          <ToggleField
            id="orders-enabled"
            label="Habilitar Pedidos"
            description="Permitir que los clientes realicen pedidos"
            checked={settings.ordersEnabled}
            onCheckedChange={(checked) =>
              updateSetting("ordersEnabled", checked)
            }
          />
          <ToggleField
            id="checkout-enabled"
            label="Habilitar Checkout"
            description="Permitir pagos en línea"
            checked={settings.checkoutEnabled}
            onCheckedChange={(checked) =>
              updateSetting("checkoutEnabled", checked)
            }
            disabled={!settings.ordersEnabled}
          />
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
            checked={settings.reservationsEnabled}
            onCheckedChange={(checked) =>
              updateSetting("reservationsEnabled", checked)
            }
          />
          <NumberInputField
            id="min-advance-time"
            label="Tiempo Mínimo de Anticipación (minutos)"
            description="Tiempo mínimo antes de la reservación"
            value={settings.minAdvanceTimeMinutes}
            onChange={(value) =>
              updateSetting("minAdvanceTimeMinutes", value)
            }
            disabled={!settings.reservationsEnabled}
          />
          <NumberInputField
            id="max-days-ahead"
            label="Días Máximos de Anticipación"
            description="Máximo de días de anticipación para reservar"
            value={settings.maxDaysAhead}
            onChange={(value) => updateSetting("maxDaysAhead", value)}
            disabled={!settings.reservationsEnabled}
          />
          <NumberInputField
            id="default-duration"
            label="Duración Predeterminada (minutos)"
            description="Duración por defecto de cada reservación"
            value={settings.defaultDurationMinutes}
            onChange={(value) =>
              updateSetting("defaultDurationMinutes", value)
            }
            disabled={!settings.reservationsEnabled}
          />
          <ToggleField
            id="require-confirmation"
            label="Requerir Confirmación"
            description="Las reservaciones requieren confirmación manual"
            checked={settings.requireConfirmation}
            onCheckedChange={(checked) =>
              updateSetting("requireConfirmation", checked)
            }
            disabled={!settings.reservationsEnabled}
          />
          <ToggleField
            id="allow-same-day"
            label="Permitir Reservaciones del Mismo Día"
            description="Permitir reservar para el día actual"
            checked={settings.allowSameDayReservations}
            onCheckedChange={(checked) =>
              updateSetting("allowSameDayReservations", checked)
            }
            disabled={!settings.reservationsEnabled}
          />
        </SettingsSection>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
