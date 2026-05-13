/**
 * Alerta sonora discreta pero perceptible mientras haya soporte pendiente
 * y el usuario no esté en la pantalla de mensajes.
 */

let intervalId: ReturnType<typeof setInterval> | null = null
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const AC =
      window.AudioContext ||
      (
        window as unknown as {
          webkitAudioContext: typeof AudioContext
        }
      ).webkitAudioContext
    if (!AC) return null
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AC()
    }
    return audioContext
  } catch {
    return null
  }
}

function playChimeOnce(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === "suspended") {
    void ctx.resume()
  }

  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = "sine"
  const t0 = ctx.currentTime
  o.frequency.setValueAtTime(698, t0)
  o.frequency.setValueAtTime(932, t0 + 0.1)
  o.frequency.setValueAtTime(784, t0 + 0.22)

  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42)

  o.connect(g)
  g.connect(ctx.destination)
  o.start(t0)
  o.stop(t0 + 0.45)
}

export function startSupportAlertLoop(): void {
  stopSupportAlertLoop()
  playChimeOnce()
  intervalId = setInterval(playChimeOnce, 8200)
}

export function stopSupportAlertLoop(): void {
  if (intervalId != null) {
    clearInterval(intervalId)
    intervalId = null
  }
}
