"use client"

import { useRouter } from "next/navigation"
import { WeeklyReportView } from "@/components/weekly-report-view"
import { BackButton } from "@/components/back-button"
// Import the new ExpensesByCallReport component
import { ExpensesByCallReport } from "@/components/expenses-by-call-report"
import { useState } from "react"
import { startOfWeek, endOfWeek, format } from "date-fns"

export default function WeeklyReportPage() {
  const router = useRouter()
  const [currentDate] = useState(new Date())

  // Calculate the start and end of the current week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })

  // Format dates for API calls
  const startDateStr = format(weekStart, "yyyy-MM-dd")
  const endDateStr = format(weekEnd, "yyyy-MM-dd")

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4">
        <BackButton href="/dashboard/submitter/reports" label="Back to Reports" />
      </div>
      <div className="space-y-8">
        <WeeklyReportView 
          startDate={startDateStr}
          endDate={endDateStr}
        />

        {/* Add the new expenses by call report */}
        <ExpensesByCallReport startDate={startDateStr} endDate={endDateStr} />
      </div>
    </div>
  )
}

