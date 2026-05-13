function normalizeToOrigin(raw: string): string {
  try {
    const normalized = raw.includes("://") ? raw : `http://${raw}`
    const u = new URL(normalized)
    return `${u.protocol}//${u.host}`
  } catch {
    return raw.replace(/\/$/, "").replace(/\/api$/, "")
  }
}

/**
 * Origen para Socket.IO (`io(base, { path: "/socket.io", ... })`).
 * Prioriza `NEXT_PUBLIC_SOCKET_URL`; si no está definida, deriva de `NEXT_PUBLIC_API`
 * o del origen del navegador en cliente.
 */
export function getSocketBaseUrl(): string {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim()
  if (socketUrl) {
    return normalizeToOrigin(socketUrl)
  }

  const raw = process.env.NEXT_PUBLIC_API?.trim()
  if (!raw) {
    if (typeof window !== "undefined") return window.location.origin
    return ""
  }
  return normalizeToOrigin(raw)
}
