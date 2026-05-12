"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MenuItemsTable } from "@/components/menu-items/menu-items-table"
import type { MenuItem } from "@/components/menu-items/types"
import {
  deleteAdminMenuItem,
  fetchAdminMenuCategoriesOptions,
  fetchAdminMenuCategoryTagsOptions,
  fetchAdminMenuItems,
  type MenuCategoryOption,
  type MenuCategoryTagOption,
} from "@/lib/requests/menu-items"

const ALL_TAB_KEY = "todos"

/** Filtro por tipo de plato (API de categorías de menú). */
const FILTER_MODE_CATEGORIES = "categories"
/** Filtro por sección de carta (MenuCategoryTag del producto). */
const FILTER_MODE_SECTIONS = "sections"

type FilterMode = typeof FILTER_MODE_CATEGORIES | typeof FILTER_MODE_SECTIONS

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
  const [sectionTagOptions, setSectionTagOptions] = useState<
    MenuCategoryTagOption[]
  >([])
  const [filterMode, setFilterMode] = useState<FilterMode>(FILTER_MODE_CATEGORIES)
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>(ALL_TAB_KEY)
  const [activeSectionTab, setActiveSectionTab] = useState<string>(ALL_TAB_KEY)

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [itemsData, categoriesData, tagOptionsData] = await Promise.all([
        fetchAdminMenuItems({
          page: 1,
          pageSize: 100,
          includeUnavailable: true,
        }),
        fetchAdminMenuCategoriesOptions(),
        fetchAdminMenuCategoryTagsOptions(),
      ])
      setItems(itemsData.items)
      setTotal(itemsData.total)
      setCategoryOptions(categoriesData)
      setSectionTagOptions(tagOptionsData)
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

  useEffect(() => {
    setActiveCategoryTab(ALL_TAB_KEY)
    setActiveSectionTab(ALL_TAB_KEY)
  }, [filterMode])

  const handleDeleteItem = useCallback(async (item: MenuItem) => {
    await deleteAdminMenuItem(item.id)
    setItems((prev) => prev.filter((x) => x.id !== item.id))
    setTotal((prev) => Math.max(0, prev - 1))
    toast.success(`"${item.name}" eliminado correctamente`)
  }, [])

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return items.filter((item) => {
      const byName = !q || item.name.toLowerCase().includes(q)
      if (!byName) return false

      if (filterMode === FILTER_MODE_CATEGORIES) {
        if (activeCategoryTab === ALL_TAB_KEY) return true
        const selected = categoryOptions.find((c) => c.id === activeCategoryTab)
        const selectedName = normalizeCategoryLabel(selected?.name)
        if (item.menuCategoryId && item.menuCategoryId === activeCategoryTab) {
          return true
        }
        const itemName = normalizeCategoryLabel(item.menuCategoryName)
        return Boolean(
          selectedName && itemName && itemName === selectedName,
        )
      }

      if (activeSectionTab === ALL_TAB_KEY) return true
      const itemTag = item.menuCategoryTag?.trim().toUpperCase() ?? ""
      return itemTag === activeSectionTab.trim().toUpperCase()
    })
  }, [
    items,
    searchQuery,
    filterMode,
    activeCategoryTab,
    activeSectionTab,
    categoryOptions,
  ])

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
          value={filterMode}
          onValueChange={(value) => setFilterMode(value as FilterMode)}
        >
          <TabsList className="flex flex-wrap h-fit">
            <TabsTrigger value={FILTER_MODE_CATEGORIES}>
              Categorías de platillos
            </TabsTrigger>
            <TabsTrigger value={FILTER_MODE_SECTIONS}>
              Secciones de la carta
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs
          value={
            filterMode === FILTER_MODE_CATEGORIES
              ? activeCategoryTab
              : activeSectionTab
          }
          onValueChange={(value) => {
            if (filterMode === FILTER_MODE_CATEGORIES) {
              setActiveCategoryTab(value)
            } else {
              setActiveSectionTab(value)
            }
          }}
        >
          <TabsList className="flex flex-wrap h-fit">
            <TabsTrigger value={ALL_TAB_KEY}>Todos</TabsTrigger>
            {filterMode === FILTER_MODE_CATEGORIES
              ? categoryOptions.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))
              : sectionTagOptions.map((section) => (
                  <TabsTrigger key={section.id} value={section.id}>
                    {section.name}
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
