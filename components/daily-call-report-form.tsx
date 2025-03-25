"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Plus, Trash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MultiFileUpload } from "@/components/multi-file-upload"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

// Define the form schema for a single call
const callSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  contactName: z.string().optional(),
  locationType: z.string().optional(),
  notes: z.string().min(1, "Notes are required"),
  attachments: z.array(z.string()).default([]),
})

// Define the form schema for expenses
const expenseSchema = z.object({
  expenseType: z.string().min(1, "Expense type is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
  clientName: z.string().optional(),
  receiptUrl: z.string().optional().nullable(),
})

// Define the main form schema
const formSchema = z.object({
  reportDate: z.date({
    required_error: "Report date is required",
  }),
  mileage: z.coerce.number().min(0, "Mileage cannot be negative").optional(),
  comments: z.string().optional(),
  calls: z.array(callSchema).default([]),
  expenses: z.array(expenseSchema).default([]),
})

type FormValues = z.infer<typeof formSchema>

interface DailyCallReportFormProps {
  initialDate?: Date
  onSubmit?: () => void
  onCancel?: () => void
}

export function DailyCallReportForm({ initialDate, onSubmit: onSubmitProp, onCancel }: DailyCallReportFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [callAttachments, setCallAttachments] = useState<Record<number, string[]>>({})
  const [expenseReceipts, setExpenseReceipts] = useState<Record<number, string>>({})
  const [activeTab, setActiveTab] = useState("calls")

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportDate: initialDate || new Date(),
      mileage: 0,
      comments: "",
      calls: [{ clientName: "", contactName: "", locationType: "", notes: "", attachments: [] }],
      expenses: [],
    },
  })

  // Use the useFieldArray hook
  const {
    fields: callFields,
    append: appendCall,
    remove: removeCall,
  } = useFieldArray({
    control: form.control,
    name: "calls",
  })

  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
  } = useFieldArray({
    control: form.control,
    name: "expenses",
  })

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseClient()

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      // Format the date for the database
      const formattedDate = format(data.reportDate, "yyyy-MM-dd")

      // Create or update the daily report
      const { data: reportData, error: reportError } = await supabase
        .from("daily_reports")
        .upsert({
          submitter_id: user.id,
          report_date: formattedDate,
          mileage: data.mileage || null,
          comments: data.comments || null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (reportError) {
        throw reportError
      }

      // Process each call note
      const callPromises = data.calls.map(async (call, index) => {
        // Include attachments from state
        const attachments = callAttachments[index] || []

        return supabase.from("call_notes").insert({
          submitter_id: user.id,
          client_name: call.clientName,
          contact_name: call.contactName || null,
          location_type: call.locationType || null,
          call_date: formattedDate,
          notes: call.notes,
          attachments: attachments.length > 0 ? attachments : null,
        })
      })

      // Process each expense
      const expensePromises = data.expenses.map(async (expense, index) => {
        // Include receipt from state
        const receiptUrl = expenseReceipts[index] || null

        return supabase.from("expenses").insert({
          submitter_id: user.id,
          expense_date: formattedDate,
          expense_type: expense.expenseType,
          amount: expense.amount,
          description: expense.description || null,
          client_name: expense.clientName || null,
          receipt_url: receiptUrl,
        })
      })

      // Wait for all operations to complete
      await Promise.all([...callPromises, ...expensePromises])

      toast({
        title: "Daily report submitted",
        description: "Your daily report has been saved successfully.",
      })

      // Call the onSubmit prop if provided
      if (onSubmitProp) {
        onSubmitProp()
      } else {
        // Redirect back to the dashboard
        router.push("/dashboard/submitter")
        router.refresh()
      }
    } catch (error) {
      console.error("Error saving daily report:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save daily report",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCallAttachmentsChange = (index: number, urls: string[]) => {
    setCallAttachments((prev) => ({
      ...prev,
      [index]: urls,
    }))
  }

  const handleExpenseReceiptUpload = (index: number, url: string) => {
    setExpenseReceipts((prev) => ({
      ...prev,
      [index]: url,
    }))
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push("/dashboard/submitter")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Edit Daily Call Report</CardTitle>
            <div className="text-sm text-muted-foreground">
              {format(form.getValues("reportDate"), "EEEE, MMMM d, yyyy")}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="calls" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="calls">Customer Calls</TabsTrigger>
                <TabsTrigger value="expenses">Daily Expenses</TabsTrigger>
                <TabsTrigger value="entertainment">Entertainment</TabsTrigger>
              </TabsList>

              <TabsContent value="calls" className="space-y-4 mt-4">
                {callFields.map((field, index) => (
                  <div key={field.id} className="space-y-4 border rounded-md p-4 relative">
                    {callFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => removeCall(index)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remove call</span>
                      </Button>
                    )}

                    <div className="grid grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`calls.${index}.clientName`}
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Customer Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Client name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`calls.${index}.contactName`}
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Contact</FormLabel>
                            <FormControl>
                              <Input placeholder="Contact person" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`calls.${index}.locationType`}
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel>Loc. Type</FormLabel>
                            <FormControl>
                              <Input placeholder="Type" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`calls.${index}.notes`}
                        render={({ field }) => (
                          <FormItem className="col-span-4">
                            <FormLabel>Comments</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Notes about the call" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`calls.${index}.attachments`}
                        render={({ field }) => (
                          <FormItem className="col-span-4">
                            <FormControl>
                              <MultiFileUpload
                                value={callAttachments[index] || []}
                                onChange={(urls) => handleCallAttachmentsChange(index, urls)}
                                bucket="attachments"
                                folder={`call-notes`}
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                maxFiles={5}
                                label="Add Attachment"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendCall({ clientName: "", contactName: "", locationType: "", notes: "", attachments: [] })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Call
                </Button>
              </TabsContent>

              <TabsContent value="expenses" className="space-y-4 mt-4">
                {expenseFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No expenses added yet. Click "Add Expense" to add one.</p>
                  </div>
                ) : (
                  expenseFields.map((field, index) => (
                    <div key={field.id} className="border rounded-md p-4 relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => removeExpense(index)}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remove expense</span>
                      </Button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`expenses.${index}.expenseType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expense Type</FormLabel>
                              <FormControl>
                                <select
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                >
                                  <option value="">Select expense type</option>
                                  <option value="lodging">Lodging</option>
                                  <option value="breakfast">Breakfast</option>
                                  <option value="lunch">Lunch</option>
                                  <option value="dinner">Dinner</option>
                                  <option value="telephone">Telephone</option>
                                  <option value="tips">Tips</option>
                                  <option value="entertainment">Entertainment</option>
                                  <option value="other">Other</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`expenses.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    appendExpense({
                      expenseType: "",
                      amount: 0,
                      description: "",
                      clientName: "",
                      receiptUrl: null,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </Button>
              </TabsContent>

              <TabsContent value="entertainment" className="space-y-4 mt-4">
                <div className="text-center py-8 text-muted-foreground">
                  <p>Entertainment expenses will be available in a future update.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Report
          </Button>
        </div>
      </form>
    </Form>
  )
}

