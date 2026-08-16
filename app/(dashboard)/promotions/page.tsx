"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { isAxiosError } from "axios"
import { Archive, MoreHorizontal, Pause, Play, Plus, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { PromotionProductAvatars } from "@/components/promotions/promotion-product-avatars"
import { PromotionStatusBadge } from "@/components/promotions/promotion-status-badge"
import {
  archivePromotion,
  fetchPromotions,
  getPromotionApiErrorMessage,
  patchPromotion,
  type PromotionDto,
  type PromotionStatus,
} from "@/lib/requests/promotions"

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activa" },
  { value: "paused", label: "Pausada" },
  { value: "archived", label: "Archivada" },
]

export default function PromotionsPage() {
  const [items, setItems] = useState<PromotionDto[]>([])
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [status, setStatus] = useState("all")
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, pageSize: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<PromotionDto | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 400)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, status])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPromotions({
        page,
        pageSize: 20,
        q: debouncedQ,
        status: status === "all" ? "all" : (status as PromotionStatus),
        includeArchived: status === "archived",
      })
      setItems(data.items)
      setMeta({
        total: data.total,
        totalPages: data.totalPages,
        pageSize: data.pageSize,
      })
    } catch (err) {
      setItems([])
      setError(
        isAxiosError(err)
          ? getPromotionApiErrorMessage(err)
          : "No se pudieron cargar las promociones.",
      )
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQ, status])

  useEffect(() => {
    void load()
  }, [load])

  const changeStatus = async (promo: PromotionDto, next: PromotionStatus) => {
    setBusyId(promo.id)
    try {
      await patchPromotion(promo.id, { status: next })
      toast.success(
        next === "active"
          ? "Promoción activada. Todavía no se aplica en los pedidos."
          : "Estado actualizado.",
      )
      await load()
    } catch (err) {
      toast.error(getPromotionApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const confirmArchive = async () => {
    if (!archiveTarget) return
    setBusyId(archiveTarget.id)
    try {
      await archivePromotion(archiveTarget.id)
      toast.success("Promoción archivada.")
      setArchiveTarget(null)
      await load()
    } catch (err) {
      toast.error(getPromotionApiErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Promociones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá promociones con IA y vinculalas al menú. Activarlas todavía no
            aplica descuentos en los pedidos.
          </p>
        </div>
        <Button asChild>
          <Link href="/promotions/new">
            <Plus className="size-4" />
            Crear con IA
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1 space-y-2">
          <Label htmlFor="promo-search">Buscar</Label>
          <Input
            id="promo-search"
            value={q}
            placeholder="Ej. martes"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="w-48 space-y-2">
          <Label>Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-right text-sm text-muted-foreground">
        {meta.total} promoción{meta.total === 1 ? "" : "es"} · Página {page} de{" "}
        {meta.totalPages}
      </p>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : items.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles />
            </EmptyMedia>
            <EmptyTitle>No hay promociones</EmptyTitle>
            <EmptyDescription>
              Creá la primera grabando la promo con el micrófono.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="divide-y rounded-xl border">
          {items.map((promo) => (
            <li
              key={promo.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <PromotionProductAvatars products={promo.products ?? []} />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/promotions/${promo.id}`}
                  className="font-medium hover:underline"
                >
                  {promo.name}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {promo.summaryLine}
                </p>
              </div>
              <PromotionStatusBadge
                status={promo.status}
                label={promo.statusLabel}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busyId === promo.id}
                    aria-label="Acciones"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/promotions/${promo.id}`}>Ver / editar</Link>
                  </DropdownMenuItem>
                  {promo.status === "draft" || promo.status === "paused" ? (
                    <DropdownMenuItem
                      onSelect={() => void changeStatus(promo, "active")}
                    >
                      <Play className="size-4" />
                      Activar
                    </DropdownMenuItem>
                  ) : null}
                  {promo.status === "active" ? (
                    <DropdownMenuItem
                      onSelect={() => void changeStatus(promo, "paused")}
                    >
                      <Pause className="size-4" />
                      Pausar
                    </DropdownMenuItem>
                  ) : null}
                  {promo.status !== "archived" ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setArchiveTarget(promo)}
                    >
                      <Archive className="size-4" />
                      Archivar
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      {!loading && meta.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {meta.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
          >
            Siguiente
          </Button>
        </div>
      ) : null}

      <AlertDialog
        open={archiveTarget != null}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar esta promoción?</AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget
                ? `Se archivará “${archiveTarget.name}”. No se borra, pero el estado es definitivo.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmArchive()}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Archivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
