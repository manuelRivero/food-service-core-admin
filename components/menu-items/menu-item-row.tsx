"use client"

import { Eye, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import type { MenuItem } from "./types"

interface MenuItemRowProps {
  item: MenuItem
  onViewDetails: (item: MenuItem) => void
  onDelete: (item: MenuItem) => void
}

export function MenuItemRow({
  item,
  onViewDetails,
  onDelete,
}: MenuItemRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="size-10 rounded-md object-cover"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
              N/A
            </div>
          )}
          <span className="max-w-[200px] truncate font-medium">{item.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {item.menuCategoryTag ?? "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {item.menuCategoryName ?? "—"}
      </TableCell>
      <TableCell>
        <Badge variant={item.available ? "default" : "secondary"}>
          {item.available ? "Disponible" : "No disponible"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={item.featured ? "default" : "outline"}>
          {item.featured ? "Destacado" : "Normal"}
        </Badge>
      </TableCell>
      <TableCell className="text-center tabular-nums">
        {item.servesPeople ?? "—"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onViewDetails(item)}
          >
            <Eye className="size-4" />
            <span className="sr-only">Ver detalle</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            asChild
          >
            <Link href={`/menu-items/${item.id}/edit`}>
              <Pencil className="size-4" />
              <span className="sr-only">Editar</span>
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(item)}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
