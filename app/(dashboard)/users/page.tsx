"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { isAxiosError } from "axios"
import { Eye, Pencil, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getUserIdFromCookie, getUserRoleFromCookie } from "@/lib/auth"
import type { UserRole } from "@/lib/access-control"
import {
  ASSIGNABLE_BUSINESS_USER_ROLES,
  type AssignableBusinessUserRole,
  type BusinessUser,
  createBusinessUser,
  deleteBusinessUser,
  fetchBusinessUserById,
  fetchBusinessUsers,
  normalizeBusinessUserName,
  updateBusinessUser,
} from "@/lib/requests/business-users"

const ROLE_LABELS: Record<AssignableBusinessUserRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  STAFF: "Personal",
  DELIVERY: "Repartidor",
}

const ROLE_BADGE_VARIANT: Record<
  AssignableBusinessUserRole,
  "default" | "secondary" | "outline" | "destructive"
> = {
  OWNER: "default",
  ADMIN: "secondary",
  STAFF: "outline",
  DELIVERY: "outline",
}

interface FormState {
  email: string
  name: string
  role: AssignableBusinessUserRole
  password: string
}

const emptyForm: FormState = {
  email: "",
  name: "",
  role: "STAFF",
  password: "",
}

interface FormErrors {
  email?: string
  name?: string
  role?: string
  password?: string
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function displayName(user: Pick<BusinessUser, "name" | "email">): string {
  return user.name?.trim() || user.email
}

function getAxiosErrorMessage(e: unknown, fallback: string): string {
  if (!isAxiosError(e)) return fallback
  const data = e.response?.data as
    | { message?: string; error?: string; code?: string }
    | undefined
  const msg = data?.message ?? data?.error ?? e.message
  return typeof msg === "string" && msg ? msg : fallback
}

function rolesForActor(actorRole: UserRole): AssignableBusinessUserRole[] {
  if (actorRole === "OWNER") return [...ASSIGNABLE_BUSINESS_USER_ROLES]
  return ASSIGNABLE_BUSINESS_USER_ROLES.filter((role) => role !== "OWNER")
}

function canManageUser(
  actorRole: UserRole,
  actorUserId: string | null,
  target: BusinessUser,
): boolean {
  if (actorUserId && target.userId === actorUserId) return false
  if (actorRole === "OWNER") return true
  if (actorRole === "ADMIN" && target.role !== "OWNER") return true
  return false
}

function validateCreateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}
  const email = form.email.trim().toLowerCase()
  if (!email) {
    errors.email = "El email es requerido"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Ingresá un email válido"
  }

  const name = normalizeBusinessUserName(form.name)
  if (!name) {
    errors.name = "El nombre es requerido"
  } else if (name.length > 120) {
    errors.name = "El nombre no puede superar 120 caracteres"
  }

  if (!form.role) {
    errors.role = "Seleccioná un rol"
  }

  const password = form.password.trim()
  if (password && password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres"
  }

  return errors
}

function validateEditForm(form: FormState): FormErrors {
  const errors: FormErrors = {}
  const name = normalizeBusinessUserName(form.name)
  if (!name) {
    errors.name = "El nombre es requerido"
  } else if (name.length > 120) {
    errors.name = "El nombre no puede superar 120 caracteres"
  }

  if (!form.role) {
    errors.role = "Seleccioná un rol"
  }

  const password = form.password.trim()
  if (password && password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres"
  }

  return errors
}

