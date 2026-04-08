"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export interface ChatItemData {
  id: string
  customerName: string
  avatar?: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isOnline?: boolean
}

interface ChatItemProps {
  chat: ChatItemData
  isSelected: boolean
  onClick: () => void
}

export function ChatItem({ chat, isSelected, onClick }: ChatItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent",
        isSelected && "bg-accent"
      )}
    >
      <div className="relative">
        <Avatar className="size-10">
          {chat.avatar ? (
            <AvatarImage src={chat.avatar} alt={chat.customerName} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary">
            {chat.customerName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {chat.isOnline && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-green-500" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{chat.customerName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {chat.timestamp}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-muted-foreground">
            {chat.lastMessage}
          </p>
          {chat.unreadCount > 0 && (
            <Badge variant="default" className="size-5 shrink-0 justify-center rounded-full p-0 text-xs">
              {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}
