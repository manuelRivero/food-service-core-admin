"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, CalendarDays, LayoutDashboard, QrCode, Truck } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getUserRoleFromCookie } from "@/lib/auth"
import { canAccessPath, type UserRole } from "@/lib/access-control"

const navItems: {
  title: string
  href: string
  icon: typeof LayoutDashboard
  allowedRoles?: UserRole[]
}[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Pedidos",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Reservas",
    href: "/reservations",
    icon: CalendarDays,
  },
  {
    title: "Check-in",
    href: "/check-in",
    icon: QrCode,
    allowedRoles: ["STAFF"],
  },
  {
    title: "Entregas",
    href: "/delivery",
    icon: Truck,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const role = getUserRoleFromCookie()
  const visibleItems = navItems.filter((item) =>
    item.allowedRoles ? item.allowedRoles.includes(role) : canAccessPath(role, item.href)
  )

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <LayoutDashboard className="size-4" />
          </div>
          <span className="text-lg font-semibold">Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