export default function UsersPage() {
  const [users, setUsers] = useState<BusinessUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actorRole, setActorRole] = useState<UserRole>("UNKNOWN")
  const [actorUserId, setActorUserId] = useState<string | null>(null)

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const [viewUser, setViewUser] = useState<BusinessUser | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [isViewLoading, setIsViewLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<BusinessUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const assignableRoles = useMemo(
    () => rolesForActor(actorRole),
    [actorRole],
  )

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchBusinessUsers()
      setUsers(data)
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, "No se pudieron cargar los usuarios"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setActorRole(getUserRoleFromCookie())
    setActorUserId(getUserIdFromCookie())
    void loadUsers()
  }, [loadUsers])

  const openCreate = () => {
    setEditingUser(null)
    setForm({
      ...emptyForm,
      role: assignableRoles.includes("STAFF")
        ? "STAFF"
        : (assignableRoles[0] ?? "STAFF"),
    })
    setFormErrors({})
    setFormDialogOpen(true)
  }

  const openEdit = (user: BusinessUser) => {
    setEditingUser(user)
    setForm({
      email: user.email,
      name: user.name ?? "",
      role: (ASSIGNABLE_BUSINESS_USER_ROLES as readonly string[]).includes(
        user.role,
      )
        ? (user.role as AssignableBusinessUserRole)
        : "STAFF",
      password: "",
    })
    setFormErrors({})
    setFormDialogOpen(true)
  }

  const openView = async (user: BusinessUser) => {
    setViewUser(user)
    setViewDialogOpen(true)
    setIsViewLoading(true)
    try {
      const detail = await fetchBusinessUserById(user.id)
      setViewUser(detail)
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, "No se pudo cargar el detalle del usuario"))
    } finally {
      setIsViewLoading(false)
    }
  }

  const updateFormField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSave = async () => {
    const errors = editingUser ? validateEditForm(form) : validateCreateForm(form)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error("Por favor corrige los errores del formulario")
      return
    }

    setIsSaving(true)
    try {
      if (editingUser) {
        const updated = await updateBusinessUser(editingUser.id, {
          name: normalizeBusinessUserName(form.name),
          role: form.role,
          ...(form.password.trim() ? { password: form.password.trim() } : {}),
        })
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        toast.success("Usuario actualizado")
      } else {
        const password = form.password.trim()
        const created = await createBusinessUser({
          email: form.email.trim().toLowerCase(),
          name: normalizeBusinessUserName(form.name),
          role: form.role,
          ...(password ? { password } : {}),
        })
        setUsers((prev) => [...prev, created])
        toast.success("Usuario agregado al negocio")
      }
      setFormDialogOpen(false)
    } catch (e) {
      const errData = isAxiosError(e)
        ? (e.response?.data as {
            error?: string | { fieldErrors?: Record<string, string[]> }
            message?: string
            details?: { fieldErrors?: Record<string, string[]> }
          })
        : null

      const fieldErrors =
        (typeof errData?.error === "object" && errData.error.fieldErrors) ||
        errData?.details?.fieldErrors

      if (fieldErrors) {
        const newErrors: FormErrors = {}
        if (fieldErrors.email?.length) newErrors.email = fieldErrors.email[0]
        if (fieldErrors.name?.length) newErrors.name = fieldErrors.name[0]
        if (fieldErrors.role?.length) newErrors.role = fieldErrors.role[0]
        if (fieldErrors.password?.length) newErrors.password = fieldErrors.password[0]
        setFormErrors(newErrors)
        toast.error("Corrige los errores del formulario")
      } else {
        toast.error(getAxiosErrorMessage(e, "Error al guardar el usuario"))
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteBusinessUser(deleteTarget.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      toast.success("Usuario eliminado del negocio")
      setDeleteTarget(null)
    } catch (e) {
      toast.error(getAxiosErrorMessage(e, "Error al eliminar el usuario"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestioná los usuarios con acceso a este negocio.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 size-4" />
          Nuevo usuario
        </Button>
      </div>

      {isLoading ? (
        <UsersTableSkeleton />
      ) : users.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>Sin usuarios</EmptyTitle>
            <EmptyDescription>
              Todavía no hay usuarios registrados en este negocio. Creá el primero
              para empezar.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Alta en negocio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const manageable = canManageUser(actorRole, actorUserId, user)
                const isSelf = actorUserId != null && user.userId === actorUserId
                const roleLabel =
                  ROLE_LABELS[user.role as AssignableBusinessUserRole] ?? user.role

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {displayName(user)}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-muted-foreground">(vos)</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ROLE_BADGE_VARIANT[user.role as AssignableBusinessUserRole] ??
                          "outline"
                        }
                      >
                        {roleLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => void openView(user)}
                          aria-label="Ver detalle"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(user)}
                          disabled={!manageable}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(user)}
                          disabled={!manageable}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar usuario" : "Nuevo usuario"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Actualizá el nombre, rol o contraseña del usuario."
                : "Agregá un usuario al negocio. Si el email ya existe, se vinculará la cuenta existente."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {!editingUser ? (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="userEmail"
                  className={formErrors.email ? "text-destructive" : ""}
                >
                  Email
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="userEmail"
                  type="email"
                  autoComplete="off"
                  placeholder="usuario@ejemplo.com"
                  value={form.email}
                  onChange={(e) => updateFormField("email", e.target.value)}
                  disabled={isSaving}
                  aria-invalid={!!formErrors.email}
                  className={formErrors.email ? "border-destructive" : ""}
                />
                {formErrors.email ? (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label>Email</Label>
                <Input value={form.email} disabled />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="userName"
                className={formErrors.name ? "text-destructive" : ""}
              >
                Nombre
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="userName"
                placeholder="Ej: María García"
                value={form.name}
                onChange={(e) => updateFormField("name", e.target.value)}
                disabled={isSaving}
                maxLength={120}
                aria-invalid={!!formErrors.name}
                className={formErrors.name ? "border-destructive" : ""}
              />
              {formErrors.name ? (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="userRole"
                className={formErrors.role ? "text-destructive" : ""}
              >
                Rol
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  updateFormField("role", v as AssignableBusinessUserRole)
                }
                disabled={
                  isSaving ||
                  Boolean(
                    editingUser &&
                      actorUserId &&
                      editingUser.userId === actorUserId,
                  )
                }
              >
                <SelectTrigger id="userRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingUser && actorUserId && editingUser.userId === actorUserId ? (
                <p className="text-xs text-muted-foreground">
                  No podés cambiar tu propio rol.
                </p>
              ) : actorRole === "ADMIN" ? (
                <p className="text-xs text-muted-foreground">
                  Como administrador no podés asignar el rol de propietario.
                </p>
              ) : null}
              {formErrors.role ? (
                <p className="text-sm text-destructive">{formErrors.role}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="userPassword"
                className={formErrors.password ? "text-destructive" : ""}
              >
                Contraseña
                {!editingUser ? null : (
                  <span className="text-muted-foreground font-normal ml-1">
                    (opcional)
                  </span>
                )}
              </Label>
              <Input
                id="userPassword"
                type="password"
                autoComplete="new-password"
                placeholder={
                  editingUser
                    ? "Dejar vacío para no cambiar"
                    : "Mínimo 8 caracteres si es cuenta nueva"
                }
                value={form.password}
                onChange={(e) => updateFormField("password", e.target.value)}
                disabled={isSaving}
                aria-invalid={!!formErrors.password}
                className={formErrors.password ? "border-destructive" : ""}
              />
              {!editingUser ? (
                <p className="text-xs text-muted-foreground">
                  Obligatoria solo si el email no tiene cuenta. Si ya existe, se
                  actualizará el nombre al agregarlo al negocio.
                </p>
              ) : null}
              {formErrors.password ? (
                <p className="text-sm text-destructive">{formErrors.password}</p>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving
                  ? "Guardando…"
                  : editingUser
                    ? "Guardar cambios"
                    : "Crear usuario"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del usuario</DialogTitle>
            <DialogDescription>
              Información de la membresía en este negocio.
            </DialogDescription>
          </DialogHeader>

          {viewUser ? (
            <div className="grid gap-4">
              <div className="grid gap-1">
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="text-sm font-medium">
                  {viewUser.name?.trim() || (
                    <span className="text-muted-foreground italic">Sin nombre</span>
                  )}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm">{viewUser.email}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-sm text-muted-foreground">Rol</p>
                <div>
                  <Badge
                    variant={
                      ROLE_BADGE_VARIANT[
                        viewUser.role as AssignableBusinessUserRole
                      ] ?? "outline"
                    }
                  >
                    {ROLE_LABELS[viewUser.role as AssignableBusinessUserRole] ??
                      viewUser.role}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1">
                  <p className="text-sm text-muted-foreground">Alta en negocio</p>
                  <p className="text-sm">
                    {isViewLoading ? "Cargando…" : formatDate(viewUser.createdAt)}
                  </p>
                </div>
                <div className="grid gap-1">
                  <p className="text-sm text-muted-foreground">Cuenta creada</p>
                  <p className="text-sm">
                    {isViewLoading ? "Cargando…" : formatDate(viewUser.userCreatedAt)}
                  </p>
                </div>
              </div>
              <div className="grid gap-1">
                <p className="text-sm text-muted-foreground">ID de membresía</p>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {viewUser.id}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-sm text-muted-foreground">ID de cuenta</p>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {viewUser.userId}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario del negocio?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará a{" "}
              <strong>{deleteTarget ? displayName(deleteTarget) : ""}</strong> de este
              negocio. La cuenta global no se borra, solo la membresía.
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

function UsersTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-28" />
            <div className="flex gap-2">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
