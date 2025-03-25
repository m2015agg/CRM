"use client"

import React from "react"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FilePreview } from "@/components/file-preview"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type CallNote = Database["public"]["Tables"]["call_notes"]["Row"]
type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"]
type Expense = Database["public"]["Tables"]["expenses"]["Row"]

interface WeeklyReportViewProps {
  startDate: string
  endDate: string
  submitterId?: string
}

export function WeeklyReportView({ startDate, endDate, submitterId }: WeeklyReportViewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [callNotes, setCallNotes] = useState<CallNote[]>([])
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [totalMileage, setTotalMileage] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [expandedCallNote, setExpandedCallNote] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeeklyData = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()

        // Fetch user ID if not provided
        let userId = submitterId
        if (!userId) {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          userId = user?.id

          if (!userId) {
            throw new Error("User not authenticated")
          }
        }

        console.log(`Fetching data for user ${userId} from ${startDate} to ${endDate}`)

        // Fetch call notes
        const { data: callData, error: callError } = await supabase
          .from("call_notes")
          .select("*")
          .eq("submitter_id", userId)
          .gte("call_date", startDate)
          .lte("call_date", endDate)
          .order("call_date", { ascending: false })

        if (callError) {
          console.error("Error fetching call notes:", callError)
          throw new Error(`Failed to fetch call notes: ${callError.message}`)
        }

        console.log(`Fetched ${callData?.length || 0} call notes:`, callData)
        setCallNotes(callData || [])

        // Fetch daily reports
        const { data: reportData, error: reportError } = await supabase
          .from("daily_reports")
          .select("*")
          .eq("submitter_id", userId)
          .gte("report_date", startDate)
          .lte("report_date", endDate)
          .order("report_date", { ascending: false })

        if (reportError) {
          console.error("Error fetching daily reports:", reportError)
          throw new Error(`Failed to fetch daily reports: ${reportError.message}`)
        }

        console.log(`Fetched ${reportData?.length || 0} daily reports`)
        setDailyReports(reportData || [])

        // Calculate total mileage
        const mileage = reportData?.reduce((sum, report) => sum + (report.mileage || 0), 0) || 0
        setTotalMileage(mileage)

        // Fetch expenses
        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select("*")
          .eq("submitter_id", userId)
          .gte("expense_date", startDate)
          .lte("expense_date", endDate)
          .order("expense_date", { ascending: false })

        if (expenseError) {
          console.error("Error fetching expenses:", expenseError)
          throw new Error(`Failed to fetch expenses: ${expenseError.message}`)
        }

        console.log(`Fetched ${expenseData?.length || 0} expenses`)
        setExpenses(expenseData || [])

        // Calculate total expenses
        const total = expenseData?.reduce((sum, expense) => sum + expense.amount, 0) || 0
        setTotalExpenses(total)
      } catch (err) {
        console.error("Error in fetchWeeklyData:", err)
        setError(err instanceof Error ? err.message : "An error occurred while fetching data")
      } finally {
        setLoading(false)
      }
    }

    if (startDate && endDate) {
      fetchWeeklyData()
    }
  }, [startDate, endDate, submitterId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  const toggleCallNoteExpand = (id: string) => {
    if (expandedCallNote === id) {
      setExpandedCallNote(null)
    } else {
      setExpandedCallNote(id)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callNotes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Mileage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMileage} miles</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calls">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calls">Calls ({callNotes.length})</TabsTrigger>
          <TabsTrigger value="reports">Daily Reports ({dailyReports.length})</TabsTrigger>
          <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="space-y-4 mt-4">
          {callNotes.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No call notes found for this period.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Table View for Call Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Call Notes</CardTitle>
                  <CardDescription>All customer calls recorded during this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Date</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Location Type</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {callNotes.map((call) => (
                          <React.Fragment key={call.id}>
                            <TableRow>
                              <TableCell className="font-medium">
                                {format(parseISO(call.call_date), "MM/dd/yyyy")}
                              </TableCell>
                              <TableCell>{call.client_name}</TableCell>
                              <TableCell>{call.contact_name || "—"}</TableCell>
                              <TableCell>{call.location_type || "—"}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => toggleCallNoteExpand(call.id)}>
                                  {expandedCallNote === call.id ? (
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                  )}
                                  {expandedCallNote === call.id ? "Hide Details" : "View Details"}
                                </Button>
                              </TableCell>
                            </TableRow>

                            {/* Expanded Details Row */}
                            {expandedCallNote === call.id && (
                              <TableRow>
                                <TableCell colSpan={5} className="bg-muted/50">
                                  <div className="py-2 px-1">
                                    <div className="mb-4">
                                      <h4 className="text-sm font-medium mb-1">Notes</h4>
                                      <p className="text-sm whitespace-pre-wrap">{call.notes}</p>
                                    </div>

                                    {call.attachments && call.attachments.length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-medium mb-2">Attachments</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                          {call.attachments.map((attachment, index) => (
                                            <FilePreview key={index} url={attachment} />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Cards View (Alternative) */}
              <div className="space-y-4">
                {callNotes.map((call) => (
                  <Card key={call.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{call.client_name}</CardTitle>
                          <CardDescription>
                            {call.contact_name && `Contact: ${call.contact_name} • `}
                            {call.location_type && `${call.location_type} • `}
                            {format(parseISO(call.call_date), "MMMM d, yyyy")}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Notes</h4>
                        <p className="text-sm whitespace-pre-wrap">{call.notes}</p>
                      </div>

                      {call.attachments && call.attachments.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Attachments</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {call.attachments.map((attachment, index) => (
                              <FilePreview key={index} url={attachment} />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 mt-4">
          {dailyReports.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No daily reports found for this period.
              </CardContent>
            </Card>
          ) : (
            dailyReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {format(parseISO(report.report_date), "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                      Mileage: {report.mileage || 0} miles
                    </Badge>
                  </div>

                  {report.comments && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Comments</h4>
                      <p className="text-sm whitespace-pre-wrap">{report.comments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4 mt-4">
          {expenses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No expenses found for this period.
              </CardContent>
            </Card>
          ) : (
            expenses.map((expense) => (
              <Card key={expense.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="capitalize">{expense.expense_type.replace("_", " ")}</CardTitle>
                      <CardDescription>
                        {format(parseISO(expense.expense_date), "MMMM d, yyyy")}
                        {expense.location && ` • ${expense.location}`}
                      </CardDescription>
                    </div>
                    <Badge>{formatCurrency(expense.amount)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expense.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Description</h4>
                      <p className="text-sm">{expense.description}</p>
                    </div>
                  )}

                  {expense.client_name && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Client</h4>
                      <p className="text-sm">{expense.client_name}</p>
                    </div>
                  )}

                  {expense.discussion_notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Discussion Notes</h4>
                      <p className="text-sm whitespace-pre-wrap">{expense.discussion_notes}</p>
                    </div>
                  )}

                  {expense.receipt_url && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Receipt</h4>
                      <FilePreview url={expense.receipt_url} className="max-w-xs" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

