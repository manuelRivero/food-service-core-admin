"use client"

import { useEffect, useRef } from "react"
import { Phone, Video, MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble, type Message } from "./message-bubble"
import { MessageInput } from "./message-input"
import type { ChatItemData } from "./chat-item"

interface ChatWindowProps {
  chat: ChatItemData
  messages: Message[]
  onSendMessage: (message: string) => void
}

export function ChatWindow({ chat, messages, onSendMessage }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-3">
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
          <div>
            <h2 className="font-semibold">{chat.customerName}</h2>
            <p className="text-xs text-muted-foreground">
              {chat.isOnline ? "En linea" : "Visto por ultima vez hace 2h"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Phone className="size-4" />
            <span className="sr-only">Llamar</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Video className="size-4" />
            <span className="sr-only">Videollamada</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="size-4" />
            <span className="sr-only">Mas opciones</span>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-muted/30">
        <div ref={scrollRef} className="flex flex-col gap-3 p-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  )
}
