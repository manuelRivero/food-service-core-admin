export type UserRole = "STAFF" | "DELIVERY" | "ADMIN" | "MANAGER" | "OWNER" | "UNKNOWN"

function normalizeRole(raw: unknown): UserRole {
  if (typeof raw !== "string") return "UNKNOWN"
  const role = raw.trim().toUpperCase()
  if (role === "STAFF") return "STAFF"
  if (role === "DELIVERY") return "DELIVERY"
  if (role === "ADMIN") return "ADMIN"
  if (role === "MANAGER") return "MANAGER"
  if (role === "OWNER") return "OWNER"
  return "UNKNOWN"
}

export function resolveUserRole(payload: Record<string, unknown>): UserRole {
  const directRole = normalizeRole(payload.role)
  if (directRole !== "UNKNOWN") return directRole

  const nestedUser = payload.user
  if (nestedUser && typeof nestedUser === "object") {
    const nestedRole = normalizeRole((nestedUser as Record<string, unknown>).role)
    if (nestedRole !== "UNKNOWN") return nestedRole
  }

  const realmAccess = payload.realm_access
  if (realmAccess && typeof realmAccess === "object") {
    const roles = (realmAccess as Record<string, unknown>).roles
    if (Array.isArray(roles) && roles.some((item) => String(item).toUpperCase() === "STAFF")) {
      return "STAFF"
    }
    if (Array.isArray(roles) && roles.some((item) => String(item).toUpperCase() === "DELIVERY")) {
      return "DELIVERY"
    }
    if (Array.isArray(roles) && roles.some((item) => String(item).toUpperCase() === "OWNER")) {
      return "OWNER"
    }
  }

  return "UNKNOWN"
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  if (role === "STAFF") {
    return pathname === "/check-in" || pathname.startsWith("/check-in/")
  }

  if (role === "DELIVERY") {
    return pathname === "/delivery" || pathname.startsWith("/delivery/")
  }

  if (pathname === "/check-in" || pathname.startsWith("/check-in/")) {
    return role === "ADMIN" || role === "MANAGER" || role === "OWNER"
  }
  if (pathname === "/delivery" || pathname.startsWith("/delivery/")) {
    return role === "DELIVERY"
  }
  if (pathname === "/messages" || pathname.startsWith("/messages/")) {
    return role === "ADMIN" || role === "OWNER"
  }
  if (pathname === "/menu-items" || pathname.startsWith("/menu-items/")) {
    return role === "ADMIN" || role === "OWNER"
  }

  return true
}

export function defaultPathForRole(role: UserRole): string {
  if (role === "STAFF") return "/check-in"
  if (role === "DELIVERY") return "/delivery"
  return "/"
}
