"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  HelpCircle,
  Loader2,
  Mic,
  Square,
  // Sparkles,
  // Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
// import { Label } from "@/components/ui/label"
// import { Textarea } from "@/components/ui/textarea"
import { EntityCard } from "@/components/promotions/entity-card"
import { OfferEditor } from "@/components/promotions/offer-editor"
import { OfferSummary } from "@/components/promotions/offer-summary"
import { PromotionRecordingGuide } from "@/components/promotions/promotion-recording-guide"
import { cloneOffer, emptyOffer } from "@/components/promotions/format-offer"
import {
  MAX_PROMOTION_AUDIO_BYTES,
  // MAX_PROMOTION_TEXT_LENGTH,
  // PROMOTION_AUDIO_ACCEPT,
  applyCandidateToCard,
  isManualProductCard,
  withProductSearchCard,
  buildProductLinks,
  canSavePromotion,
  createPromotion,
  getPromotionApiErrorMessage,
  getPromotionErrorMissing,
  getPromotionInterpretErrorPayload,
  interpretPromotionFromAudio,
  // interpretPromotionFromText,
  resolvePromotionEntities,
  type PromotionEntityCard,
  type PromotionInterpretResponse,
  type StructuredOffer,
} from "@/lib/requests/promotions"

function spokenTextFromResponse(response: PromotionInterpretResponse): string {
  if (response.input.type === "text") return response.input.text
  return response.transcription?.text ?? ""
}

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined
  const candidates = ["audio/webm", "audio/ogg", "audio/mp4"]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

function extensionForMime(mime: string): string {
  if (mime.includes("ogg")) return "ogg"
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a"
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3"
  if (mime.includes("wav")) return "wav"
  return "webm"
}

