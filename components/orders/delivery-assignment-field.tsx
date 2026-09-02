"use client"

import { useCallback, useEffect, useState } from "react"
import { isAxiosError } from "axios"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchDeliveryBusinessUsers } from "@/lib/requests/business-users"
import type { BusinessUser } from "@/lib/requests/business-users"
import { patchAdminOrderDeliveryAssignment } from "@/lib/requests/orders"
import {
  orderIsDeliveryFulfillment,
  type AssignedDeliveryUser,
  type Order,
} from "@/lib/data"

const UNASSIGNED_VALUE = "__unassigned__"

function deliveryUserLabel(user: AssignedDeliveryUser | BusinessUser): string {
  const name = "name" in user ? user.name?.trim() : null
  const email = user.email?.trim()
  if (name) return name
  if (email) return email
  return "Repartidor"
}

interface OrderDeliveryAssignmentFieldProps {
  order: Order
  canAssign: boolean
  onOrderPatched: (order: Order) => void
}

export function OrderDeliveryAssignmentField({
  order,
  canAssign,
  onOrderPatched,
}: OrderDeliveryAssignmentFieldProps) {
  const [deliveryUsers, setDeliveryUsers] = useState<BusinessUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState(
    order.assignedDeliveryUser?.id ?? UNASSIGNED_VALUE,
  )

  const isShippedOrLater =
    order.status === "shipped" || order.status === "delivered"
  const showAssignment =
    orderIsDeliveryFulfillment(order) && isShippedOrLater

  useEffect(() => {
    setSelectedId(order.assignedDeliveryUser?.id ?? UNASSIGNED_VALUE)
  }, [order.assignedDeliveryUser?.id, order.id])

  const loadDeliveryUsers = useCallback(async () => {
    setLoadingUsers(true)
    try {
      const users = await fetchDeliveryBusinessUsers()
      setDeliveryUsers(users)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string })?.message ?? e.message
        : "No se pudieron cargar los repartidores"
      toast.error(typeof msg === "string" ? msg : "No se pudieron cargar los repartidores")
    } finally {
      setLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    if (!showAssignment || !canAssign) return
    void loadDeliveryUsers()
  }, [showAssignment, canAssign, loadDeliveryUsers])

  if (!showAssignment) return null

  const assigned = order.assignedDeliveryUser

  const handleSave = async () => {
    const nextId =
      selectedId === UNASSIGNED_VALUE ? null : selectedId
    if (nextId === (assigned?.id ?? null)) return

    setSaving(true)
    try {
      const updated = await patchAdminOrderDeliveryAssignment(order.id, nextId)
      onOrderPatched(updated)
      toast.success(
        nextId ? "Repartidor asignado" : "Repartidor desasignado",
      )
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string })?.message ?? e.message
        : "No se pudo actualizar la asignación"
      toast.error(typeof msg === "string" ? msg : "No se pudo actualizar la asignación")
    } finally {
      setSaving(false)
    }
  }

  const hasChanges =
    (selectedId === UNASSIGNED_VALUE ? null : selectedId) !==
    (assigned?.id ?? null)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium leading-none">Repartidor</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Asigná quién entrega este pedido cuando está en camino.
        </p>
      </div>

      {canAssign ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid min-w-[12rem] flex-1 gap-2">
            <Label htmlFor={`delivery-user-${order.id}`}>Personal delivery</Label>
            <Select
              value={selectedId}
              onValueChange={setSelectedId}
              disabled={loadingUsers || saving}
            >
              <SelectTrigger id={`delivery-user-${order.id}`}>
                <SelectValue
                  placeholder={
                    loadingUsers ? "Cargando…" : "Seleccionar repartidor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_VALUE}>Sin asignar</SelectItem>
                {deliveryUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {deliveryUserLabel(user)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            disabled={!hasChanges || saving || loadingUsers}
            onClick={() => void handleSave()}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar asignación"
            )}
          </Button>
        </div>
      ) : assigned ? (
        <p className="text-sm font-medium">{deliveryUserLabel(assigned)}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Sin repartidor asignado</p>
      )}

      {canAssign && !loadingUsers && deliveryUsers.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No hay usuarios con rol delivery. Creá uno en Usuarios.
        </p>
      ) : null}
    </div>
  )
}
