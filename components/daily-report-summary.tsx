"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format, isToday, isPast, isFuture } from "date-fns"
import { supabase } from "@/lib/supabase/client"
import { FileText, DollarSign, Car, Plus, AlertCircle, Users } from "lucide-react"
import Link from "next/link"

/**
 * Props interface for the DailyReportSummary component
 */
interface DailyReportSummaryProps {
  date: Date
  userId: string
}

/**
 * DailyReportSummary Component
 * 
 * Displays a summary card for a single day's report, including:
 * - Report status (completed, missing, upcoming)
 * - Mileage information
 * - Expense totals
 * - Client visit information
 * - Quick actions (view/edit report)
 */
export function DailyReportSummary({ date, userId }: DailyReportSummaryProps) {
  // State management for report data and UI
  const [report, setReport] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [callNotes, setCallNotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasDuplicates, setHasDuplicates] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Format dates for display and database queries
  const formattedDate = format(date, "yyyy-MM-dd")
  const displayDate = format(date, "EEEE, MMMM d")

  /**
   * Effect hook to fetch all daily data (reports, expenses, call notes)
   * Handles cleanup and error states
   */
  useEffect(() => {
    let isMounted = true

    const fetchDailyData = async () => {
      if (!userId) return

      setIsLoading(true)
      try {
        if (!supabase) {
          console.error("Supabase client not initialized")
          return
        }

        // Fetch daily reports
        const { data: reportData, error: reportError } = await supabase
          .from("daily_reports")
          .select("*")
          .eq("submitter_id", userId)
          .eq("report_date", formattedDate)
          .order("created_at", { ascending: false })

        if (!reportError && reportData && reportData.length > 0) {
          // Check for duplicate reports
          if (reportData.length > 1) {
            console.warn(`Found ${reportData.length} reports for ${formattedDate}`, reportData)
            setHasDuplicates(true)
          }

          // Use the most recent report
          if (isMounted) {
            setReport(reportData[0])
          }
        } else if (reportError && reportError.code !== "PGRST116") {
          console.error("Error fetching daily report:", reportError)
        }

        // Fetch expenses for the day
        const { data: expensesData, error: expensesError } = await supabase
          .from("expenses")
          .select("*")
          .eq("submitter_id", userId)
          .eq("expense_date", formattedDate)

        if (!expensesError && expensesData) {
          if (isMounted) {
            setExpenses(expensesData)
          }
        } else if (expensesError) {
          console.error("Error fetching expenses:", expensesError)
        }

        // Fetch call notes for the day
        const { data: callData, error: callError } = await supabase
          .from("call_notes")
          .select("*")
          .eq("submitter_id", userId)
          .eq("call_date", formattedDate)
          .order("created_at", { ascending: false })

        if (!callError && callData) {
          if (isMounted) {
            setCallNotes(callData)
          }
        } else if (callError) {
          console.error("Error fetching call notes:", callError)
        }
      } catch (error) {
        console.error("Error fetching daily data:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (userId) {
      fetchDailyData()
    }

    return () => {
      isMounted = false
    }
  }, [userId, formattedDate, refreshTrigger])

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Get unique client names from call notes
  const clientNames = [...new Set(callNotes.map((call) => call.client_name))]

  /**
   * Determine the status of the report card based on the date
   */
  const getCardStatus = () => {
    if (isToday(date)) return "today"
    if (isPast(date)) {
      return report ? "completed" : "missed"
    }
    if (isFuture(date)) return "upcoming"
    return "normal"
  }

  const status = getCardStatus()

  /**
   * Get appropriate card styling based on status
   */
  const getCardClasses = () => {
    switch (status) {
      case "today":
        return "border-blue-400 shadow-md"
      case "completed":
        return hasDuplicates ? "border-red-400" : "border-green-400"
      case "missed":
        return "border-amber-400"
      case "upcoming":
        return "border-gray-200 opacity-75"
      default:
        return ""
    }
  }

  // Loading state with skeleton UI
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
              <Badge
                variant="default"
                className={hasDuplicates ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
              >
                {hasDuplicates ? "Duplicates" : "Completed"}
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
            {hasDuplicates && (
              <div className="flex items-center text-xs text-red-600 mb-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Multiple reports found</span>
              </div>
            )}

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

            {clientNames.length > 0 && (
              <div className="flex items-start text-sm">
                <Users className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                <div>
                  {clientNames.length <= 3 ? (
                    <span>{clientNames.join(", ")}</span>
                  ) : (
                    <span>
                      {clientNames.slice(0, 2).join(", ")}
                      <span className="text-muted-foreground"> +{clientNames.length - 2} more</span>
                    </span>
                  )}
                </div>
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
              {hasDuplicates ? "Fix Duplicates" : "View Report"}
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

