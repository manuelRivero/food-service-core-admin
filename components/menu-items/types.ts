export enum MenuCategoryTag {
  STARTER = "STARTER",
  MAIN = "MAIN",
  DRINK = "DRINK",
  DESSERT = "DESSERT",
  SIDE = "SIDE",
  SALAD = "SALAD",
  SOUP = "SOUP",
  SNACK = "SNACK",
  BREAKFAST = "BREAKFAST",
  KIDS = "KIDS",
  SPECIAL = "SPECIAL",
}

export const MENU_CATEGORY_TAG_LABELS: Record<string, string> = {
  [MenuCategoryTag.STARTER]: "Entrada",
  [MenuCategoryTag.MAIN]: "Plato principal",
  [MenuCategoryTag.DRINK]: "Bebida",
  [MenuCategoryTag.DESSERT]: "Postre",
  [MenuCategoryTag.SIDE]: "Guarnición",
  [MenuCategoryTag.SALAD]: "Ensalada",
  [MenuCategoryTag.SOUP]: "Sopa",
  [MenuCategoryTag.SNACK]: "Snack",
  [MenuCategoryTag.BREAKFAST]: "Desayuno",
  [MenuCategoryTag.KIDS]: "Menú infantil",
  [MenuCategoryTag.SPECIAL]: "Especial",
}

export function formatMenuCategoryTag(tag: string | null | undefined): string {
  if (!tag) return "—"
  return MENU_CATEGORY_TAG_LABELS[tag.toUpperCase()] ?? tag
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  categoryId: string | null
  categoryName?: string | null
  menuCategoryId?: string | null
  menuCategoryName?: string | null
  menuCategoryTag?: string | null
  imageUrl: string | null
  available: boolean
  featured: boolean
  price: number | null
  currencyCode: string | null
  servesPeople: number | null
  ingredients: string | null
  ingredientsNotes: string | null
  preparation: string | null
  createdAt: Date
}
