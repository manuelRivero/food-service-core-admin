"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MenuItemsTable } from "@/components/menu-items/menu-items-table"
import type { MenuItem } from "@/components/menu-items/types"
import {
  deleteAdminMenuItem,
  fetchAdminMenuCategoriesOptions,
  fetchAdminMenuItems,
  type MenuCategoryOption,
} from "@/lib/requests/menu-items"

const ALL_TAB_KEY = "todos"

function normalizeCategoryLabel(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryOptions, setCategoryOptions] = useState<MenuCategoryOption[]>([])
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(ALL_TAB_KEY)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [itemsData, categoriesData] = await Promise.all([
        fetchAdminMenuItems({
          page: 1,
          pageSize: 100,
          includeUnavailable: true,
        }),
        fetchAdminMenuCategoriesOptions(),
      ])
      setItems(itemsData.items)
      setTotal(itemsData.total)
      setCategoryOptions(categoriesData)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string })?.message ?? e.message
        : "No se pudieron cargar los productos del menú."
      setError(
        typeof msg === "string" && msg
          ? msg
          : "No se pudieron cargar los productos del menú.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const handleDeleteItem = useCallback(async (item: MenuItem) => {
    await deleteAdminMenuItem(item.id)
    setItems((prev) => prev.filter((x) => x.id !== item.id))
    setTotal((prev) => Math.max(0, prev - 1))
    toast.success(`"${item.name}" eliminado correctamente`)
  }, [])

  const handleCreateNew = () => {
    toast.info("Crear nuevo producto - Funcionalidad próximamente")
  }

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const selectedCategory = categoryOptions.find(
      (cat) => cat.id === activeCategoryTab,
    )
    const selectedCategoryName = normalizeCategoryLabel(selectedCategory?.name)

    return items.filter((item) => {
      const byName = !q || item.name.toLowerCase().includes(q)
      if (!byName) return false
      if (activeCategoryTab === ALL_TAB_KEY) return true

      const itemCategoryId = item.menuCategoryId ?? item.categoryId
      if (itemCategoryId && itemCategoryId === activeCategoryTab) {
        return true
      }

      const itemCategoryName = normalizeCategoryLabel(
        item.menuCategoryName ?? item.categoryName,
      )
      return Boolean(
        selectedCategoryName &&
          itemCategoryName &&
          itemCategoryName === selectedCategoryName,
      )
    })
  }, [items, searchQuery, activeCategoryTab, categoryOptions])

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
        <Button asChild>
          <Link href="/menu-items/new">
            <Plus className="mr-2 size-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre..."
          type="search"
          className="max-w-sm"
        />
        <Tabs
          value={activeCategoryTab}
          onValueChange={(value) =>
            setActiveCategoryTab(value)
          }
        >
          <TabsList>
            <TabsTrigger value={ALL_TAB_KEY}>Todos</TabsTrigger>
            {categoryOptions.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {!loading && !error && (
        <p className="text-right text-sm text-muted-foreground">
          {filteredItems.length} de {total} producto
          {total === 1 ? "" : "s"}
        </p>
      )}

      <MenuItemsTable
        items={filteredItems}
        isLoading={loading}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  )
}
