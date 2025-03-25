"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format, isToday, isPast, isFuture } from "date-fns"
import { getSupabaseClient } from "@/lib/supabase/client"
import { FileText, DollarSign, Car, Plus } from "lucide-react"
import Link from "next/link"

interface DailyReportSummaryProps {
  date: Date
  userId: string
}

export function DailyReportSummary({ date, userId }: DailyReportSummaryProps) {
  const [report, setReport] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const formattedDate = format(date, "yyyy-MM-dd")
  const displayDate = format(date, "EEEE, MMMM d")
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchDailyData = async () => {
      setIsLoading(true)

      try {
        // Fetch daily report with proper headers
        const { data: reportData, error: reportError } = await supabase
          .from("daily_reports")
          .select("*")
          .eq("submitter_id", userId)
          .eq("report_date", formattedDate)
          .single()

        if (!reportError) {
          setReport(reportData)
        } else if (reportError.code !== "PGRST116") {
          // PGRST116 is "no rows returned" which is expected for days without reports
          console.error("Error fetching daily report:", reportError)
        }

        // Fetch expenses for the day with proper headers
        const { data: expensesData, error: expensesError } = await supabase
          .from("expenses")
          .select("*")
          .eq("submitter_id", userId)
          .eq("expense_date", formattedDate)

        if (!expensesError && expensesData) {
          setExpenses(expensesData)
        } else if (expensesError) {
          console.error("Error fetching expenses:", expensesError)
        }
      } catch (error) {
        console.error("Error fetching daily data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDailyData()
  }, [userId, formattedDate, supabase])

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Determine card status
  const getCardStatus = () => {
    if (isToday(date)) return "today"
    if (isPast(date)) {
      return report ? "completed" : "missed"
    }
    if (isFuture(date)) return "upcoming"
    return "normal"
  }

  const status = getCardStatus()

  // Determine card styling based on status
  const getCardClasses = () => {
    switch (status) {
      case "today":
        return "border-blue-400 shadow-md"
      case "completed":
        return "border-green-400"
      case "missed":
        return "border-amber-400"
      case "upcoming":
        return "border-gray-200 opacity-75"
      default:
        return ""
    }
  }

  if (isLoading) {
    return (
      <Card className="h-[180px]">
        <CardContent className="p-4">
          <Skeleton className="h-5 w-1/3 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`h-full ${getCardClasses()}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-medium">{displayDate}</h3>
            {status === "today" && (
              <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                Today
              </Badge>
            )}
            {status === "completed" && (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                Completed
              </Badge>
            )}
            {status === "missed" && isPast(date) && (
              <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                Missing
              </Badge>
            )}
          </div>
        </div>

        {report ? (
          <div className="space-y-2">
            {report.mileage > 0 && (
              <div className="flex items-center text-sm">
                <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{report.mileage} miles</span>
              </div>
            )}

            {expenses.length > 0 && (
              <div className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>${totalExpenses.toFixed(2)} in expenses</span>
              </div>
            )}

            {report.comments && <div className="text-sm text-muted-foreground line-clamp-2">{report.comments}</div>}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-16 text-center text-muted-foreground">
            {isPast(date) ? (
              <p className="text-sm">No report submitted</p>
            ) : (
              <p className="text-sm">Report not yet created</p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {report ? (
          <Button variant="outline" className="w-full" asChild>
            <Link href={`/dashboard/submitter/reports/daily?date=${formattedDate}`}>
              <FileText className="h-4 w-4 mr-2" />
              View Report
            </Link>
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href={`/dashboard/submitter/reports/daily?date=${formattedDate}`}>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

