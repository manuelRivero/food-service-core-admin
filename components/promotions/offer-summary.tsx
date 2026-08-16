import { Badge } from "@/components/ui/badge"
import type {
  PromotionDisplay,
  StructuredOffer,
} from "@/lib/requests/promotions"

export function OfferSummary({
  offer,
  display,
}: {
  offer: StructuredOffer
  display: PromotionDisplay
}) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-muted-foreground">Nombre</p>
        <p className="font-medium">{offer.name?.trim() || "Sin nombre"}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Beneficio</p>
        <p className="font-medium">{display.benefitLabel}</p>
      </div>
      <div>
        <p className="mb-1.5 text-muted-foreground">Condiciones</p>
        {display.conditions.length === 0 ? (
          <p>Sin condiciones</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {display.conditions.map((condition) => (
              <li key={condition.index}>{condition.label}</li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <p className="mb-1.5 text-muted-foreground">Vigencia</p>
        {display.validityLines.length === 0 ? (
          <p>Sin vigencia definida</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5">
            {display.validityLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
      {display.stackingLabel ? (
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{display.stackingLabel}</Badge>
        </div>
      ) : null}
    </div>
  )
}
