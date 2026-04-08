export interface MenuItem {
  id: string
  name: string
  description: string | null
  categoryId: string | null
  categoryName?: string | null
  imageUrl: string | null
  available: boolean
  featured: boolean
  servesPeople: number | null
  ingredients: string | null
  ingredientsNotes: string | null
  preparation: string | null
  createdAt: Date
}
