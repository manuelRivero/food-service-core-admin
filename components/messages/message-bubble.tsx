"use client"

import { cn } from "@/lib/utils"
import { Check, CheckCheck } from "lucide-react"

export interface Message {
  id: string
  content: string
  timestamp: string
  isSent: boolean
  isRead?: boolean
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex",
        message.isSent ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "relative max-w-[75%] rounded-2xl px-4 py-2",
          message.isSent
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1",
            message.isSent ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          <span className="text-[10px]">{message.timestamp}</span>
          {message.isSent && (
            message.isRead ? (
              <CheckCheck className="size-3" />
            ) : (
              <Check className="size-3" />
            )
          )}
        </div>
      </div>
    </div>
  )
}
