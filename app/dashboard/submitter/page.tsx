"use client"

// Import necessary dependencies
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WeekSelector } from "@/components/week-selector"
import { DailyReportSummary } from "@/components/daily-report-summary"
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWeekend } from "date-fns"

/**
 * SubmitterDashboardPage Component
 * 
 * This is the main dashboard for submitters that provides:
 * - Weekly overview of daily reports
 * - Week selection functionality
 * - Daily report summaries
 * - Weekend toggle option
 */
export default function SubmitterDashboardPage() {
  // Authentication and routing hooks
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // State management for UI controls
  const [showWeekends, setShowWeekends] = useState<boolean>(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Initialize date-related state
  // This sets up the initial week view starting from Sunday
  const today = new Date()
  const initialWeekStart = startOfWeek(today, { weekStartsOn: 0 })
  const initialWeekEnd = endOfWeek(today, { weekStartsOn: 0 })
  const allDaysOfWeek = eachDayOfInterval({ start: initialWeekStart, end: initialWeekEnd })
  // Filter out weekends by default
  const initialDays = allDaysOfWeek.filter((day) => !isWeekend(day))

  // State for managing the current week view
  const [weekStart, setWeekStart] = useState<Date>(initialWeekStart)
  const [weekEnd, setWeekEnd] = useState<Date>(initialWeekEnd)
  const [daysOfWeek, setDaysOfWeek] = useState<Date[]>(initialDays)

  // Authentication check effect
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      console.log("User role:", user.role)
      if (user.role !== "submitter") {
        console.log("User is not submitter, redirecting to dashboard")
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router])

  // Data refresh effect
  useEffect(() => {
    const handleRouteChange = () => {
      console.log("Dashboard: Refreshing data")
      setRefreshKey((prev) => prev + 1)
    }

    // Initial data load
    handleRouteChange()
  }, [])

  // Event handlers for week selection and weekend toggle
  const handleWeekChange = (newWeekStart: Date, newWeekEnd: Date, days: Date[]) => {
    setWeekStart(newWeekStart)
    setWeekEnd(newWeekEnd)
    setDaysOfWeek(days)
  }

  const handleToggleWeekends = (show: boolean) => {
    setShowWeekends(show)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
          <CardDescription>View and manage your daily reports for the week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Week selection component with weekend toggle */}
          <WeekSelector
            currentDate={new Date()}
            onWeekChange={handleWeekChange}
            showWeekends={showWeekends}
            onToggleWeekends={handleToggleWeekends}
          />

          {/* Grid of daily report summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {daysOfWeek.map((day) => (
              <DailyReportSummary
                key={`${format(day, "yyyy-MM-dd")}-${refreshKey}`}
                date={day}
                userId={user?.id || ""}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

