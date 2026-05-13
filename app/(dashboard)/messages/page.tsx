"use client"

import { useState, useCallback, useEffect, useMemo, useRef, Suspense } from "react"
import { isAxiosError } from "axios"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { useAdminSocket } from "@/contexts/admin-socket-context"
import { ChatList } from "@/components/messages/chat-list"
import { ChatWindow } from "@/components/messages/chat-window"
import { EmptyState } from "@/components/messages/empty-state"
import type { ChatItemData } from "@/components/messages/chat-item"
import type {
  Message,
  MessageSenderKind,
} from "@/components/messages/message-bubble"
import {
  fetchAdminWhatsappConversationBotStatus,
  fetchAdminWhatsappMessages,
  patchAdminWhatsappConversationBotStatus,
  sendAdminWhatsappMessage,
} from "@/lib/requests/messages"
import type { AdminWhatsappMessageCreatedPayload } from "@/lib/types/admin-realtime"

const BOT_REENGAGE_MESSAGE =
  "Muchas gracias por escribirnos. Fue un placer ayudarte. Te dejamos nuevamente con nuestro asistente para que pueda acompañarte en tus próximas consultas. Estamos para vos siempre."

function debugBotSync(message: string, payload?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  if (payload) {
    console.debug(`[bot-sync][${timestamp}] ${message}`, payload)
    return
  }
  console.debug(`[bot-sync][${timestamp}] ${message}`)
}

