"use client"

import { useState, useCallback, useRef } from "react"
import { Plus, Save, Move, Square, Circle, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Types
interface Table {
  id: string
  name: string
  capacity: number
  shape: "circle" | "rect"
  x: number
  y: number
  width?: number
  height?: number
  status: "available" | "reserved" | "blocked"
  environment: string
}

// Mock data
const initialTables: Table[] = [
  { id: "1", name: "T1", capacity: 4, shape: "circle", x: 80, y: 80, status: "available", environment: "interior" },
  { id: "2", name: "T2", capacity: 6, shape: "rect", x: 220, y: 80, width: 120, height: 60, status: "reserved", environment: "interior" },
  { id: "3", name: "T3", capacity: 2, shape: "circle", x: 400, y: 80, status: "available", environment: "interior" },
  { id: "4", name: "T4", capacity: 8, shape: "rect", x: 80, y: 220, width: 140, height: 70, status: "blocked", environment: "interior" },
  { id: "5", name: "T5", capacity: 4, shape: "circle", x: 300, y: 220, status: "available", environment: "interior" },
  { id: "6", name: "T6", capacity: 4, shape: "circle", x: 450, y: 220, status: "reserved", environment: "interior" },
  { id: "7", name: "T7", capacity: 6, shape: "rect", x: 80, y: 360, width: 100, height: 60, status: "available", environment: "terrace" },
  { id: "8", name: "T8", capacity: 4, shape: "circle", x: 250, y: 360, status: "available", environment: "terrace" },
  { id: "9", name: "T9", capacity: 10, shape: "rect", x: 400, y: 360, width: 160, height: 80, status: "reserved", environment: "terrace" },
  { id: "10", name: "T10", capacity: 2, shape: "circle", x: 80, y: 500, status: "available", environment: "outdoor" },
  { id: "11", name: "T11", capacity: 4, shape: "rect", x: 200, y: 500, width: 80, height: 80, status: "available", environment: "outdoor" },
]

const environments = [
  { value: "all", label: "Todos los ambientes" },
  { value: "interior", label: "Interior" },
  { value: "terrace", label: "Terraza" },
  { value: "outdoor", label: "Exterior" },
]

const statusColors = {
  available: "bg-emerald-500",
  reserved: "bg-red-500",
  blocked: "bg-gray-400",
}

const statusLabels = {
  available: "Disponible",
  reserved: "Reservada",
  blocked: "Bloqueada",
}

export default function TablesPage() {
  const { toast } = useToast()
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [environmentFilter, setEnvironmentFilter] = useState("all")
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const filteredTables = tables.filter(
    (table) => environmentFilter === "all" || table.environment === environmentFilter
  )

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null

  // Drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, tableId: string) => {
      e.preventDefault()
      const table = tables.find((t) => t.id === tableId)
      if (!table || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - canvasRect.left - table.x,
        y: e.clientY - canvasRect.top - table.y,
      })
      setSelectedTableId(tableId)
      setIsDragging(true)
    },
    [tables]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedTableId || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      const newX = Math.max(0, Math.min(canvasRect.width - 100, e.clientX - canvasRect.left - dragOffset.x))
      const newY = Math.max(0, Math.min(canvasRect.height - 80, e.clientY - canvasRect.top - dragOffset.y))

      setTables((prev) =>
        prev.map((t) =>
          t.id === selectedTableId ? { ...t, x: newX, y: newY } : t
        )
      )
    },
    [isDragging, selectedTableId, dragOffset]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedTableId(null)
    }
  }, [])

  // Form handlers
  const updateSelectedTable = useCallback(
    (updates: Partial<Table>) => {
      if (!selectedTableId) return
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, ...updates } : t))
      )
    },
    [selectedTableId]
  )

  const addNewTable = useCallback(() => {
    const newId = String(Date.now())
    const newTable: Table = {
      id: newId,
      name: `T${tables.length + 1}`,
      capacity: 4,
      shape: "circle",
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      status: "available",
      environment: environmentFilter === "all" ? "interior" : environmentFilter,
    }
    setTables((prev) => [...prev, newTable])
    setSelectedTableId(newId)
    toast({
      title: "Mesa agregada",
      description: `Se creó la mesa ${newTable.name}`,
    })
  }, [tables.length, environmentFilter, toast])

  const saveLayout = useCallback(() => {
    toast({
      title: "Layout guardado",
      description: "Los cambios se guardaron correctamente",
    })
  }, [toast])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mesas</h1>
          <p className="text-muted-foreground">
            Administra el plano de tu restaurante
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={addNewTable}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Mesa
          </Button>
          <Button onClick={saveLayout}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Layout
          </Button>
        </div>
      </div>

      {/* Environment filter */}
      <div className="flex items-center gap-4">
        <Label htmlFor="environment-filter" className="text-sm font-medium">
          Ambiente:
        </Label>
        <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
          <SelectTrigger id="environment-filter" className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {environments.map((env) => (
              <SelectItem key={env.value} value={env.value}>
                {env.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main content: Canvas + Properties Panel */}
      <div className="flex gap-6">
        {/* Canvas */}
        <div className="flex-1">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                ref={canvasRef}
                className={cn(
                  "relative h-[600px] cursor-crosshair select-none overflow-hidden",
                  "bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)]",
                  "bg-[size:20px_20px]"
                )}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
              >
                {filteredTables.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Square className="h-12 w-12 opacity-40" />
                    <p className="text-sm">No hay mesas en este ambiente</p>
                    <Button variant="outline" size="sm" onClick={addNewTable}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar primera mesa
                    </Button>
                  </div>
                ) : (
                  filteredTables.map((table) => (
                    <TableElement
                      key={table.id}
                      table={table}
                      isSelected={selectedTableId === table.id}
                      onMouseDown={(e) => handleMouseDown(e, table.id)}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6">
            <span className="text-sm font-medium text-muted-foreground">Leyenda:</span>
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", color)} />
                <span className="text-sm text-muted-foreground">
                  {statusLabels[status as keyof typeof statusLabels]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedTable && (
          <Card className="w-[320px] shrink-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Move className="h-4 w-4" />
                Propiedades de Mesa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="table-name">Nombre</Label>
                <Input
                  id="table-name"
                  value={selectedTable.name}
                  onChange={(e) => updateSelectedTable({ name: e.target.value })}
                  placeholder="Ej: T1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-capacity">Capacidad</Label>
                <Input
                  id="table-capacity"
                  type="number"
                  min={1}
                  max={20}
                  value={selectedTable.capacity}
                  onChange={(e) =>
                    updateSelectedTable({ capacity: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-shape">Forma</Label>
                <Select
                  value={selectedTable.shape}
                  onValueChange={(value: "circle" | "rect") =>
                    updateSelectedTable({
                      shape: value,
                      width: value === "rect" ? 100 : undefined,
                      height: value === "rect" ? 60 : undefined,
                    })
                  }
                >
                  <SelectTrigger id="table-shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">
                      <span className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        Circular
                      </span>
                    </SelectItem>
                    <SelectItem value="rect">
                      <span className="flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        Rectangular
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedTable.shape === "rect" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="table-width">Ancho</Label>
                    <Input
                      id="table-width"
                      type="number"
                      min={60}
                      max={200}
                      value={selectedTable.width || 100}
                      onChange={(e) =>
                        updateSelectedTable({ width: parseInt(e.target.value) || 100 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table-height">Alto</Label>
                    <Input
                      id="table-height"
                      type="number"
                      min={40}
                      max={150}
                      value={selectedTable.height || 60}
                      onChange={(e) =>
                        updateSelectedTable({ height: parseInt(e.target.value) || 60 })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="table-status">Estado</Label>
                <Select
                  value={selectedTable.status}
                  onValueChange={(value: "available" | "reserved" | "blocked") =>
                    updateSelectedTable({ status: value })
                  }
                >
                  <SelectTrigger id="table-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        Disponible
                      </span>
                    </SelectItem>
                    <SelectItem value="reserved">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        Reservada
                      </span>
                    </SelectItem>
                    <SelectItem value="blocked">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        Bloqueada
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-environment">Ambiente</Label>
                <Select
                  value={selectedTable.environment}
                  onValueChange={(value) => updateSelectedTable({ environment: value })}
                >
                  <SelectTrigger id="table-environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.slice(1).map((env) => (
                      <SelectItem key={env.value} value={env.value}>
                        {env.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={saveLayout}>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Table Element Component
function TableElement({
  table,
  isSelected,
  onMouseDown,
}: {
  table: Table
  isSelected: boolean
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const baseClasses = cn(
    "absolute flex cursor-move flex-col items-center justify-center border-2 transition-shadow",
    statusColors[table.status],
    isSelected
      ? "ring-2 ring-primary ring-offset-2 shadow-lg"
      : "hover:shadow-md"
  )

  const size = table.shape === "circle" ? 64 : undefined
  const width = table.shape === "rect" ? (table.width || 100) : size
  const height = table.shape === "rect" ? (table.height || 60) : size

  return (
    <div
      className={cn(
        baseClasses,
        table.shape === "circle" ? "rounded-full" : "rounded-lg"
      )}
      style={{
        left: table.x,
        top: table.y,
        width,
        height,
      }}
      onMouseDown={onMouseDown}
    >
      <span className="text-sm font-bold text-white drop-shadow-sm">
        {table.name}
      </span>
      <span className="flex items-center gap-0.5 text-xs text-white/90">
        <Users className="h-3 w-3" />
        {table.capacity}
      </span>
    </div>
  )
}
