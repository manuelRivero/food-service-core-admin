"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MenuItemsTable } from "@/components/menu-items/menu-items-table"
import type { MenuItem } from "@/components/menu-items/types"

// Mock data for demonstration
const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Milanesa de ternera con papas fritas",
    description:
      "Clásica milanesa de ternera empanizada, acompañada de papas fritas caseras crujientes.",
    categoryId: "cat-1",
    categoryName: "Platos principales",
    imageUrl:
      "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=300&fit=crop",
    available: true,
    featured: true,
    servesPeople: 2,
    ingredients: "Ternera, huevo, pan rallado, papas, aceite, sal",
    ingredientsNotes: "Contiene gluten. Puede prepararse sin TACC bajo pedido.",
    preparation:
      "1. Filetear la carne y salpimentar.\n2. Pasar por huevo batido y luego por pan rallado.\n3. Freír en aceite caliente hasta dorar.\n4. Servir con papas fritas caseras.",
    createdAt: new Date("2024-01-15T10:30:00"),
  },
  {
    id: "2",
    name: "Ensalada César",
    description:
      "Fresca ensalada con lechuga romana, crutones, queso parmesano y aderezo César casero.",
    categoryId: "cat-2",
    categoryName: "Ensaladas",
    imageUrl:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
    available: true,
    featured: false,
    servesPeople: 1,
    ingredients:
      "Lechuga romana, crutones, queso parmesano, aderezo César, anchoas (opcional)",
    ingredientsNotes: "Aderezo contiene huevo crudo. Anchoas opcionales.",
    preparation: null,
    createdAt: new Date("2024-02-20T14:15:00"),
  },
  {
    id: "3",
    name: "Empanadas de carne (docena)",
    description:
      "Empanadas caseras de carne cortada a cuchillo, con cebolla, huevo y aceitunas.",
    categoryId: "cat-3",
    categoryName: "Entradas",
    imageUrl:
      "https://images.unsplash.com/photo-1604467715878-83e57e8bc129?w=400&h=300&fit=crop",
    available: true,
    featured: true,
    servesPeople: 4,
    ingredients:
      "Harina, carne vacuna, cebolla, huevo duro, aceitunas verdes, comino, pimentón",
    ingredientsNotes: "Contiene gluten.",
    preparation:
      "Masa casera con relleno de carne cortada a cuchillo, cocida al horno de barro.",
    createdAt: new Date("2024-03-05T09:00:00"),
  },
  {
    id: "4",
    name: "Tiramisú",
    description:
      "Postre italiano clásico con bizcochos de soletilla, café espresso, mascarpone y cacao.",
    categoryId: "cat-4",
    categoryName: "Postres",
    imageUrl:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop",
    available: false,
    featured: false,
    servesPeople: 1,
    ingredients:
      "Bizcochos de soletilla, café espresso, queso mascarpone, huevos, azúcar, cacao en polvo",
    ingredientsNotes: "Contiene huevo crudo, cafeína y lactosa.",
    preparation: null,
    createdAt: new Date("2024-03-10T16:45:00"),
  },
  {
    id: "5",
    name: "Parrillada completa",
    description:
      "Selección de cortes a la parrilla: vacío, entraña, chorizo, morcilla y molleja.",
    categoryId: "cat-1",
    categoryName: "Platos principales",
    imageUrl:
      "https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=300&fit=crop",
    available: true,
    featured: true,
    servesPeople: 4,
    ingredients:
      "Vacío, entraña, chorizo, morcilla, molleja, sal gruesa, chimichurri",
    ingredientsNotes: "Cocción a las brasas. Consultar puntos de cocción.",
    preparation:
      "Todos los cortes son seleccionados y cocinados a la parrilla con leña de quebracho.",
    createdAt: new Date("2024-01-20T11:00:00"),
  },
  {
    id: "6",
    name: "Ravioles de ricota con salsa filetto",
    description:
      "Ravioles caseros rellenos de ricota y espinaca con salsa de tomate fresco.",
    categoryId: "cat-1",
    categoryName: "Platos principales",
    imageUrl: null,
    available: true,
    featured: false,
    servesPeople: 2,
    ingredients:
      "Harina, huevo, ricota, espinaca, tomates, albahaca, ajo, aceite de oliva",
    ingredientsNotes: "Contiene gluten y lactosa. Opción vegana disponible.",
    preparation: null,
    createdAt: new Date("2024-04-01T08:30:00"),
  },
]

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate API loading
    const loadItems = async () => {
      setLoading(true)
      setError(null)
      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800))
        setItems(MOCK_MENU_ITEMS)
      } catch {
        setError("No se pudieron cargar los productos del menú.")
      } finally {
        setLoading(false)
      }
    }

    void loadItems()
  }, [])

  const handleItemDeleted = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleCreateNew = () => {
    toast.info("Crear nuevo producto - Funcionalidad próximamente")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Productos del menú
          </h1>
          <p className="text-muted-foreground">
            Administra los productos disponibles en tu menú
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 size-4" />
          Nuevo producto
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && (
        <p className="text-right text-sm text-muted-foreground">
          {items.length} producto{items.length === 1 ? "" : "s"}
        </p>
      )}

      <MenuItemsTable
        items={items}
        isLoading={loading}
        onItemDeleted={handleItemDeleted}
      />
    </div>
  )
}