export function PromotionComposer() {
  const router = useRouter()
  const [sourceText, setSourceText] = useState("")
  // const [clarifications, setClarifications] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isInterpreting, setIsInterpreting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [resolvingPath, setResolvingPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState<string[]>([])
  const [response, setResponse] = useState<PromotionInterpretResponse | null>(
    null,
  )
  const [draftOffer, setDraftOffer] = useState<StructuredOffer>(emptyOffer())
  const [entityCards, setEntityCards] = useState<PromotionEntityCard[]>([])
  const [isEditingOffer, setIsEditingOffer] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  // const fileInputRef = useRef<HTMLInputElement>(null)
  const interpretAudioRef = useRef<(file: File) => Promise<void>>(
    async () => undefined,
  )

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop()
      stopStream()
    }
  }, [stopStream])

  const applyResponse = useCallback((next: PromotionInterpretResponse) => {
    setResponse(next)
    setSourceText(spokenTextFromResponse(next))
    setMissing([])
    if (next.interpretation.status !== "error") {
      setDraftOffer(cloneOffer(next.interpretation.offer))
      setEntityCards(
        withProductSearchCard(next.interpretation.display.entityCards ?? []),
      )
      setIsEditingOffer(false)
    }
  }, [])

  /* Interpretar desde texto — deshabilitado: solo audio grabado en vivo
  const interpretText = useCallback(
    async (rawText: string) => {
      const text = rawText.trim()
      if (text.length < 1) {
        toast.error("Escribí la promoción antes de interpretar.")
        return
      }
      if (text.length > MAX_PROMOTION_TEXT_LENGTH) {
        toast.error(
          `El texto no puede superar ${MAX_PROMOTION_TEXT_LENGTH} caracteres.`,
        )
        return
      }
      setIsInterpreting(true)
      setError(null)
      try {
        const result = await interpretPromotionFromText(text)
        applyResponse(result)
        if (result.interpretation.status === "error") {
          setError("No pudimos interpretar. Probá de nuevo.")
        }
      } catch (err) {
        const payload = getPromotionInterpretErrorPayload(err)
        if (payload?.transcription?.text) {
          setSourceText(payload.transcription.text)
        }
        if (payload?.interpretation?.status === "error" || payload?.input) {
          setResponse({
            input: payload.input ?? { type: "text", text },
            transcription: payload.transcription ?? null,
            interpretation: payload.interpretation ?? { status: "error" },
          })
        }
        setError(getPromotionApiErrorMessage(err))
      } finally {
        setIsInterpreting(false)
      }
    },
    [applyResponse],
  )
  */

  const interpretAudio = useCallback(
    async (file: File) => {
      if (file.size > MAX_PROMOTION_AUDIO_BYTES) {
        toast.error("El audio no puede superar 10 MB.")
        return
      }
      setAudioFile(file)
      setIsInterpreting(true)
      setError(null)
      try {
        const result = await interpretPromotionFromAudio(file)
        applyResponse(result)
        if (result.interpretation.status === "error") {
          setError("No pudimos interpretar. Probá de nuevo.")
        }
      } catch (err) {
        const payload = getPromotionInterpretErrorPayload(err)
        if (payload?.transcription?.text) {
          setSourceText(payload.transcription.text)
        }
        if (payload?.interpretation || payload?.input) {
          setResponse({
            input: payload.input ?? { type: "audio" },
            transcription: payload.transcription ?? null,
            interpretation: payload.interpretation ?? { status: "error" },
          })
        }
        setError(getPromotionApiErrorMessage(err))
      } finally {
        setIsInterpreting(false)
      }
    },
    [applyResponse],
  )

  interpretAudioRef.current = interpretAudio

  const startRecording = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      toast.error("Tu navegador no permite grabar audio.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = pickRecorderMimeType()
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm"
        const blob = new Blob(chunksRef.current, { type })
        const file = new File([blob], `promocion.${extensionForMime(type)}`, {
          type,
        })
        setAudioFile(file)
        stopStream()
        void interpretAudioRef.current(file)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      toast.error("No pudimos acceder al micrófono.")
      stopStream()
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setIsRecording(false)
  }

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
            name: isManualProductCard(item) ? item.name : text,
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

  const interpretation =
    response?.interpretation.status === "error"
      ? null
      : response?.interpretation

  /* Reinterpretar como texto — deshabilitado por ahora
  const textToReinterpret = clarifications.trim()
    ? `${sourceText.trim()}\n\nAclaraciones:\n${clarifications.trim()}`
    : sourceText
  */

  const canSave = useMemo(
    () => Boolean(interpretation) && canSavePromotion(draftOffer, entityCards),
    [draftOffer, entityCards, interpretation],
  )

  const save = async (status: "draft" | "active") => {
    if (!response || !interpretation || !canSave) return
    setIsSaving(true)
    setError(null)
    setMissing([])
    try {
      const created = await createPromotion({
        offer: draftOffer,
        status,
        sourceType: "audio",
        sourceText: sourceText.trim(),
        productLinks: buildProductLinks(entityCards, draftOffer),
      })
      toast.success(
        status === "active"
          ? "Promoción guardada como activa. Todavía no se aplica en los pedidos."
          : "Promoción guardada como borrador.",
      )
      router.push(`/promotions/${created.id}`)
    } catch (err) {
      setMissing(getPromotionErrorMissing(err))
      setError(getPromotionApiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const busy = isInterpreting || isSaving || resolvingPath != null || isRecording

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Nueva promoción
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contá la promoción en voz alta. Después vinculá los platillos y
          guardala.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear promoción con IA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Flujo de texto y archivo del explorador — deshabilitado por ahora
          <div className="space-y-2">
            <Label htmlFor="promo-text">Texto de la promoción</Label>
            <Textarea
              id="promo-text"
              rows={5}
              disabled={busy}
              value={sourceText}
              maxLength={MAX_PROMOTION_TEXT_LENGTH}
              placeholder='Ej.: "Los martes, de 18 a 20, si alguien compra dos hamburguesas le regalamos papas."'
              onChange={(e) => setSourceText(e.target.value)}
            />
          </div>
          <Button
            type="button"
            onClick={() => void interpretText(sourceText)}
            disabled={busy || !sourceText.trim()}
          >
            Interpretar texto
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Subir audio
          </Button>
          <input
            ref={fileInputRef}
            id="promo-audio"
            type="file"
            accept={PROMOTION_AUDIO_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void interpretAudio(file)
              e.target.value = ""
            }}
          />
          */}

          <PromotionRecordingGuide />

          <div className="flex flex-col items-center gap-3 py-2">
            {isRecording ? (
              <Button
                type="button"
                size="icon-lg"
                variant="destructive"
                className="size-16 rounded-full"
                onClick={stopRecording}
                aria-label="Detener"
              >
                <Square className="size-7" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon-lg"
                className="size-16 rounded-full"
                onClick={() => void startRecording()}
                disabled={busy && !isRecording}
                aria-label={
                  audioFile || response ? "Volver a grabar" : "Crear por audio"
                }
              >
                <Mic className="size-7" />
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              {isRecording
                ? "Grabando… tocá para detener"
                : audioFile || response
                  ? "Volver a grabar"
                  : "Crear por audio"}
            </p>
          </div>

          {isInterpreting ? (
            <Alert>
              <Loader2 className="animate-spin" />
              <AlertTitle>Interpretando</AlertTitle>
              <AlertDescription>
                Estamos transcribiendo y entendiendo la promoción. Esto puede
                tardar varios segundos.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

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

      {response ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Lo que dijiste</CardTitle>
              <CardDescription>Transcripción del audio grabado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {response.transcription?.language ? (
                <Badge variant="secondary">
                  Idioma: {response.transcription.language}
                </Badge>
              ) : null}
              <p className="whitespace-pre-wrap text-sm">
                {sourceText.trim() || "Sin transcripción."}
              </p>
              {/* Edición de transcripción / reenvío como texto — deshabilitado por ahora
              <Textarea
                rows={4}
                disabled={busy}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
              */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div className="space-y-1.5">
                <CardTitle>Lo que entendimos</CardTitle>
                <CardDescription>
                  Revisá el borrador y vinculá cada platillo antes de guardar.
                </CardDescription>
              </div>
              {interpretation ? (
                <Badge
                  variant={
                    interpretation.status === "complete"
                      ? "default"
                      : "secondary"
                  }
                >
                  {interpretation.display.statusLabel}
                </Badge>
              ) : (
                <Badge variant="destructive">Error</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {interpretation ? (
                isEditingOffer ? (
                  <OfferEditor
                    offer={draftOffer}
                    disabled={busy}
                    onChange={setDraftOffer}
                  />
                ) : (
                  <OfferSummary
                    offer={draftOffer}
                    display={interpretation.display}
                  />
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay oferta para mostrar. Grabá de nuevo.
                </p>
              )}
              {interpretation ? (
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
                        disabled={busy}
                        resolving={resolvingPath === card.path}
                        onSelectCandidate={(candidate) =>
                          setEntityCards((prev) =>
                            prev.map((item) =>
                              item.path === card.path
                                ? applyCandidateToCard(item, candidate)
                                : item,
                            ),
                          )
                        }
                        onNameCommit={(text) =>
                          void resolveCardName(card, text)
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              {interpretation ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={isEditingOffer ? "secondary" : "outline"}
                    disabled={busy}
                    onClick={() => setIsEditingOffer((open) => !open)}
                  >
                    {isEditingOffer ? "Ver resumen" : "Editar oferta"}
                  </Button>
                </div>
              ) : null}
              <Collapsible>
                <CollapsibleTrigger className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                  Ver JSON (debug)
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify({ response, entityCards, draftOffer }, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos pendientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {interpretation?.status === "needs_clarification" &&
              (interpretation.missingInformation?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  <Alert>
                    <HelpCircle />
                    <AlertTitle>Falta información</AlertTitle>
                    <AlertDescription>
                      Completá la oferta en el editor. No se puede guardar hasta
                      que esté completa.
                    </AlertDescription>
                  </Alert>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {interpretation.missingInformation?.map((item) => (
                      <li key={`${item.field}-${item.question}`}>
                        {item.question}
                      </li>
                    ))}
                  </ul>
                  {/* Respuestas en texto para reinterpretar — deshabilitado por ahora
                  <div className="space-y-2">
                    <Label htmlFor="clarifications">Tus respuestas</Label>
                    <Textarea
                      id="clarifications"
                      rows={3}
                      disabled={busy}
                      value={clarifications}
                      onChange={(e) => setClarifications(e.target.value)}
                    />
                  </div>
                  */}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay preguntas pendientes.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
              <CardDescription>
                Guardar requiere un beneficio y que cada producto mencionado
                esté vinculado al menú. Activar no aplica descuentos en los
                pedidos todavía.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {/* Reinterpretar como texto — deshabilitado por ahora
              <Button
                type="button"
                variant="outline"
                onClick={() => void interpretText(textToReinterpret)}
                disabled={busy || !sourceText.trim()}
              >
                Reinterpretar
              </Button>
              */}
              <Button
                type="button"
                variant="outline"
                disabled={busy || !canSave}
                onClick={() => void save("draft")}
              >
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                Guardar borrador
              </Button>
              <Button
                type="button"
                disabled={busy || !canSave}
                onClick={() => void save("active")}
              >
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                Guardar y activar
              </Button>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
