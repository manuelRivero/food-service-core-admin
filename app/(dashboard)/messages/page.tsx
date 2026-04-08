"use client"

import { useState, useCallback, useEffect } from "react"
import { isAxiosError } from "axios"
import { toast } from "sonner"

import { useAdminSocket } from "@/contexts/admin-socket-context"
import { ChatList } from "@/components/messages/chat-list"
import { ChatWindow } from "@/components/messages/chat-window"
import { EmptyState } from "@/components/messages/empty-state"
import type { ChatItemData } from "@/components/messages/chat-item"
import type { Message } from "@/components/messages/message-bubble"
import {
  fetchAdminWhatsappConversationBotStatus,
  fetchAdminWhatsappMessages,
  patchAdminWhatsappConversationBotStatus,
  sendAdminWhatsappMessage,
} from "@/lib/requests/messages"
import type { AdminWhatsappRealtimePayload } from "@/lib/types/admin-realtime"

const BOT_REENGAGE_MESSAGE =
  "Muchas gracias por escribirnos. Fue un placer ayudarte. Te dejamos nuevamente con nuestro asistente para que pueda acompañarte en tus próximas consultas. Estamos para vos siempre."

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
  payload: AdminWhatsappRealtimePayload,
  chat?: ChatItemData,
): Message {
  return {
    id: payload.messageId,
    content: payload.message,
    timestamp: toChatTimestamp(payload.createdAt),
    isSent: isOutboundMessage({
      ...payload,
      customerName: chat?.customerName,
      customerPhone: chat?.customerPhone,
    }),
    isRead: true,
  }
}

export default function MessagesPage() {
  const { subscribeToWhatsappRealtime } = useAdminSocket()
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

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)
  const currentMessages = selectedChatId ? messages[selectedChatId] ?? [] : []
  const loadInitialMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
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

        const message: Message = {
          id: item.id,
          content: item.message,
          timestamp: toChatTimestamp(item.createdAt),
          isSent: isOutboundMessage({
            ...item,
            customerName: item.conversation.customer.name,
            customerPhone: item.conversation.customer.phoneNumber,
          }),
          isRead: true,
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

      setChats(Array.from(nextChatsMap.values()))
      setMessages(nextMessages)
      setBotEnabledByConversation(nextBotEnabledByConversation)
      setSelectedChatId((prev) =>
        prev && nextChatsMap.has(prev)
          ? prev
          : Array.from(nextChatsMap.keys())[0] ?? null,
      )
    } catch (e) {
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
    if (!selectedChatId) return
    if (Object.prototype.hasOwnProperty.call(botEnabledByConversation, selectedChatId)) {
      return
    }
    void (async () => {
      try {
        const enabled = await fetchAdminWhatsappConversationBotStatus(
          selectedChatId,
        )
        setBotEnabledByConversation((prev) => ({
          ...prev,
          [selectedChatId]: enabled,
        }))
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChatId ? { ...chat, botEnabled: enabled } : chat,
          ),
        )
      } catch {
        /* noop */
      }
    })()
  }, [selectedChatId, botEnabledByConversation])

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId)
    // Mark messages as read when selecting a chat
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    )
  }, [])

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
            )
          } catch {
            toast.warning(
              "Se activó el bot, pero no se pudo enviar el mensaje de cierre al cliente.",
            )
          }
        }
      } catch {
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
          chats={chats}
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
