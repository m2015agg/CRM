"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  eachDayOfInterval,
  isWeekend,
  parse,
} from "date-fns"

interface WeekSelectorProps {
  currentDate: Date
  onWeekChange: (weekStart: Date, weekEnd: Date, days: Date[]) => void
  showWeekends: boolean
  onToggleWeekends: (show: boolean) => void
}

export function WeekSelector({ currentDate, onWeekChange, showWeekends, onToggleWeekends }: WeekSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)
  const [monthInput, setMonthInput] = useState<string>(format(currentDate, "MM"))
  const [yearInput, setYearInput] = useState<string>(format(currentDate, "yyyy"))
  const [open, setOpen] = useState(false)

  // Get the start and end of the week for the selected date
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }) // Sunday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 }) // Saturday

  // Get all days of the current week
  const allDaysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Filter out weekends if showWeekends is false
  const daysOfWeek = showWeekends ? allDaysOfWeek : allDaysOfWeek.filter((day) => !isWeekend(day))

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = subWeeks(selectedDate, 1)
    setSelectedDate(newDate)
    updateWeek(newDate)
  }

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = addWeeks(selectedDate, 1)
    setSelectedDate(newDate)
    updateWeek(newDate)
  }

  // Go to current week
  const goToCurrentWeek = () => {
    const today = new Date()
    setSelectedDate(today)
    updateWeek(today)
  }

  // Update the week based on the selected date
  const updateWeek = (date: Date) => {
    const newWeekStart = startOfWeek(date, { weekStartsOn: 0 })
    const newWeekEnd = endOfWeek(date, { weekStartsOn: 0 })
    const allDays = eachDayOfInterval({ start: newWeekStart, end: newWeekEnd })

    // Filter days based on showWeekends setting
    const filteredDays = showWeekends ? allDays : allDays.filter((day) => !isWeekend(day))

    onWeekChange(newWeekStart, newWeekEnd, filteredDays)
  }

  // Handle date selection from inputs
  const handleDateSelect = () => {
    try {
      // Validate inputs
      const month = Number.parseInt(monthInput)
      const year = Number.parseInt(yearInput)

      if (isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 1900 || year > 2100) {
        throw new Error("Invalid date")
      }

      // Create a date string and parse it
      const dateString = `${year}-${monthInput.padStart(2, "0")}-15`
      const newDate = parse(dateString, "yyyy-MM-dd", new Date())

      setSelectedDate(newDate)
      updateWeek(newDate)
      setOpen(false)
    } catch (error) {
      console.error("Error selecting date:", error)
      // Reset inputs to current selection
      setMonthInput(format(selectedDate, "MM"))
      setYearInput(format(selectedDate, "yyyy"))
    }
  }

  // Handle weekend toggle
  const handleToggleWeekends = () => {
    const newShowWeekends = !showWeekends
    onToggleWeekends(newShowWeekends)

    // Update the days shown based on the new setting
    const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const filteredDays = newShowWeekends ? allDays : allDays.filter((day) => !isWeekend(day))

    onWeekChange(weekStart, weekEnd, filteredDays)
  }

  // Check if the selected week is the current week
  const isCurrentWeek = isSameDay(startOfWeek(new Date(), { weekStartsOn: 0 }), weekStart)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between bg-card rounded-lg border p-2 shadow-sm">
        <Button variant="outline" size="icon" onClick={goToPreviousWeek} aria-label="Previous week">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Select Month and Year</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="month" className="text-sm font-medium">
                      Month (1-12)
                    </label>
                    <input
                      id="month"
                      type="number"
                      min="1"
                      max="12"
                      value={monthInput}
                      onChange={(e) => setMonthInput(e.target.value)}
                      className="rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label htmlFor="year" className="text-sm font-medium">
                      Year
                    </label>
                    <input
                      id="year"
                      type="number"
                      min="1900"
                      max="2100"
                      value={yearInput}
                      onChange={(e) => setYearInput(e.target.value)}
                      className="rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                </div>
                <Button onClick={handleDateSelect} className="w-full">
                  Go to Date
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {!isCurrentWeek && (
            <Button variant="ghost" size="sm" onClick={goToCurrentWeek} className="h-7 text-xs">
              Today
            </Button>
          )}
        </div>

        <Button variant="outline" size="icon" onClick={goToNextWeek} aria-label="Next week">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="show-weekends" checked={showWeekends} onCheckedChange={handleToggleWeekends} />
        <label
          htmlFor="show-weekends"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Show weekend days (Saturday & Sunday)
        </label>
      </div>
    </div>
  )
}

