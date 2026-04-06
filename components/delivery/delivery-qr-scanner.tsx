"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ScanIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeliveryQrScannerProps {
  onScan: (data: string) => void
  onCancel: () => void
  isProcessing?: boolean
}

export function DeliveryQrScanner({
  onScan,
  onCancel,
  isProcessing = false,
}: DeliveryQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stopScanning = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const scanQRCode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (
          window as unknown as {
            BarcodeDetector: new (options: { formats: string[] }) => {
              detect: (source: ImageData) => Promise<{ rawValue: string }[]>
            }
          }
        ).BarcodeDetector({
          formats: ["qr_code"],
        })
        const barcodes = await barcodeDetector.detect(imageData)
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          onScan(barcodes[0].rawValue)
          return
        }
      }
    } catch {
      // BarcodeDetector not supported or error, continue scanning
    }

    animationRef.current = requestAnimationFrame(scanQRCode)
  }, [onScan, isProcessing])

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            animationRef.current = requestAnimationFrame(scanQRCode)
          }
        }
      } catch (err) {
        const error = err as Error
        setError(error.message || "Failed to access camera")
      }
    }

    startCamera()

    return () => {
      stopScanning()
    }
  }, [scanQRCode, stopScanning])

  useEffect(() => {
    if (isProcessing) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    } else if (streamRef.current && !animationRef.current) {
      animationRef.current = requestAnimationFrame(scanQRCode)
    }
  }, [isProcessing, scanQRCode])

  const handleCancel = () => {
    stopScanning()
    onCancel()
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Escanear QR</h2>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <XIcon className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <p className="text-destructive text-sm">{error}</p>
          </div>
          <Button onClick={handleCancel}>Volver</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <h2 className="text-lg font-semibold text-white">Escanear QR del cliente</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="text-white hover:bg-white/20"
        >
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Camera */}
      <div className="relative flex-1">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Darkened areas */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Clear scanning area */}
          <div className="relative h-72 w-72">
            <div className="absolute inset-0 bg-transparent" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />

            {/* Corner brackets */}
            <div className="absolute top-0 left-0 h-10 w-10 border-l-4 border-t-4 border-white rounded-tl-xl" />
            <div className="absolute top-0 right-0 h-10 w-10 border-r-4 border-t-4 border-white rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 h-10 w-10 border-l-4 border-b-4 border-white rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 h-10 w-10 border-r-4 border-b-4 border-white rounded-br-xl" />

            {/* Scanning line animation */}
            {!isProcessing && (
              <div
                className="absolute left-3 right-3 h-0.5 bg-white/90 rounded-full"
                style={{ animation: "scan 2s ease-in-out infinite" }}
              />
            )}
          </div>
        </div>

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
              <p className="text-base font-medium">Validando QR...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-center gap-2 text-white/80">
          <ScanIcon className="h-5 w-5" />
          <span className="text-sm">Pide al cliente que muestre su codigo QR</span>
        </div>
      </div>
    </div>
  )
}
