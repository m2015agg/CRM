"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, parseISO, isValid } from "date-fns"
import { DailyCallReportForm } from "@/components/daily-call-report-form"
import { DailyReportSummary } from "@/components/daily-report-summary"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function DailyReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get("date")

  const [date, setDate] = useState<Date | undefined>(
    dateParam && isValid(parseISO(dateParam)) ? parseISO(dateParam) : new Date(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [reportExists, setReportExists] = useState(false)

  useEffect(() => {
    const checkReportExists = async () => {
      if (!date) return

      setIsLoading(true)
      try {
        const formattedDate = format(date, "yyyy-MM-dd")
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
          .from("daily_reports")
          .select("id")
          .eq("report_date", formattedDate)
          .single()

        if (error && error.code !== "PGRST116") {
          console.error("Error checking report:", error)
        }

        setReportExists(!!data)
      } catch (err) {
        console.error("Failed to check report:", err)
      } finally {
        setIsLoading(false)
      }
    }

    checkReportExists()
  }, [date])

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return

    setDate(newDate)
    const formattedDate = format(newDate, "yyyy-MM-dd")
    router.push(`/dashboard/submitter/reports/daily?date=${formattedDate}`)
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Call Report</h1>
          <p className="text-muted-foreground">Submit your daily call report and track your progress</p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={date} onSelect={handleDateChange} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : reportExists ? (
        <DailyReportSummary date={date} />
      ) : (
        <DailyCallReportForm date={date} />
      )}
    </div>
  )
}

