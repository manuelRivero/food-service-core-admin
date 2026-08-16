"use client"

import { HelpCircle } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const RECORDING_POINTS = [
  {
    label: "Nombre",
    help: "Cómo querés que se llame la promo. Por ejemplo: “Martes de hamburguesas” o “2x1 en pizzas”.",
  },
  {
    label: "Beneficios",
    help: "Qué gana quien la usa: un porcentaje de descuento, un monto fijo, un precio especial, un producto de regalo o envío gratis.",
  },
  {
    label: "A quién está dirigida",
    help: "Quién puede usarla y con qué condición. Por ejemplo: si compra dos hamburguesas, solo delivery, o a partir de cierto monto.",
  },
  {
    label: "Vigencia",
    help: "Cuándo vale: días de la semana, horario (de 18 a 20), y si tiene fecha de inicio o fin.",
  },
] as const

export function PromotionRecordingGuide() {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Mencioná en el audio</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {RECORDING_POINTS.map((point) => (
          <li
            key={point.label}
            className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <span>{point.label}</span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Qué es ${point.label}`}
                >
                  <HelpCircle className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="max-w-64 text-xs leading-relaxed"
              >
                {point.help}
              </PopoverContent>
            </Popover>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Ej.: “Los martes, de 18 a 20, si alguien compra dos hamburguesas le
        regalamos papas.”
      </p>
    </div>
  )
}
