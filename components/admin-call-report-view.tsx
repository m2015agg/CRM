"use client"

import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FilePreview } from "@/components/file-preview"
import { User, Calendar, Building, MapPin, FileText, DollarSign, Sparkles } from "lucide-react"

interface Call {
  id: string
  customer_name: string
  contact_name?: string
  location_type?: string
  notes: string
  attachments?: string[]
  summary?: string
}

interface Expense {
  id: string
  expense_type: string
  amount: number
  description: string | null
  receipt_url: string | null
}

interface AdminCallReportViewProps {
  date: Date
  calls: Call[]
  expenses: Expense[]
  submitterName: string
  mileage?: number
  comments?: string
}

export function AdminCallReportView({
  date,
  calls,
  expenses,
  submitterName,
  mileage = 0,
  comments = "",
}: AdminCallReportViewProps) {
  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="text-center space-y-2 print:space-y-1">
        <h1 className="text-2xl font-bold print:text-xl">Daily Call Report</h1>
        <p className="text-muted-foreground print:text-sm">
          {format(date, "EEEE, MMMM d, yyyy")}
        </p>
        <p className="text-muted-foreground print:text-sm">
          Submitted by: {submitterName}
        </p>
      </div>

      {/* Summary */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:p-0">
          <CardTitle className="text-lg print:text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="print:p-0">
          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Total Calls</span>
              </div>
              <p className="font-medium">{calls.length}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Total Expenses</span>
              </div>
              <p className="font-medium">
                ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
              </p>
            </div>
            {mileage > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Mileage</span>
                </div>
                <p className="font-medium">{mileage} miles</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calls */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:p-0">
          <CardTitle className="text-lg print:text-base">Calls</CardTitle>
        </CardHeader>
        <CardContent className="print:p-0">
          <div className="space-y-6 print:space-y-4">
            {calls.map((call, index) => (
              <div key={call.id} className="space-y-4 print:space-y-2">
                {index > 0 && <Separator className="print:my-2" />}
                <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Customer</span>
                    </div>
                    <p className="font-medium">{call.customer_name}</p>
                  </div>
                  {call.contact_name && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>Contact</span>
                      </div>
                      <p className="font-medium">{call.contact_name}</p>
                    </div>
                  )}
                  {call.location_type && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-4 w-4" />
                        <span>Location Type</span>
                      </div>
                      <p className="font-medium">{call.location_type}</p>
                    </div>
                  )}
                </div>

                {/* AI Summary */}
                {call.summary && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                      <span>AI Summary</span>
                    </div>
                    <div className="rounded-md border p-4 print:border-0 print:p-0 bg-muted/50">
                      <p className="whitespace-pre-wrap">{call.summary}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Notes</span>
                  </div>
                  <div className="rounded-md border p-4 print:border-0 print:p-0">
                    <p className="whitespace-pre-wrap">{call.notes}</p>
                  </div>
                </div>
                {call.attachments && call.attachments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Attachments</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                      {call.attachments.map((url, index) => (
                        <FilePreview key={index} url={url} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses */}
      {expenses.length > 0 && (
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="print:p-0">
            <CardTitle className="text-lg print:text-base">Expenses</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0">
            <div className="space-y-4 print:space-y-2">
              {expenses.map((expense, index) => (
                <div key={expense.id} className="space-y-2">
                  {index > 0 && <Separator className="print:my-2" />}
                  <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Type</span>
                      </div>
                      <p className="font-medium">{expense.expense_type}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Amount</span>
                      </div>
                      <p className="font-medium">${expense.amount.toFixed(2)}</p>
                    </div>
                    {expense.description && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>Description</span>
                        </div>
                        <p className="font-medium">{expense.description}</p>
                      </div>
                    )}
                  </div>
                  {expense.receipt_url && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Receipt</span>
                      </div>
                      <FilePreview url={expense.receipt_url} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {comments && (
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="print:p-0">
            <CardTitle className="text-lg print:text-base">Additional Comments</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0">
            <div className="rounded-md border p-4 print:border-0 print:p-0">
              <p className="whitespace-pre-wrap">{comments}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 