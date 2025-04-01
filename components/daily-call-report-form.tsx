"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { EnhancedFileUpload } from "@/components/enhanced-file-upload"
import { ExpensesByCallReport } from "@/components/expenses-by-call-report"
import { getSupabaseClient } from "@/lib/supabase/client"

const formSchema = z.object({
  number_of_calls: z.coerce.number().min(0, "Must be 0 or greater"),
  number_of_contacts: z.coerce.number().min(0, "Must be 0 or greater"),
  number_of_appointments: z.coerce.number().min(0, "Must be 0 or greater"),
  notes: z.string().optional(),
})

interface DailyCallReportFormProps {
  date?: Date
}

export function DailyCallReportForm({ date = new Date() }: DailyCallReportFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileUrls, setFileUrls] = useState<string[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number_of_calls: 0,
      number_of_contacts: 0,
      number_of_appointments: 0,
      notes: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      const formattedDate = format(date, "yyyy-MM-dd")
      const supabase = getSupabaseClient()

      // Insert the daily report
      const { data: reportData, error: reportError } = await supabase
        .from("daily_reports")
        .insert({
          report_date: formattedDate,
          number_of_calls: values.number_of_calls,
          number_of_contacts: values.number_of_contacts,
          number_of_appointments: values.number_of_appointments,
          notes: values.notes,
          status: "submitted",
          file_urls: fileUrls,
        })
        .select()

      if (reportError) throw reportError

      const reportId = reportData[0].id

      // Insert expenses if any
      if (expenses.length > 0) {
        const expensesWithReportId = expenses.map((expense) => ({
          ...expense,
          daily_report_id: reportId,
        }))

        const { error: expensesError } = await supabase.from("daily_report_expenses").insert(expensesWithReportId)

        if (expensesError) throw expensesError
      }

      toast.success("Daily report submitted successfully!")
      router.push("/dashboard/submitter/reports")
    } catch (error: any) {
      console.error("Error submitting report:", error)
      toast.error(error.message || "Failed to submit report")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFilesUploaded = (urls: string[]) => {
    setFileUrls(urls)
  }

  const handleExpensesChange = (newExpenses: any[]) => {
    setExpenses(newExpenses)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Call Report</CardTitle>
            <CardDescription>Enter your call activity for {format(date, "MMMM d, yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="number_of_calls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Calls</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={0} />
                    </FormControl>
                    <FormDescription>Total calls made today</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number_of_contacts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Contacts</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={0} />
                    </FormControl>
                    <FormDescription>People you actually spoke with</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number_of_appointments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Appointments</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={0} />
                    </FormControl>
                    <FormDescription>Appointments scheduled</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes about today's calls"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Expenses</FormLabel>
              <ExpensesByCallReport onExpensesChange={handleExpensesChange} />
            </div>

            <div className="space-y-2">
              <FormLabel>Attach Files</FormLabel>
              <EnhancedFileUpload onFilesUploaded={handleFilesUploaded} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/submitter/reports")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}

