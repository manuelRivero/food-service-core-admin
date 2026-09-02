import { resolveUserRole, type UserRole } from "@/lib/access-control"

export const AUTH_COOKIE_NAME = "fs_admin_token"

const MAX_AGE_SEC = 60 * 60 * 24 * 7

export function setAuthCookie(token: string) {
  if (typeof document === "undefined") return
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax`
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0`
}

export function getAuthCookie(): string | null {
  if (typeof document === "undefined") return null
  const escaped = AUTH_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const m = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

export function resolveAccessToken(data: {
  accessToken?: string
  token?: string
}): string | undefined {
  return data.accessToken ?? data.token
}

function decodeBase64Url(input: string): string | null {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)

  try {
    if (typeof atob === "function") {
      return atob(padded)
    }
    return null
  } catch {
    return null
  }
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payloadPart] = token.split(".")
  if (!payloadPart) return null

  const json = decodeBase64Url(payloadPart)
  if (!json) return null

  try {
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== "object") return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export function getUserRoleFromToken(token: string | null | undefined): UserRole {
  if (!token) return "UNKNOWN"
  const payload = decodeJwtPayload(token)
  if (!payload) return "UNKNOWN"
  return resolveUserRole(payload)
}

export function getUserRoleFromCookie(): UserRole {
  return getUserRoleFromToken(getAuthCookie())
}

export function getUserIdFromToken(token: string | null | undefined): string | null {
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  const userId = payload.userId ?? payload.sub
  return typeof userId === "string" && userId.trim() ? userId : null
}

export function getUserIdFromCookie(): string | null {
  return getUserIdFromToken(getAuthCookie())
}