function toChatTimestamp(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function normalizeSender(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase()
}

function isInboundForCustomer(
  sender: string,
  customerName?: string | null,
  customerPhone?: string | null,
): boolean {
  const normalizedSender = normalizeSender(sender)
  const normalizedName = normalizeSender(customerName ?? "")
  const normalizedPhone = (customerPhone ?? "").replace(/\D+/g, "")
  const senderDigits = sender.replace(/\D+/g, "")

  if (normalizedName && normalizedSender === normalizedName) return true
  if (normalizedPhone && senderDigits && normalizedPhone === senderDigits) {
    return true
  }
  return false
}

function isOutboundMessage(payload: {
  sender: string
  isAiGenerated: boolean
  customerName?: string | null
  customerPhone?: string | null
}): boolean {
  if (payload.isAiGenerated) return true
  const normalizedSender = normalizeSender(payload.sender)
  if (!normalizedSender) return false

  if (
    isInboundForCustomer(
      payload.sender,
      payload.customerName,
      payload.customerPhone,
    )
  ) {
    return false
  }

  const outboundMarkers = [
    "admin",
    "agent",
    "agente",
    "bot",
    "assistant",
    "asistente",
    "ai",
    "ia",
    "system",
    "sistema",
  ]
  if (outboundMarkers.some((marker) => normalizedSender.includes(marker))) {
    return true
  }

  // Fallback conservador: si no se puede inferir claramente, tratar como entrante.
  return false
}

function buildRealtimeMessage(
  payload: AdminWhatsappMessageCreatedPayload,
  chat?: ChatItemData,
): Message {
  if (payload.message.trim() === BOT_REENGAGE_MESSAGE) {
    return {
      id: payload.messageId,
      content: payload.message,
      timestamp: toChatTimestamp(payload.createdAt),
      isSent: true,
      isRead: true,
      senderKind: "admin",
    }
  }

  const isSent = isOutboundMessage({
    ...payload,
    customerName: chat?.customerName,
    customerPhone: chat?.customerPhone,
  })
  return {
    id: payload.messageId,
    content: payload.message,
    timestamp: toChatTimestamp(payload.createdAt),
    isSent,
    isRead: true,
    senderKind: resolveSenderKind(payload, isSent),
  }
}

function resolveSenderKind(
  payload: { sender: string; isAiGenerated: boolean },
  isSent: boolean,
): MessageSenderKind {
  if (!isSent) return "customer"
  if (payload.isAiGenerated) return "bot"
  return "admin"
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[14rem] items-center justify-center rounded-lg border bg-background p-8 text-sm text-muted-foreground">
          Cargando conversaciones...
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}

function MessagesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    subscribeToWhatsappRealtime,
    whatsappSupportByConversation,
    acknowledgeWhatsappSupportConversation,
  } = useAdminSocket()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [chats, setChats] = useState<ChatItemData[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [botEnabledByConversation, setBotEnabledByConversation] = useState<
    Record<string, boolean>
  >({})
  const [togglingConversationId, setTogglingConversationId] = useState<
    string | null
  >(null)
  const [sendingConversationId, setSendingConversationId] = useState<
    string | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const processedUrlConversationRef = useRef<string | null>(null)

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)
  const currentMessages = selectedChatId ? messages[selectedChatId] ?? [] : []

  const chatsForList = useMemo(
    () =>
      chats.map((c) => ({
        ...c,
        needsSupport: Boolean(whatsappSupportByConversation[c.id]),
      })),
    [chats, whatsappSupportByConversation],
  )
  const loadInitialMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
    debugBotSync("Iniciando carga inicial de conversaciones")
    try {
      const data = await fetchAdminWhatsappMessages({
        page: 1,
        pageSize: 100,
      })

      const nextChatsMap = new Map<string, ChatItemData>()
      const nextMessages: Record<string, Message[]> = {}
      const nextBotEnabledByConversation: Record<string, boolean> = {}

      for (const item of data.items) {
        const conversationId = item.conversation.id
        if (!conversationId) continue
        if (item.message.trim() === BOT_REENGAGE_MESSAGE) {
          const message: Message = {
            id: item.id,
            content: item.message,
            timestamp: toChatTimestamp(item.createdAt),
            isSent: true,
            isRead: true,
            senderKind: "admin",
          }
          nextMessages[conversationId] = [
            message,
            ...(nextMessages[conversationId] ?? []),
          ]
          if (!nextChatsMap.has(conversationId)) {
            nextChatsMap.set(conversationId, {
              id: conversationId,
              customerName:
                item.conversation.customer.name?.trim() ||
                item.conversation.customer.phoneNumber ||
                "Cliente",
              customerPhone: item.conversation.customer.phoneNumber,
              lastMessage: item.message,
              timestamp: toChatTimestamp(item.createdAt),
              unreadCount: 0,
              isOnline: false,
              botEnabled: item.conversation.botEnabled ?? true,
            })
          }
          nextBotEnabledByConversation[conversationId] =
            item.conversation.botEnabled ?? true
          continue
        }

        const isSent = isOutboundMessage({
          ...item,
          customerName: item.conversation.customer.name,
          customerPhone: item.conversation.customer.phoneNumber,
        })

        const message: Message = {
          id: item.id,
          content: item.message,
          timestamp: toChatTimestamp(item.createdAt),
          isSent,
          isRead: true,
          senderKind: resolveSenderKind(item, isSent),
        }

        nextMessages[conversationId] = [
          message,
          ...(nextMessages[conversationId] ?? []),
        ]

        if (!nextChatsMap.has(conversationId)) {
          nextChatsMap.set(conversationId, {
            id: conversationId,
            customerName:
              item.conversation.customer.name?.trim() ||
              item.conversation.customer.phoneNumber ||
              "Cliente",
            customerPhone: item.conversation.customer.phoneNumber,
            lastMessage: item.message,
            timestamp: toChatTimestamp(item.createdAt),
            unreadCount: 0,
            isOnline: false,
            botEnabled: item.conversation.botEnabled ?? true,
          })
        }

        nextBotEnabledByConversation[conversationId] =
          item.conversation.botEnabled ?? true
      }

      debugBotSync("Cargadas conversaciones desde mensajes", {
        totalItems: data.items.length,
        totalConversations: nextChatsMap.size,
        hydratedBotStates: Object.keys(nextBotEnabledByConversation).length,
      })

      setChats(Array.from(nextChatsMap.values()))
      setMessages(nextMessages)
      setBotEnabledByConversation(nextBotEnabledByConversation)
      setSelectedChatId((prev) =>
        prev && nextChatsMap.has(prev)
          ? prev
          : Array.from(nextChatsMap.keys())[0] ?? null,
      )

      const conversationIds = Array.from(nextChatsMap.keys())
      if (conversationIds.length > 0) {
        debugBotSync("Refrescando estado bot/humano desde endpoint por conversación", {
          conversationIds,
        })
        const botStatusResults = await Promise.allSettled(
          conversationIds.map(async (conversationId) => ({
            conversationId,
            enabled: await fetchAdminWhatsappConversationBotStatus(conversationId),
          })),
        )

        const resolvedStatuses: Record<string, boolean> = {}
        for (const result of botStatusResults) {
          if (result.status === "fulfilled") {
            resolvedStatuses[result.value.conversationId] = result.value.enabled
          } else {
            debugBotSync("Fallo al refrescar estado de conversación", {
              reason: String(result.reason),
            })
          }
        }

        if (Object.keys(resolvedStatuses).length > 0) {
          debugBotSync("Estados resueltos desde backend", {
            resolvedStatuses,
          })
          setBotEnabledByConversation((prev) => ({
            ...prev,
            ...resolvedStatuses,
          }))
          setChats((prev) =>
            prev.map((chat) =>
              Object.prototype.hasOwnProperty.call(resolvedStatuses, chat.id)
                ? { ...chat, botEnabled: resolvedStatuses[chat.id] }
                : chat,
            ),
          )
        }
      }
    } catch (e) {
      debugBotSync("Error en carga inicial", {
        error: e instanceof Error ? e.message : String(e),
      })
      if (isAxiosError(e)) {
        const msg = (e.response?.data as { message?: string })?.message ?? e.message
        setError(
          typeof msg === "string" && msg
            ? msg
            : "No se pudieron cargar los mensajes de WhatsApp.",
        )
      } else {
        setError("Error inesperado al cargar mensajes.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadInitialMessages()
  }, [loadInitialMessages])

  useEffect(() => {
    return subscribeToWhatsappRealtime((payload) => {
      if (payload.type !== "whatsapp.message_created") return

      setChats((prevChats) => {
        const existingChat = prevChats.find((c) => c.id === payload.conversationId)
        const nextMessage = buildRealtimeMessage(payload, existingChat)

        setMessages((prev) => {
          const existing = prev[payload.conversationId] ?? []
          if (existing.some((m) => m.id === payload.messageId)) {
            return prev
          }
          return {
            ...prev,
            [payload.conversationId]: [...existing, nextMessage],
          }
        })

        if (!existingChat) {
          return [
            {
              id: payload.conversationId,
              customerName: payload.sender || "Cliente",
              lastMessage: payload.message,
              timestamp: toChatTimestamp(payload.createdAt),
              unreadCount:
                selectedChatId === payload.conversationId || selectedChatId == null
                  ? 0
                  : 1,
              isOnline: false,
              botEnabled: true,
            },
            ...prevChats,
          ]
        }

        return [
          {
            ...existingChat,
            lastMessage: payload.message,
            timestamp: toChatTimestamp(payload.createdAt),
            unreadCount:
              selectedChatId === payload.conversationId
                ? 0
                : existingChat.unreadCount + 1,
          },
          ...prevChats.filter((c) => c.id !== payload.conversationId),
        ]
      })
    })
  }, [subscribeToWhatsappRealtime, selectedChatId])

  useEffect(() => {
    const entries = Object.entries(whatsappSupportByConversation)
    if (entries.length === 0) return
    setChats((prev) => {
      const ids = new Set(prev.map((c) => c.id))
      const additions = entries.filter(([convId]) => !ids.has(convId))
      if (additions.length === 0) return prev
      const rows: ChatItemData[] = additions.map(([convId, meta]) => ({
        id: convId,
        customerName: meta.customerName,
        customerPhone: meta.customerPhone,
        lastMessage: "Cliente solicita atención humana",
        timestamp: toChatTimestamp(meta.at),
        unreadCount: 0,
        isOnline: false,
        botEnabled: true,
      }))
      return [...rows, ...prev]
    })
  }, [whatsappSupportByConversation])

  useEffect(() => {
    const id = searchParams.get("conversation")
    if (!id) {
      processedUrlConversationRef.current = null
      return
    }
    if (loading) return
    if (processedUrlConversationRef.current === id) return
    processedUrlConversationRef.current = id

    const metaSnapshot = whatsappSupportByConversation[id]
    setSelectedChatId(id)
    setChats((prev) => {
      if (prev.some((c) => c.id === id)) return prev
      return [
        {
          id,
          customerName: metaSnapshot?.customerName ?? "Cliente",
          customerPhone: metaSnapshot?.customerPhone,
          lastMessage: metaSnapshot
            ? "Cliente solicita atención humana"
            : "",
          timestamp: metaSnapshot ? toChatTimestamp(metaSnapshot.at) : "",
          unreadCount: 0,
          isOnline: false,
          botEnabled: true,
        },
        ...prev,
      ]
    })
    acknowledgeWhatsappSupportConversation(id)
    router.replace("/messages", { scroll: false })
  }, [
    loading,
    searchParams,
    router,
    acknowledgeWhatsappSupportConversation,
    whatsappSupportByConversation,
  ])

  useEffect(() => {
    if (!selectedChatId) return
    debugBotSync("Refrescando estado para chat seleccionado", {
      selectedChatId,
    })
    void (async () => {
      try {
        const enabled = await fetchAdminWhatsappConversationBotStatus(
          selectedChatId,
        )
        debugBotSync("Estado obtenido para chat seleccionado", {
          selectedChatId,
          enabled,
        })
        setBotEnabledByConversation((prev) => ({
          ...prev,
          [selectedChatId]: enabled,
        }))
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChatId ? { ...chat, botEnabled: enabled } : chat,
          ),
        )
      } catch (e) {
        debugBotSync("Error refrescando chat seleccionado", {
          selectedChatId,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    })()
  }, [selectedChatId])

  const handleSelectChat = useCallback(
    (chatId: string) => {
      acknowledgeWhatsappSupportConversation(chatId)
      setSelectedChatId(chatId)
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, unreadCount: 0 } : chat,
        ),
      )
    },
    [acknowledgeWhatsappSupportConversation],
  )

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedChatId) return
      const conversationId = selectedChatId

      setSendingConversationId(conversationId)
      try {
        await sendAdminWhatsappMessage(conversationId, content)
        // No insertamos mensaje local para evitar duplicados:
        // el render final queda sincronizado por evento realtime `admin:whatsapp`.
      } catch (e) {
        const msg = isAxiosError(e)
          ? (e.response?.data as { message?: string })?.message ?? e.message
          : "No se pudo enviar el mensaje."
        toast.error(
          typeof msg === "string" && msg ? msg : "No se pudo enviar el mensaje.",
        )
      } finally {
        setSendingConversationId((current) =>
          current === conversationId ? null : current,
        )
      }
    },
    [selectedChatId],
  )


  const handleToggleBot = useCallback(
    async (enabled: boolean) => {
      if (!selectedChatId) return
      const conversationId = selectedChatId
      const prevValue = botEnabledByConversation[conversationId] ?? true
      debugBotSync("Toggle solicitado", {
        conversationId,
        prevValue,
        requestedValue: enabled,
      })

      setTogglingConversationId(conversationId)
      setBotEnabledByConversation((prev) => ({
        ...prev,
        [conversationId]: enabled,
      }))
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === conversationId ? { ...chat, botEnabled: enabled } : chat,
        ),
      )

      try {
        const persisted = await patchAdminWhatsappConversationBotStatus(
          conversationId,
          enabled,
        )
        debugBotSync("Toggle persistido en backend", {
          conversationId,
          requestedValue: enabled,
          persistedValue: persisted,
        })
        setBotEnabledByConversation((prev) => ({
          ...prev,
          [conversationId]: persisted,
        }))
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === conversationId
              ? { ...chat, botEnabled: persisted }
              : chat,
          ),
        )
        toast.success(
          persisted
            ? "Bot activado para esta conversación"
            : "Modo humano activado para esta conversación",
        )

        // Si vuelve de humano a bot, enviamos cierre amable para el cliente.
        if (persisted && !prevValue) {
          try {
            await sendAdminWhatsappMessage(
              conversationId,
              BOT_REENGAGE_MESSAGE,
              { skipHumanTakeover: true },
            )
          } catch {
            toast.warning(
              "Se activó el bot, pero no se pudo enviar el mensaje de cierre al cliente.",
            )
          }
        }
      } catch (e) {
        debugBotSync("Error al persistir toggle", {
          conversationId,
          requestedValue: enabled,
          rollbackValue: prevValue,
          error: e instanceof Error ? e.message : String(e),
        })
        setBotEnabledByConversation((prev) => ({
          ...prev,
          [conversationId]: prevValue,
        }))
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === conversationId ? { ...chat, botEnabled: prevValue } : chat,
          ),
        )
        toast.error("No se pudo actualizar el modo del chat. Inténtalo de nuevo.")
      } finally {
        setTogglingConversationId((current) =>
          current === conversationId ? null : current,
        )
      }
    },
    [selectedChatId, botEnabledByConversation],
  )

  if (loading) {
    return (
      <div className="flex min-h-[14rem] items-center justify-center rounded-lg border bg-background p-8 text-sm text-muted-foreground">
        Cargando conversaciones...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[14rem] items-center justify-center rounded-lg border bg-background p-8 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.8)-theme(spacing.4))] min-h-0 overflow-hidden rounded-lg border bg-background shadow-sm md:h-[calc(100vh-theme(spacing.14)-theme(spacing.12)-theme(spacing.4))]">
      {/* Chat List - Hidden on mobile when a chat is selected */}
      <div className={`w-full flex-shrink-0 md:w-80 ${selectedChatId ? "hidden md:block" : ""}`}>
        <ChatList
          chats={chatsForList}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Chat Window or Empty State */}
      <div className={`min-h-0 flex-1 ${!selectedChatId ? "hidden md:flex" : "flex"}`}>
        {selectedChat ? (
          <div className="flex h-full min-h-0 w-full flex-col">
            {/* Mobile back button */}
            <div className="flex items-center border-b p-2 md:hidden">
              <button
                onClick={() => setSelectedChatId(null)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Volver
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <ChatWindow
                chat={selectedChat}
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                botEnabled={
                  botEnabledByConversation[selectedChat.id] ??
                  selectedChat.botEnabled ??
                  true
                }
                isTogglingBot={togglingConversationId === selectedChat.id}
                onToggleBot={handleToggleBot}
                isSendingMessage={sendingConversationId === selectedChat.id}
              />
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  )
}
