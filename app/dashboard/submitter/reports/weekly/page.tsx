"use client"

import { useRouter } from "next/navigation"
import { WeeklyReportView } from "@/components/weekly-report-view"
import { BackButton } from "@/components/back-button"

export default function WeeklyReportPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4">
        <BackButton href="/dashboard/submitter/reports" label="Back to Reports" />
      </div>
      <WeeklyReportView />
    </div>
  )
}

