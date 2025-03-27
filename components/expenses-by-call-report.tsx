"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExpenseDetailView } from "@/components/expense-detail-view"
import { groupExpensesByCalls, calculateExpensesByCall } from "@/utils/expense-utils"
import { useStorage } from "@/hooks/use-storage"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ExpensesByCallReportProps {
  startDate: string
  endDate: string
  submitterId?: string
}

export function ExpensesByCallReport({ startDate, endDate, submitterId }: ExpensesByCallReportProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [calls, setCalls] = useState<any[]>([])
  const [groupedExpenses, setGroupedExpenses] = useState<Record<string, any[]>>({})
  const [expenseTotals, setExpenseTotals] = useState<Record<string, number>>({})

  const { getAllExpenses, getAllCallNotes } = useStorage()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch expenses
        const expensesData = await getAllExpenses({
          startDate,
          endDate,
          userId: submitterId,
        })

        // Fetch calls
        const callsData = await getAllCallNotes({
          startDate,
          endDate,
          userId: submitterId,
        })

        setExpenses(expensesData || [])
        setCalls(callsData || [])

        // Group expenses by associated call
        const grouped = groupExpensesByCalls(expensesData || [])
        setGroupedExpenses(grouped)

        // Calculate totals by call
        const totals = calculateExpensesByCall(expensesData || [])
        setExpenseTotals(totals)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "An error occurred while fetching data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, submitterId, getAllExpenses, getAllCallNotes])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const callNames = Object.keys(groupedExpenses).filter((name) => name !== "Unassociated")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expenses by Customer Call</CardTitle>
        <CardDescription>View expenses grouped by their associated customer calls</CardDescription>
      </CardHeader>
      <CardContent>
        {callNames.length === 0 && !groupedExpenses["Unassociated"]?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No expenses found for this period.</p>
          </div>
        ) : (
          <Tabs defaultValue={callNames.length > 0 ? callNames[0] : "Unassociated"}>
            <TabsList className="mb-4">
              {callNames.map((callName) => (
                <TabsTrigger key={callName} value={callName}>
                  {callName} ({formatCurrency(expenseTotals[callName])})
                </TabsTrigger>
              ))}
              {groupedExpenses["Unassociated"]?.length > 0 && (
                <TabsTrigger value="Unassociated">
                  Unassociated ({formatCurrency(expenseTotals["Unassociated"])})
                </TabsTrigger>
              )}
            </TabsList>

            {Object.entries(groupedExpenses).map(([callName, callExpenses]) => (
              <TabsContent key={callName} value={callName} className="space-y-4">
                {callExpenses.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No expenses associated with this call.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">Total: {formatCurrency(expenseTotals[callName])}</h3>
                    </div>

                    <div className="space-y-4">
                      {callExpenses.map((expense) => (
                        <ExpenseDetailView key={expense.id} expense={expense} />
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

