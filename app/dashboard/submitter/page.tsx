"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText } from "lucide-react"
import { WeekSelector } from "@/components/week-selector"
import { DailyReportSummary } from "@/components/daily-report-summary"
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWeekend } from "date-fns"
import Link from "next/link"

export default function SubmitterDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [showWeekends, setShowWeekends] = useState<boolean>(false)

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Dashboard</h2>
          <p className="text-muted-foreground">Manage your daily and weekly call reports</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/submitter/reports/daily">
              <Plus className="mr-2 h-4 w-4" />
              New Daily Report
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/submitter/reports/weekly">
              <FileText className="mr-2 h-4 w-4" />
              Weekly Summary
            </Link>
          </Button>
        </div>
      </div>

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
              <DailyReportSummary key={format(day, "yyyy-MM-dd")} date={day} userId={user?.id || ""} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

