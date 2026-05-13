/**
 * Alerta de soporte: patrón tipo alarma (pitidos rápidos alternando tonos agudos)
 * para ambientes ruidosos. Onda cuadrada + compresor para volumen máximo seguro.
 */

/** Milisegundos entre cada ráfaga de pitidos mientras haya soporte pendiente. */
const ALERT_BURST_INTERVAL_MS = 3200

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

async function playUrgentAlertBurst(): Promise<void> {
  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === "suspended") {
    try {
      await ctx.resume()
    } catch {
      return
    }
  }
  if (ctx.state !== "running") return

  const t0 = ctx.currentTime

  // Compresor dinámico: maximiza el volumen percibido sin distorsión
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.setValueAtTime(-3, t0)
  compressor.knee.setValueAtTime(6, t0)
  compressor.ratio.setValueAtTime(4, t0)
  compressor.attack.setValueAtTime(0.001, t0)
  compressor.release.setValueAtTime(0.1, t0)
  compressor.connect(ctx.destination)

  /** Pitido corto y fuerte (ataque lineal para pulsos de ~60 ms). */
  function beep(freq: number, start: number, durSec: number): void {
    const o = ctx!.createOscillator()
    const g = ctx!.createGain()
    o.type = "square"
    o.frequency.setValueAtTime(freq, start)
    const attack = 0.004
    const release = Math.max(0.012, durSec * 0.35)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.linearRampToValueAtTime(0.68, start + attack)
    g.gain.setValueAtTime(0.68, start + durSec - release)
    g.gain.exponentialRampToValueAtTime(0.0001, start + durSec)
    o.connect(g)
    g.connect(compressor)
    o.start(start)
    o.stop(start + durSec + 0.008)
  }

  // Ráfaga urgente: 10 pitidos alternando agudo/medio (corta el ruido del local).
  const fHigh = 1550
  const fLow = 980
  const beepLen = 0.058
  const gap = 0.055
  let t = t0
  for (let i = 0; i < 10; i++) {
    const freq = i % 2 === 0 ? fHigh : fLow
    beep(freq, t, beepLen)
    t += beepLen + gap
  }
}

export function startSupportAlertLoop(): void {
  stopSupportAlertLoop()
  void playUrgentAlertBurst()
  intervalId = setInterval(() => void playUrgentAlertBurst(), ALERT_BURST_INTERVAL_MS)
}

export function stopSupportAlertLoop(): void {
  if (intervalId != null) {
    clearInterval(intervalId)
    intervalId = null
  }
}
