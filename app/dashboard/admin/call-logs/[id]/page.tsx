"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { AdminCallReportView } from "@/components/admin-call-report-view"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Printer, Sparkles } from "lucide-react"
import { summarizeCallNotes } from "@/lib/openai"
import { useToast } from "@/components/ui/use-toast"

export default function CallLogDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [callNote, setCallNote] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [isLoadingNote, setIsLoadingNote] = useState(true)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is admin, if not redirect
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      if (user.role !== "admin") {
        console.log("User is not admin, redirecting to dashboard")
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (isLoading || !user || user.role !== "admin") return

      try {
        setIsLoadingNote(true)

        // Fetch call note with user details
        const { data: callData, error: callError } = await supabase
          .from("call_notes")
          .select(`
            *,
            users:submitter_id(full_name, email, avatar_url)
          `)
          .eq("id", params.id)
          .single()

        if (callError) throw callError

        // Fetch expenses for this call's daily report
        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select("*")
          .eq("daily_reports_uuid", callData.daily_reports_uuid)

        if (expenseError) throw expenseError

        setCallNote(callData)
        setExpenses(expenseData || [])
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setIsLoadingNote(false)
      }
    }

    fetchData()
  }, [user, isLoading, params.id])

  const handleGenerateSummary = async () => {
    if (!callNote) return

    try {
      setIsGeneratingSummary(true)
      const summary = await summarizeCallNotes(callNote.id)
      
      // Update the local state with the new summary
      setCallNote((prev: any) => ({
        ...prev,
        summary
      }))

      toast({
        title: "Summary Generated",
        description: "The AI has generated a summary of the call notes.",
      })
    } catch (error) {
      console.error("Error generating summary:", error)
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  if (isLoading || isLoadingNote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BackButton href="/dashboard/admin/call-logs" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !callNote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BackButton href="/dashboard/admin/call-logs" />
          <h1 className="text-2xl font-bold tracking-tight">Call Log Details</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Call log not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton href="/dashboard/admin/call-logs" />
          <h1 className="text-2xl font-bold tracking-tight">Call Log Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
            className="print:hidden"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGeneratingSummary ? "Generating..." : "Generate Summary"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="print:hidden"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Information</CardTitle>
          <CardDescription>View call details and print report</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminCallReportView
            date={new Date(callNote.call_date)}
            calls={[{
              id: callNote.id,
              customer_name: callNote.customer_name,
              contact_name: callNote.contact_name,
              location_type: callNote.location_type,
              notes: callNote.notes,
              attachments: callNote.attachments,
              summary: callNote.summary
            }]}
            expenses={expenses.map(expense => ({
              id: expense.id,
              expense_type: expense.expense_type,
              amount: expense.amount,
              description: expense.description,
              receipt_url: expense.receipt_url
            }))}
            submitterName={callNote.users?.full_name || "Unknown"}
            mileage={callNote.mileage}
            comments={callNote.comments}
          />
        </CardContent>
      </Card>
    </div>
  )
}

