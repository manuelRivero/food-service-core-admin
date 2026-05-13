"use client"

import { Toaster } from "sonner"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SuperAdminSidebar } from "@/components/super-admin/super-admin-sidebar"
import { Header } from "@/components/header"
import { AdminSocketProvider } from "@/contexts/admin-socket-context"

export function DashboardLayoutClient({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "default" | "super-admin"
}) {
  return (
    <SidebarProvider>
      <AdminSocketProvider>
        {variant === "super-admin" ? <SuperAdminSidebar /> : <AppSidebar />}
        <SidebarInset>
          <Toaster richColors closeButton position="top-right" />
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </SidebarInset>
      </AdminSocketProvider>
    </SidebarProvider>
  )
}
