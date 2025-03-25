"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay, eachDayOfInterval, isWeekend } from "date-fns"

interface WeekSelectorProps {
  currentDate: Date
  onWeekChange: (weekStart: Date, weekEnd: Date, days: Date[]) => void
  showWeekends: boolean
  onToggleWeekends: (show: boolean) => void
}

export function WeekSelector({ currentDate, onWeekChange, showWeekends, onToggleWeekends }: WeekSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate)

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
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </span>
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

