"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { EntityCard } from "@/components/promotions/entity-card"
import { OfferEditor } from "@/components/promotions/offer-editor"
import { OfferSummary } from "@/components/promotions/offer-summary"
import { PromotionStatusBadge } from "@/components/promotions/promotion-status-badge"
import { cloneOffer } from "@/components/promotions/format-offer"
import {
  allowedStatusTransitions,
  applyCandidateToCard,
  archivePromotion,
  buildProductLinks,
  canSavePromotion,
  fetchPromotionById,
  getPromotionApiErrorMessage,
  getPromotionErrorMissing,
  patchPromotion,
  resolvePromotionEntities,
  withProductSearchCard,
  type PromotionDto,
  type PromotionEntityCard,
  type PromotionStatus,
  type StructuredOffer,
} from "@/lib/requests/promotions"

const STATUS_ACTION_LABEL: Partial<Record<PromotionStatus, string>> = {
  draft: "Volver a borrador",
  active: "Activar",
  paused: "Pausar",
  archived: "Archivar",
}

export default function PromotionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [promo, setPromo] = useState<PromotionDto | null>(null)
  const [draftOffer, setDraftOffer] = useState<StructuredOffer | null>(null)
  const [entityCards, setEntityCards] = useState<PromotionEntityCard[]>([])
  const [isEditingOffer, setIsEditingOffer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resolvingPath, setResolvingPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState<string[]>([])
  const [archiveOpen, setArchiveOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPromotionById(id)
      setPromo(data)
      setDraftOffer(cloneOffer(data.offer))
      setEntityCards(
        withProductSearchCard(data.display?.entityCards ?? []),
      )
    } catch (err) {
      setError(getPromotionApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const readOnly = promo?.status === "archived"
  const canSave = useMemo(
    () =>
      Boolean(draftOffer) &&
      canSavePromotion(draftOffer as StructuredOffer, entityCards),
    [draftOffer, entityCards],
  )
  const transitions = promo ? allowedStatusTransitions(promo.status) : []

  const resolveCardName = async (card: PromotionEntityCard, text: string) => {
    setResolvingPath(card.path)
    setError(null)
    try {
      const nextCards = await resolvePromotionEntities({
        entities: [{ text, type: card.kind, path: card.path }],
      })
      setEntityCards((prev) =>
        prev.map((item) => {
          if (item.path !== card.path) return item
          const updated =
            nextCards.find((next) => next.path === item.path) ?? nextCards[0]
          if (!updated) return { ...item, name: text }
          return {
            ...item,
            name: text,
            candidates: updated.candidates ?? [],
            subtitle: updated.subtitle ?? item.subtitle,
          }
        }),
      )
    } catch (err) {
      setError(getPromotionApiErrorMessage(err))
    } finally {
      setResolvingPath(null)
    }
  }

  const save = async (status?: PromotionStatus) => {
    if (!draftOffer || !canSave) return
    setSaving(true)
    setError(null)
    setMissing([])
    try {
      const updated = await patchPromotion(id, {
        offer: draftOffer,
        productLinks: buildProductLinks(entityCards, draftOffer),
        ...(status ? { status } : {}),
      })
      setPromo(updated)
      setDraftOffer(cloneOffer(updated.offer))
      setEntityCards(
        withProductSearchCard(updated.display?.entityCards ?? entityCards),
      )
      toast.success(
        status === "active"
          ? "Promoción actualizada. Activarla todavía no aplica descuentos en los pedidos."
          : "Promoción actualizada.",
      )
    } catch (err) {
      setMissing(getPromotionErrorMissing(err))
      setError(getPromotionApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changeStatusOnly = async (status: PromotionStatus) => {
    if (status === "archived") {
      setArchiveOpen(true)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await patchPromotion(id, { status })
      setPromo(updated)
      toast.success(
        status === "active"
          ? "Promoción activada. Todavía no se aplica en los pedidos."
          : "Estado actualizado.",
      )
    } catch (err) {
      setError(getPromotionApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const confirmArchive = async () => {
    setSaving(true)
    try {
      await archivePromotion(id)
      toast.success("Promoción archivada.")
      router.push("/promotions")
    } catch (err) {
      setError(getPromotionApiErrorMessage(err))
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando promoción…
      </div>
    )
  }

  if (!promo || !draftOffer) {
    return (
      <div className="space-y-3">
        <Link href="/promotions" className="text-sm text-muted-foreground hover:underline">
          ← Volver al listado
        </Link>
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>No se pudo cargar</AlertTitle>
          <AlertDescription>{error ?? "Promoción no encontrada."}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const busy = saving || resolvingPath != null

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/promotions" className="text-sm text-muted-foreground hover:underline">
        ← Volver al listado
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{promo.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{promo.summaryLine}</p>
        </div>
        <PromotionStatusBadge status={promo.status} label={promo.statusLabel} />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>No se pudo completar</AlertTitle>
          <AlertDescription>
            <p className="whitespace-pre-line">{error}</p>
            {missing.length > 0 && missing.join("\n") !== error ? (
              <ul className="mt-2 list-disc pl-5">
                {missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Oferta</CardTitle>
          <CardDescription>
            {promo.sourceType === "audio" ? "Origen: audio" : "Origen: texto"}
            {promo.sourceText ? ` · “${promo.sourceText}”` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingOffer && !readOnly ? (
            <OfferEditor
              offer={draftOffer}
              disabled={busy}
              onChange={setDraftOffer}
            />
          ) : (
            <OfferSummary offer={draftOffer} display={promo.display} />
          )}
          <div className="space-y-2">
              <p className="text-sm font-medium">Productos</p>
              <p className="text-xs text-muted-foreground">
                Cada buscador tiene un rol: el producto requerido dispara la
                promo; el de regalo es el beneficio. El opcional es por si
                olvidaste mencionar alguno.
              </p>
              <div className="space-y-2">
                {entityCards.map((card) => (
                  <EntityCard
                    key={card.path}
                    card={card}
                    disabled={busy || readOnly}
                    resolving={resolvingPath === card.path}
                    onSelectCandidate={
                      readOnly
                        ? undefined
                        : (candidate) =>
                            setEntityCards((prev) =>
                              prev.map((item) =>
                                item.path === card.path
                                  ? applyCandidateToCard(item, candidate)
                                  : item,
                              ),
                            )
                    }
                    onNameCommit={
                      readOnly
                        ? undefined
                        : (text) => void resolveCardName(card, text)
                    }
                  />
                ))}
              </div>
            </div>
          {!readOnly ? (
            <Button
              type="button"
              variant={isEditingOffer ? "secondary" : "outline"}
              disabled={busy}
              onClick={() => setIsEditingOffer((open) => !open)}
            >
              {isEditingOffer ? "Ver resumen" : "Editar oferta"}
            </Button>
          ) : null}
          <Collapsible>
            <CollapsibleTrigger className="text-xs text-muted-foreground underline-offset-4 hover:underline">
              Ver JSON (debug)
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                {JSON.stringify(promo, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {!readOnly ? (
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            <CardDescription>
              Guardar reemplaza oferta y vínculos. Activar no aplica descuentos
              en los pedidos todavía.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || !canSave}
              onClick={() => void save()}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar cambios
            </Button>
            {transitions
              .filter((status) => status !== "archived")
              .map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void changeStatusOnly(status)}
                >
                  {STATUS_ACTION_LABEL[status]}
                </Button>
              ))}
            {transitions.includes("archived") ? (
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => setArchiveOpen(true)}
              >
                Archivar
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar esta promoción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se archivará “{promo.name}”. El estado es definitivo.
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
