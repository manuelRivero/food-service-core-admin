"use client"

import { useState } from "react"
import { UtensilsCrossed, Plus } from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@/components/ui/empty"
import { MenuItemRow } from "./menu-item-row"
import { MenuItemDetailsModal } from "./menu-item-details-modal"
import { ConfirmDeleteDialog } from "./confirm-delete-dialog"
import type { MenuItem } from "./types"

interface MenuItemsTableProps {
  items: MenuItem[]
  isLoading?: boolean
  onItemDeleted?: (id: string) => void
}

export function MenuItemsTable({
  items,
  isLoading,
  onItemDeleted,
}: MenuItemsTableProps) {
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleViewDetails = (item: MenuItem) => {
    setSelectedItem(item)
    setDetailsOpen(true)
  }

  const handleEdit = (item: MenuItem) => {
    toast.info(`Editar "${item.name}" - Funcionalidad próximamente`)
  }

  const handleDeleteClick = (item: MenuItem) => {
    setDeleteItem(item)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (deleteItem) {
      onItemDeleted?.(deleteItem.id)
      toast.success(`"${deleteItem.name}" eliminado correctamente`)
    }
    setDeleteDialogOpen(false)
    setDeleteItem(null)
  }

  if (isLoading) {
    return <MenuItemsTableSkeleton />
  }

  if (items.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UtensilsCrossed />
          </EmptyMedia>
          <EmptyTitle>No hay productos en el menú</EmptyTitle>
          <EmptyDescription>
            Aún no se han agregado productos al menú. Crea el primer producto
            para comenzar.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>
            <Plus className="mr-2 size-4" />
            Crear producto
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Disponibilidad</TableHead>
              <TableHead>Destacado</TableHead>
              <TableHead className="text-center">Porciones</TableHead>
              <TableHead>Fecha creación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <MenuItemRow
                key={item.id}
                item={item}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <MenuItemDetailsModal
        item={selectedItem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <ConfirmDeleteDialog
        item={deleteItem}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}

function MenuItemsTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Disponibilidad</TableHead>
            <TableHead>Destacado</TableHead>
            <TableHead className="text-center">Porciones</TableHead>
            <TableHead>Fecha creación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-md" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="mx-auto h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Need to import TableCell for skeleton
import { TableCell } from "@/components/ui/table"
