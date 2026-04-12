"use client"

import { useState } from "react"
import { format, addDays } from "date-fns"
import { CalendarIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { BusinessWithSubscription } from "./types"

interface ExtendSubscriptionModalProps {
  business: BusinessWithSubscription | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (newEndDate: Date) => void
}

export function ExtendSubscriptionModal({
  business,
  open,
  onOpenChange,
  onConfirm,
}: ExtendSubscriptionModalProps) {
  const currentEndDate = business
    ? new Date(business.subscription.current_period_end)
    : new Date()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    addDays(currentEndDate, 30)
  )

  const handleQuickExtend = (days: number) => {
    setSelectedDate(addDays(currentEndDate, days))
  }

  const handleConfirm = () => {
    if (selectedDate) {
      onConfirm(selectedDate)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend Subscription</DialogTitle>
          <DialogDescription>
            Extend the subscription period for {business?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label>Current End Date</Label>
            <p className="text-sm text-muted-foreground">
              {format(currentEndDate, "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Quick Extend</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickExtend(30)}
              >
                +30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickExtend(60)}
              >
                +60 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickExtend(90)}
              >
                +90 days
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Custom Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {selectedDate ? (
                    format(selectedDate, "MMMM d, yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < currentEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedDate}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
