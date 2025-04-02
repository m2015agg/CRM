"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash, Loader2, AlertCircle, X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useStorage } from "@/hooks/use-storage"
import { useAuth } from "@/contexts/auth-context"
import { SimplifiedFileUpload } from "@/components/simplified-file-upload"
import { FilePreview } from "@/components/file-preview"
import { supabase } from "@/lib/supabase"

// Custom date formatting function to replace date-fns
function formatDate(date: Date, formatStr: string): string {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()

  // Basic format for yyyy-MM-dd
  if (formatStr === "yyyy-MM-dd") {
    return `${year}-${month}-${day}`
  }

  // Format for display (e.g., "Monday, January 1, 2024")
  if (formatStr === "EEEE, MMMM d, yyyy") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    const dayName = days[date.getDay()]
    const monthName = months[date.getMonth()]

    return `${dayName}, ${monthName} ${date.getDate()}, ${year}`
  }

  // Default format
  return `${month}/${day}/${year}`
}

// Define the form schema for a single call
const callSchema = z.object({
  id: z.string().optional(), // Add ID field to track existing records
  clientName: z.string().min(1, "Client name is required"),
  contactName: z.string().optional(),
  locationType: z.string().optional(),
  notes: z.string().min(1, "Notes are required"),
})

// Define the form schema for expenses
const expenseSchema = z.object({
  id: z.string().optional(), // Add ID field to track existing records
  expenseType: z.string().min(1, "Expense type is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional().nullable(),
  associatedCall: z.string().optional().nullable(),
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
  date?: Date
  onSubmit?: () => void
  onCancel?: () => void
}

export function DailyCallReportForm({
  date = new Date(),
  onSubmit: onSubmitProp,
  onCancel,
}: DailyCallReportFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expenseReceipts, setExpenseReceipts] = useState<Record<number, string>>({})
  const [activeTab, setActiveTab] = useState("calls")
  const [existingReport, setExistingReport] = useState<any>(null)
  const [existingCalls, setExistingCalls] = useState<any[]>([])
  const [existingExpenses, setExistingExpenses] = useState<any[]>([])
  const [duplicateReports, setDuplicateReports] = useState<any[]>([])
  const [isLoadingReport, setIsLoadingReport] = useState(true)
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null)

  const {
    getDailyReportByDate,
    getAllCallNotes,
    getAllExpenses,
    createDailyReport,
    updateDailyReport,
    cleanupDuplicateDailyReports,
    createCallNote,
    updateCallNote,
    createExpense,
    updateExpense,
    error: storageError,
    isLoading: isStorageLoading,
  } = useStorage()

  // Initialize the form with proper default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportDate: date,
      mileage: 0,
      comments: "",
      calls: [{ clientName: "", contactName: "", locationType: "", notes: "" }],
      expenses: [],
    },
    mode: "onBlur", // Add this to reduce unnecessary re-renders
  })

  // Use the useFieldArray hook
  const {
    fields: callFields,
    append: appendCall,
    remove: removeCall,
    replace: replaceCalls,
  } = useFieldArray({
    control: form.control,
    name: "calls",
  })

  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
    replace: replaceExpenses,
  } = useFieldArray({
    control: form.control,
    name: "expenses",
  })

  // Check for existing report and duplicates
  useEffect(() => {
    let isMounted = true;

    const fetchExistingData = async () => {
      if (!user) return

      setIsLoadingReport(true)
      try {
        const formattedDate = formatDate(date, "yyyy-MM-dd")
        console.log("Fetching data for date:", formattedDate, "with user:", user.id)

        // First, fetch the daily report to get its ID
        const report = await getDailyReportByDate(formattedDate, user.id)
        console.log("Report response:", report)
        if (isMounted && report) {
          console.log("Found existing report:", report)
          setExistingReport(report)

          // Update form values with existing report data
          form.setValue("mileage", report.mileage || 0)
          form.setValue("comments", report.comments || "")

          // Now fetch call notes using the daily report ID as foreign key
          // Similar to SQL: SELECT * FROM call_notes WHERE daily_reports_uuid = report.id
          console.log("Fetching call notes for report ID:", report.id)
          const calls = await getAllCallNotes({
            daily_reports_uuid: report.id,  // Use the daily report UUID as foreign key
            userId: user.id
          })
          console.log("Call notes response:", calls)

          if (isMounted && calls && calls.length > 0) {
            console.log("Found existing calls:", calls)
            setExistingCalls(calls)

            // Transform the database response into the form's expected format
            const formattedCalls = calls.map((call: { 
              id: string;
              client_name: string;      // Database column name
              contact_name: string | null;
              location_type: string | null;
              notes: string;
            }) => ({
              id: call.id,
              clientName: call.client_name || "",      // Form field name (camelCase)
              contactName: call.contact_name || "",
              locationType: call.location_type || "",
              notes: call.notes || "",
            }))

            console.log("Formatted calls:", formattedCalls)
            replaceCalls(formattedCalls)
          } else {
            console.log("No existing calls found or calls array is empty")
            replaceCalls([{
              clientName: "",
              contactName: "",
              locationType: "",
              notes: ""
            }])
          }

          // Fetch expenses using the daily report ID as foreign key
          // Similar to SQL: SELECT * FROM expenses WHERE daily_reports_uuid = report.id
          const expenses = await getAllExpenses({
            daily_reports_uuid: report.id,  // Use the daily report UUID as foreign key
            userId: user.id
          })

          if (isMounted && expenses && expenses.length > 0) {
            console.log("Found existing expenses:", expenses)
            setExistingExpenses(expenses)

            // Set the expenseReceipts state with existing receipt URLs
            const receiptUrls: Record<number, string> = {}
            expenses.forEach((expense: any, index: number) => {
              if (expense.receipt_url) {
                receiptUrls[index] = expense.receipt_url
              }
            })
            setExpenseReceipts(receiptUrls)

            const formattedExpenses = expenses.map((expense: {
              id: string;
              expense_type: string;
              amount: number;
              description: string | null;
              associated_call: string | null;
              receipt_url: string | null;
            }) => ({
              id: expense.id,
              expenseType: expense.expense_type,
              amount: expense.amount,
              description: expense.description || '',
              associatedCall: expense.associated_call || '',
              receiptUrl: expense.receipt_url || '',
            }))

            replaceExpenses(formattedExpenses)
          }
        } else {
          // If no report exists, initialize with empty form
          console.log("No existing report found for date:", formattedDate)
          replaceCalls([{
            clientName: "",
            contactName: "",
            locationType: "",
            notes: ""
          }])
        }
      } catch (error) {
        console.error("Error in fetchExistingData:", error) // Improve error logging
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load existing report data",
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted) {
          setIsLoadingReport(false)
        }
      }
    }

    fetchExistingData()

    return () => {
      isMounted = false
    }
  }, [date, user?.id, getDailyReportByDate, getAllCallNotes, getAllExpenses, replaceCalls, replaceExpenses, form, toast])

  const cleanupDuplicates = async () => {
    if (duplicateReports.length === 0) return

    setIsCleaningDuplicates(true)
    try {
      if (!user) {
        throw new Error("User must be logged in to clean up duplicates")
      }
      const formattedDate = formatDate(form.getValues("reportDate"), "yyyy-MM-dd")
      const result = await cleanupDuplicateDailyReports(formattedDate, user.id)

      if (result) {
        toast({
          title: "Duplicates removed",
          description: `Successfully removed ${result} duplicate reports.`,
        })

        setDuplicateReports([])
      }
    } catch (error) {
      console.error("Error cleaning up duplicates:", error)
      toast({
        title: "Error",
        description: "Failed to remove duplicate reports. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCleaningDuplicates(false)
    }
  }

  const handleSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a report",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.log("Form data being submitted:", data)
    console.log("Expense receipts state:", expenseReceipts)

    try {
      // Format the date for the database
      const formattedDate = formatDate(data.reportDate, "yyyy-MM-dd")

      // If we have duplicates, clean them up first
      if (duplicateReports.length > 0) {
        await cleanupDuplicates()
      }

      // Create or update the daily report using our service
      let reportResult
      if (existingReport) {
        reportResult = await updateDailyReport(existingReport.id, {
          mileage: data.mileage || null,
          comments: data.comments || null,
        })
      } else {
        reportResult = await createDailyReport({
          report_date: formattedDate,
          mileage: data.mileage || null,
          comments: data.comments || null,
          submitter_id: user.id
        })
      }

      if (!reportResult) {
        throw new Error("Failed to save daily report")
      }

      // Process each call note - update existing or create new
      const callPromises = data.calls.map(async (call, index) => {
        try {
          // If the call has an ID, update it; otherwise create a new one
          if (call.id) {
            return await updateCallNote(call.id, {
              client_name: call.clientName,
              contact_name: call.contactName || null,
              location_type: call.locationType || null,
              notes: call.notes,
              attachments: [], // Empty array for attachments since we're removing this feature
            })
          } else {
            return await createCallNote({
              client_name: call.clientName,
              contact_name: call.contactName || null,
              location_type: call.locationType || null,
              call_date: formattedDate,
              notes: call.notes,
              attachments: [], // Empty array for attachments since we're removing this feature
            })
          }
        } catch (err) {
          console.error(`Error processing call ${index}:`, err)
          throw err
        }
      })

      // Process each expense - update existing or create new
      const expensePromises = data.expenses.map(async (expense, index) => {
        // Get receipt URL from state - add a safe check
        const receiptUrl = expenseReceipts && index in expenseReceipts ? expenseReceipts[index] : null

        console.log(`Processing expense ${index}:`, {
          ...expense,
          receipt_url: receiptUrl,
        })

        try {
          // If the expense has an ID, update it; otherwise create a new one
          if (expense.id) {
            console.log(`Updating existing expense ${expense.id} with receipt URL:`, receiptUrl)
            return await updateExpense(expense.id, {
              expense_type: expense.expenseType,
              amount: expense.amount,
              description: expense.description || null,
              associated_call: expense.associatedCall || null,
              receipt_url: receiptUrl,
            })
          } else {
            console.log(`Creating new expense with receipt URL:`, receiptUrl)
            return await createExpense({
              expense_date: formattedDate,
              expense_type: expense.expenseType,
              amount: expense.amount,
              description: expense.description || null,
              associated_call: expense.associatedCall || null,
              receipt_url: receiptUrl,
              daily_reports_uuid: reportResult.id,  // Add the daily report UUID
              submitter_id: user.id
            })
          }
        } catch (err) {
          console.error(`Error processing expense ${index}:`, err)
          throw err
        }
      })

      // Wait for all operations to complete
      await Promise.all([...callPromises, ...expensePromises])

      toast({
        title: existingReport ? "Daily report updated" : "Daily report submitted",
        description: "Your daily report has been saved successfully.",
      })

      // Call the onSubmit prop if provided
      if (onSubmitProp) {
        // Add a small delay to ensure database updates are complete
        setTimeout(() => {
          onSubmitProp()
        }, 500)
      } else {
        // Redirect back to the dashboard with a small delay
        setTimeout(() => {
          router.push("/dashboard/submitter")
          router.refresh()
        }, 500)
      }
    } catch (error) {
      console.error("Error saving daily report:", error)
      // Show more detailed error information
      let errorMessage = "Failed to save daily report"
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`
        console.log("Error details:", error)
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExpenseReceiptUpload = useCallback((index: number, url: string) => {
    if (!url) return

    console.log(`Expense receipt uploaded for index ${index}:`, url)

    // Update the expenseReceipts state
    setExpenseReceipts((prev) => {
      const updated = {
        ...prev,
        [index]: url,
      }
      console.log("Updated expenseReceipts state:", updated)
      return updated
    })
  }, [])

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push("/dashboard/submitter")
    }
  }

  // Check if any expenses are missing receipts
  const expensesWithoutReceipts = form.watch("expenses").filter((_, index) => !expenseReceipts[index])
  const hasMissingReceipts = expensesWithoutReceipts.length > 0

  // Render loading state
  if (isLoadingReport) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Check if there are any receipts to display
  const hasReceipts = Object.keys(expenseReceipts).length > 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{existingReport ? "Edit Daily Call Report" : "New Daily Call Report"}</CardTitle>
            <div className="text-sm text-muted-foreground">
              {formatDate(form.getValues("reportDate"), "EEEE, MMMM d, yyyy")}
            </div>
          </CardHeader>
          <CardContent>
            {duplicateReports.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Duplicate Reports Detected</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">
                    We found {duplicateReports.length} duplicate report(s) for this date. This can cause issues with
                    your dashboard.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cleanupDuplicates}
                    disabled={isCleaningDuplicates}
                    className="bg-white text-red-600 hover:bg-red-50 border-red-200"
                  >
                    {isCleaningDuplicates ? "Cleaning..." : "Remove Duplicates"}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {storageError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{storageError}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="calls" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calls">Customer Calls</TabsTrigger>
                <TabsTrigger value="expenses">Daily Expenses</TabsTrigger>
              </TabsList>

              <TabsContent value="calls" className="space-y-4 mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-1 font-medium text-sm">Customer Name</th>
                        <th className="text-left py-2 px-1 font-medium text-sm">Contact</th>
                        <th className="text-left py-2 px-1 font-medium text-sm">Loc. Type</th>
                        <th className="text-left py-2 px-1 font-medium text-sm">Comments</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {callFields.map((field, index) => (
                        <tr key={field.id} className="border-b">
                          <td className="py-2 px-1">
                            {/* Hidden field for ID */}
                            <input type="hidden" {...form.register(`calls.${index}.id`)} />
                            <FormField
                              control={form.control}
                              name={`calls.${index}.clientName`}
                              render={({ field }) => (
                                <FormItem className="m-0 space-y-0">
                                  <FormControl>
                                    <Input placeholder="Client name" {...field} className="h-9" />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-2 px-1">
                            <FormField
                              control={form.control}
                              name={`calls.${index}.contactName`}
                              render={({ field }) => (
                                <FormItem className="m-0 space-y-0">
                                  <FormControl>
                                    <Input placeholder="Contact" {...field} className="h-9" />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-2 px-1">
                            <FormField
                              control={form.control}
                              name={`calls.${index}.locationType`}
                              render={({ field }) => (
                                <FormItem className="m-0 space-y-0">
                                  <FormControl>
                                    <Input placeholder="Loc. Type" {...field} className="h-9" />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-2 px-1">
                            <FormField
                              control={form.control}
                              name={`calls.${index}.notes`}
                              render={({ field }) => (
                                <FormItem className="m-0 space-y-0">
                                  <FormControl>
                                    <Input placeholder="Comments" {...field} className="h-9" />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-2 px-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault()
                                removeCall(index)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="expenses" className="space-y-4 mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-1 font-medium text-sm">Expense Type</th>
                        <th className="text-left py-2 px-1 font-medium text-sm">Amount</th>
                        <th className="text-left py-2 px-1 font-medium text-sm">Description</th>
                        <th className="text-left py-2 px-1 font-medium text-sm">Associated Call</th>
                        <th className="text-left py-2 px-1 font-medium text-sm">Receipt</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseFields.map((field, index) => (
                        <tr key={field.id} className="border-b">
                          <td className="py-2 px-1">
                            {/* Hidden field for ID */}
                            <input type="hidden" {...form.register(`expenses.${index}.id`)} />
                            <FormField
                              control={form.control}
                              name={`expenses.${index}.expenseType`}
                              render={({ field }) => (
                                <FormItem className="m-0 space-y-0">
                                  <FormControl>
                                    <Input placeholder="Expense Type" {...field} className="h-9" />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-2 px-1">
                            <FormField
                              control={form.control}
                              name={`expenses.${index}.amount`}
                              render={({ field }) => (
                                <FormItem className="m-0 space-y-0">
                                  <FormControl>
                                    <Input placeholder="Amount" {...field} className="h-9" />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-2 px-1">
                            <FormField
                              control={form.control}
                              name={`expenses.${index}.description`}
                              render={({ field }) => (
                                <FormItem className="m-0 space-y-0">
                                  <FormControl>
                                    <Input 
                                      placeholder="Description" 
                                      {...field} 
                                      value={field.value || ''} 
                                      className="h-9" 
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-2 px-1">
                            <FormField
                              control={form.control}
                              name={`expenses.${index}.associatedCall`}
                              render={({ field }) => (
                                <FormItem className="m-0 space-y-0">
                                  <FormControl>
                                    <Input 
                                      placeholder="Associated Call" 
                                      {...field} 
                                      value={field.value || ''} 
                                      className="h-9" 
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-2 px-1">
                            <FormField
                              control={form.control}
                              name={`expenses.${index}.receiptUrl`}
                              render={({ field }) => (
                                <FormItem className="m-0 space-y-0">
                                  <FormControl>
                                    <SimplifiedFileUpload
                                      onFileUploaded={(url) => handleExpenseReceiptUpload(index, url)}
                                      initialUrl={expenseReceipts[index]}
                                      activeTab={activeTab}
                                      isReceipt={true}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-2 px-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault()
                                removeExpense(index)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit"}
          </Button>
          <Button type="reset" variant="outline" disabled={isSubmitting} onClick={handleCancel}>
            {isSubmitting ? "Cancelling..." : "Cancel"}
          </Button>
        </div>
      </form>
    </Form>
  )
}