"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DailyCallReportForm } from "@/components/daily-call-report-form"
import { BackButton } from "@/components/back-button"
import { parseISO } from "date-fns"

export default function DailyReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")

  // Parse the date parameter if it exists
  const initialDate = dateParam ? parseISO(dateParam) : new Date()

  const handleCancel = () => {
    router.push("/dashboard/submitter")
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <BackButton href="/dashboard/submitter" label="Back to Dashboard" />
      </div>
      <DailyCallReportForm
        initialDate={initialDate}
        onCancel={handleCancel}
        onSubmit={() => router.push("/dashboard/submitter")}
      />
    </div>
  )
}

