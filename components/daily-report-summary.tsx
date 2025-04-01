"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExpenseDetailView } from "@/components/expense-detail-view"
import { getSupabaseClient } from "@/lib/supabase/client"
import { FilePreview } from "@/components/file-preview"

interface DailyReportSummaryProps {
  date?: Date
}

export function DailyReportSummary({ date = new Date() }: DailyReportSummaryProps) {
  const [report, setReport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      if (!date) return

      setIsLoading(true)
      setError(null)

      try {
        const formattedDate = format(date, "yyyy-MM-dd")
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
          .from("daily_reports")
          .select(`
            *,
            expenses:daily_report_expenses(*)
          `)
          .eq("report_date", formattedDate)
          .single()

        if (error) throw error

        setReport(data)
      } catch (err: any) {
        console.error("Error fetching report:", err)
        setError(err.message || "Failed to load report")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReport()
  }, [date])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Report</CardTitle>
          <CardDescription>{error || "Report not found"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Daily Report Summary</CardTitle>
              <CardDescription>{format(new Date(report.report_date), "MMMM d, yyyy")}</CardDescription>
            </div>
            <Badge variant={report.status === "submitted" ? "success" : "outline"}>
              {report.status === "submitted" ? "Submitted" : "Draft"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Call Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number of Calls:</span>
                  <span className="font-medium">{report.number_of_calls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number of Contacts:</span>
                  <span className="font-medium">{report.number_of_contacts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number of Appointments:</span>
                  <span className="font-medium">{report.number_of_appointments}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Expenses</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Expenses:</span>
                  <span className="font-medium">
                    $
                    {report.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0).toFixed(2) ||
                      "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Number of Expense Items:</span>
                  <span className="font-medium">{report.expenses?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {report.notes && (
            <div>
              <h3 className="font-medium mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{report.notes}</p>
            </div>
          )}

          {report.expenses && report.expenses.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Expense Details</h3>
              <div className="space-y-4">
                {report.expenses.map((expense: any) => (
                  <ExpenseDetailView key={expense.id} expense={expense} />
                ))}
              </div>
            </div>
          )}

          {report.file_urls && report.file_urls.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Attached Files</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {report.file_urls.map((url: string, index: number) => (
                  <FilePreview key={index} url={url} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

