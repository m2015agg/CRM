"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WeekSelector } from "@/components/week-selector"
import { DailyReportSummary } from "@/components/daily-report-summary"
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWeekend } from "date-fns"

export default function SubmitterDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [showWeekends, setShowWeekends] = useState<boolean>(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Initialize with weekdays only
  const today = new Date()
  const initialWeekStart = startOfWeek(today, { weekStartsOn: 0 })
  const initialWeekEnd = endOfWeek(today, { weekStartsOn: 0 })
  const allDaysOfWeek = eachDayOfInterval({ start: initialWeekStart, end: initialWeekEnd })
  const initialDays = allDaysOfWeek.filter((day) => !isWeekend(day))

  const [weekStart, setWeekStart] = useState<Date>(initialWeekStart)
  const [weekEnd, setWeekEnd] = useState<Date>(initialWeekEnd)
  const [daysOfWeek, setDaysOfWeek] = useState<Date[]>(initialDays)

  useEffect(() => {
    // Check if user is submitter, if not redirect
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

  useEffect(() => {
    // This will run when the component mounts or when the route changes
    const handleRouteChange = () => {
      console.log("Dashboard: Refreshing data")
      setRefreshKey((prev) => prev + 1)
    }

    // Call once on mount
    handleRouteChange()

    return () => {
      // Cleanup
    }
  }, [])

  const handleWeekChange = (newWeekStart: Date, newWeekEnd: Date, days: Date[]) => {
    setWeekStart(newWeekStart)
    setWeekEnd(newWeekEnd)
    setDaysOfWeek(days)
  }

  const handleToggleWeekends = (show: boolean) => {
    setShowWeekends(show)
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Removed EQUIPCRM title */}

      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
          <CardDescription>View and manage your daily reports for the week</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <WeekSelector
            currentDate={new Date()}
            onWeekChange={handleWeekChange}
            showWeekends={showWeekends}
            onToggleWeekends={handleToggleWeekends}
          />

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

