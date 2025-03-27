"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { DailyCallReportForm } from "@/components/daily-call-report-form"
import { BackButton } from "@/components/back-button"
import { parseISO } from "date-fns"
import { useState } from "react"

export default function DailyReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Parse the date parameter if it exists
  const initialDate = dateParam ? parseISO(dateParam) : new Date()

  const handleCancel = () => {
    router.push("/dashboard/submitter")
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    // Add a small delay to ensure the database has time to update
    setTimeout(() => {
      router.push("/dashboard/submitter")
    }, 500)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <BackButton href="/dashboard/submitter" label="Back to Dashboard" />
      </div>
      <DailyCallReportForm
        initialDate={initialDate}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        key={`${dateParam || "new-report"}-${Date.now()}`} // Add timestamp to force re-render
      />
    </div>
  )
}

