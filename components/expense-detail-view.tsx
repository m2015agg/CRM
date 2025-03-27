"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FilePreview } from "@/components/file-preview"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Receipt, ExternalLink } from "lucide-react"

interface ExpenseDetailViewProps {
  expense: {
    id: string
    expense_date: string
    expense_type: string
    amount: number
    description?: string | null
    client_name?: string | null
    location?: string | null
    discussion_notes?: string | null
    receipt_url?: string | null
    associated_call?: string | null
  }
  onEdit?: (id: string) => void
}

export function ExpenseDetailView({ expense, onEdit }: ExpenseDetailViewProps) {
  const [expanded, setExpanded] = useState(false)
  const [viewReceipt, setViewReceipt] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  const formatExpenseType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="capitalize">{formatExpenseType(expense.expense_type)}</CardTitle>
            <CardDescription>
              {format(parseISO(expense.expense_date), "MMMM d, yyyy")}
              {expense.location && ` • ${expense.location}`}
            </CardDescription>
          </div>
          <Badge>{formatCurrency(expense.amount)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="mb-2 -ml-2 text-sm">
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              View Details
            </>
          )}
        </Button>

        {expanded && (
          <div className="space-y-3 mt-2">
            {expense.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm">{expense.description}</p>
              </div>
            )}

            {expense.associated_call && (
              <div>
                <h4 className="text-sm font-medium mb-1">Associated Call</h4>
                <p className="text-sm">{expense.associated_call}</p>
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
                {viewReceipt ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <FilePreview
                        url={expense.receipt_url}
                        className="max-w-sm mx-auto border border-gray-200 rounded-md shadow-sm"
                        showRemoveButton={false}
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-full bg-white/90 hover:bg-white"
                          onClick={() => window.open(expense.receipt_url, "_blank")}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="sr-only">Open Full Size</span>
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setViewReceipt(false)} className="mt-2">
                      Hide Receipt
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewReceipt(true)}
                    className="flex items-center"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    View Receipt
                  </Button>
                )}
              </div>
            )}

            {onEdit && (
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(expense.id)}>
                  Edit Expense
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

