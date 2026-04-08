"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ChatItem, type ChatItemData } from "./chat-item"

interface ChatListProps {
  chats: ChatItemData[]
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  searchQuery,
  onSearchChange,
}: ChatListProps) {
  const filteredChats = chats.filter((chat) =>
    chat.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r">
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="h-full w-full overflow-y-auto">
          <div className="w-full min-w-0 p-2">
          <div className="flex flex-col gap-1">
            {filteredChats.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No se encontraron conversaciones
              </p>
            ) : (
              filteredChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChatId === chat.id}
                  onClick={() => onSelectChat(chat.id)}
                />
              ))
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
