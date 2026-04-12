import { DashboardLayoutClient } from "@/components/dashboard-layout-client"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>
}
