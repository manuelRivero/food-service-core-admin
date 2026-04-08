"use client"

import { useState, useCallback } from "react"
import { ChatList } from "@/components/messages/chat-list"
import { ChatWindow } from "@/components/messages/chat-window"
import { EmptyState } from "@/components/messages/empty-state"
import type { ChatItemData } from "@/components/messages/chat-item"
import type { Message } from "@/components/messages/message-bubble"

// Mock data for conversations
const mockChats: ChatItemData[] = [
  {
    id: "1",
    customerName: "Maria Garcia",
    lastMessage: "Perfecto, gracias por la informacion!",
    timestamp: "10:30",
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: "2",
    customerName: "Juan Rodriguez",
    lastMessage: "A que hora puedo pasar a recoger el pedido?",
    timestamp: "09:45",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "3",
    customerName: "Ana Martinez",
    lastMessage: "Tienen disponible el menu vegetariano?",
    timestamp: "Ayer",
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: "4",
    customerName: "Carlos Lopez",
    lastMessage: "Excelente servicio, muy recomendado!",
    timestamp: "Ayer",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "5",
    customerName: "Laura Sanchez",
    lastMessage: "Podria modificar mi reserva para 6 personas?",
    timestamp: "Lun",
    unreadCount: 3,
    isOnline: false,
  },
  {
    id: "6",
    customerName: "Pedro Fernandez",
    lastMessage: "Cual es el horario de atencion los domingos?",
    timestamp: "Dom",
    unreadCount: 0,
    isOnline: true,
  },
]

// Mock messages for each conversation
const mockMessages: Record<string, Message[]> = {
  "1": [
    { id: "1a", content: "Hola! Buenas tardes, tengo una consulta sobre mi pedido", timestamp: "10:15", isSent: false },
    { id: "1b", content: "Hola Maria! Claro, en que puedo ayudarte?", timestamp: "10:18", isSent: true, isRead: true },
    { id: "1c", content: "Queria saber si pueden agregar un postre extra a mi orden", timestamp: "10:22", isSent: false },
    { id: "1d", content: "Por supuesto! Tenemos tiramissu, flan y helado artesanal disponibles", timestamp: "10:25", isSent: true, isRead: true },
    { id: "1e", content: "Perfecto, gracias por la informacion!", timestamp: "10:30", isSent: false },
  ],
  "2": [
    { id: "2a", content: "Buenos dias! Realice un pedido hace un rato", timestamp: "09:30", isSent: false },
    { id: "2b", content: "Buen dia Juan! Si, veo tu pedido #1234. Ya esta en preparacion", timestamp: "09:35", isSent: true, isRead: true },
    { id: "2c", content: "A que hora puedo pasar a recoger el pedido?", timestamp: "09:45", isSent: false },
  ],
  "3": [
    { id: "3a", content: "Hola! Quisiera hacer una consulta", timestamp: "14:00", isSent: false },
    { id: "3b", content: "Hola Ana! Adelante, te escucho", timestamp: "14:05", isSent: true, isRead: true },
    { id: "3c", content: "Tienen disponible el menu vegetariano?", timestamp: "14:10", isSent: false },
  ],
  "4": [
    { id: "4a", content: "Queria agradecer por el excelente servicio de ayer", timestamp: "11:00", isSent: false },
    { id: "4b", content: "Muchas gracias Carlos! Nos alegra que hayas disfrutado tu experiencia", timestamp: "11:15", isSent: true, isRead: true },
    { id: "4c", content: "Excelente servicio, muy recomendado!", timestamp: "11:20", isSent: false },
  ],
  "5": [
    { id: "5a", content: "Hola, tengo una reserva para manana", timestamp: "16:00", isSent: false },
    { id: "5b", content: "Hola Laura! Si, veo tu reserva para 4 personas a las 20:00", timestamp: "16:10", isSent: true, isRead: true },
    { id: "5c", content: "Podria modificar mi reserva para 6 personas?", timestamp: "16:15", isSent: false },
  ],
  "6": [
    { id: "6a", content: "Buenas tardes!", timestamp: "12:00", isSent: false },
    { id: "6b", content: "Buenas tardes Pedro! Como puedo ayudarte?", timestamp: "12:05", isSent: true, isRead: true },
    { id: "6c", content: "Cual es el horario de atencion los domingos?", timestamp: "12:10", isSent: false },
  ],
}

export default function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [chats, setChats] = useState<ChatItemData[]>(mockChats)
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages)

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)
  const currentMessages = selectedChatId ? messages[selectedChatId] ?? [] : []

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
    (content: string) => {
      if (!selectedChatId) return

      const newMessage: Message = {
        id: `${selectedChatId}-${Date.now()}`,
        content,
        timestamp: new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSent: true,
        isRead: false,
      }

      setMessages((prev) => ({
        ...prev,
        [selectedChatId]: [...(prev[selectedChatId] ?? []), newMessage],
      }))

      // Update last message in chat list
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === selectedChatId
            ? { ...chat, lastMessage: content, timestamp: newMessage.timestamp }
            : chat
        )
      )
    },
    [selectedChatId]
  )

  return (
    <div className="flex h-[calc(100vh-theme(spacing.14)-theme(spacing.8)-theme(spacing.4))] overflow-hidden rounded-lg border bg-background shadow-sm md:h-[calc(100vh-theme(spacing.14)-theme(spacing.12)-theme(spacing.4))]">
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
      <div className={`flex-1 ${!selectedChatId ? "hidden md:flex" : "flex"}`}>
        {selectedChat ? (
          <div className="flex w-full flex-col">
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
            <div className="flex-1">
              <ChatWindow
                chat={selectedChat}
                messages={currentMessages}
                onSendMessage={handleSendMessage}
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
