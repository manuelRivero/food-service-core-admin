"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, User } from "lucide-react"

import { clearAuthCookie, getUserRoleFromCookie } from "@/lib/auth"
import { useAdminSocket } from "@/contexts/admin-socket-context"
import type { UserRole } from "@/lib/access-control"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function formatNotifTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return ""
  }
}

export function Header() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>("UNKNOWN")
  const {
    notifications,
    badgeCount,
    removeNotification,
    acknowledgeWhatsappSupportConversation,
  } = useAdminSocket()
  const canSeeNotifications = role === "ADMIN" || role === "OWNER"

  useEffect(() => {
    setRole(getUserRoleFromCookie())
  }, [])

  function handleLogout() {
    clearAuthCookie()
    router.push("/login")
    router.refresh()
  }

  function handleOpenNotification(n: {
    id: string
    kind: "order" | "reservation" | "whatsapp_support"
    resourceId: string
  }) {
    if (n.kind === "whatsapp_support") {
      acknowledgeWhatsappSupportConversation(n.resourceId)
      router.push(
        `/messages?conversation=${encodeURIComponent(n.resourceId)}`,
      )
      return
    }
    removeNotification(n.id)
    router.push(n.kind === "order" ? "/orders" : "/reservations")
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        {canSeeNotifications ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-4" />
                {badgeCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                ) : null}
                <span className="sr-only">Notificaciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No hay notificaciones recientes
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className={cn(
                        "flex cursor-pointer flex-col items-start gap-0.5 py-2",
                        n.read && "opacity-60",
                      )}
                      onSelect={() => handleOpenNotification(n)}
                    >
                      <span className="font-medium">{n.title}</span>
                      {n.subtitle ? (
                        <span className="text-xs text-muted-foreground">
                          {n.subtitle}
                        </span>
                      ) : null}
                      <span className="text-[10px] text-muted-foreground">
                        {formatNotifTime(n.at)}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative size-8 rounded-full">
              <Avatar className="size-8">
                <AvatarFallback>
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">Panel</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
