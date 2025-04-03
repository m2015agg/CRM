"use customer"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { opportunityService } from "@/lib/services"
import { useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

/**
 * Form validation schema using Zod
 * Defines the structure and validation rules for the opportunity form
 */
const formSchema = z.object({
  // Core opportunity info
  title: z.string().min(1, "Title is required"),
  company_name: z.string().min(1, "Company name is required"),
  contact_name: z.string().optional(),
  client_name: z.string().optional(),
  
  // Sales data
  value: z.coerce.number().min(0, "Value must be a positive number"),
  status: z.string().min(1, "Status is required"),
  expected_close_date: z.date().nullable(),
  lead_source: z.string().optional(),
  priority_level: z.enum(["low", "medium", "high"]).optional(),
  
  // Machine-related requests
  requested_machine: z.string().optional(),
  requested_attachments: z.string().optional(),
  
  // Trade-in info
  trade_in_description: z.string().optional(),
  
  // Notes / stages
  description: z.string().optional(),
  stage_notes: z.string().optional(),
  
  // Logistics
  requested_delivery_date: z.date().nullable(),
  has_been_delivered: z.boolean().default(false),
  
  // Invoicing
  invoiced_at: z.date().nullable(),
  invoice_amount: z.coerce.number().min(0, "Invoice amount must be positive").nullable(),
  
  // Attachments
  attachments: z.array(z.string()).default([]),
})

// Type inference for form values based on the schema
type FormValues = {
  title: string
  company_name: string
  contact_name?: string
  client_name?: string
  value: number
  status: string
  expected_close_date: Date | null
  lead_source?: string
  priority_level?: "low" | "medium" | "high"
  requested_machine?: string
  requested_attachments?: string
  trade_in_description?: string
  description?: string
  stage_notes?: string
  requested_delivery_date: Date | null
  has_been_delivered: boolean
  invoiced_at: Date | null
  invoice_amount: number | null
  attachments: string[]
}

/**
 * Props interface for the OpportunityForm component
 * @property onSubmitSuccess - Callback function called after successful form submission
 * @property onCancel - Callback function called when form is cancelled
 * @property opportunity - Optional existing opportunity data for editing
 * @property initialStatus - Optional initial status for new opportunities
 */
interface OpportunityFormProps {
  onSubmitSuccess: () => void
  onCancel: () => void
  opportunity?: any // For editing existing opportunities
  initialStatus?: string // For setting initial status when adding from a specific column
}

/**
 * OpportunityForm Component
 * A form component for creating and editing sales opportunities
 * @param onSubmitSuccess - Callback for successful form submission
 * @param onCancel - Callback for form cancellation
 * @param opportunity - Optional existing opportunity data
 * @param initialStatus - Optional initial status for new opportunities
 */
export function OpportunityForm({ onSubmitSuccess, onCancel, opportunity, initialStatus }: OpportunityFormProps) {
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!opportunity
  const { user } = useAuth()

  /**
   * Initialize form with react-hook-form
   * Sets up form validation and default values based on whether we're editing or creating
   */
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing
      ? {
          title: opportunity.title,
          company_name: opportunity.company_name,
          contact_name: opportunity.contact_name || "",
          client_name: opportunity.client_name || "",
          value: opportunity.value,
          status: opportunity.status,
          expected_close_date: opportunity.expected_close_date ? parseISO(opportunity.expected_close_date) : null,
          lead_source: opportunity.lead_source || "",
          priority_level: opportunity.priority_level as "low" | "medium" | "high" || undefined,
          requested_machine: opportunity.requested_machine || "",
          requested_attachments: opportunity.requested_attachments || "",
          trade_in_description: opportunity.trade_in_description || "",
          description: opportunity.description || "",
          stage_notes: opportunity.stage_notes || "",
          requested_delivery_date: opportunity.requested_delivery_date ? parseISO(opportunity.requested_delivery_date) : null,
          has_been_delivered: opportunity.has_been_delivered || false,
          invoiced_at: opportunity.invoiced_at ? parseISO(opportunity.invoiced_at) : null,
          invoice_amount: opportunity.invoice_amount || null,
          attachments: opportunity.attachments || [],
        }
      : {
          title: "",
          company_name: "",
          contact_name: "",
          client_name: "",
          value: 0,
          status: initialStatus || "new",
          expected_close_date: null,
          lead_source: "",
          priority_level: undefined,
          requested_machine: "",
          requested_attachments: "",
          trade_in_description: "",
          description: "",
          stage_notes: "",
          requested_delivery_date: null,
          has_been_delivered: false,
          invoiced_at: null,
          invoice_amount: null,
          attachments: [],
        },
  })

  /**
   * Effect to reset form when opportunity or editing state changes
   * Ensures form data is synchronized with the current opportunity
   */
  useEffect(() => {
    if (isEditing) {
      form.reset({
        title: opportunity.title,
        company_name: opportunity.company_name,
        contact_name: opportunity.contact_name || "",
        client_name: opportunity.client_name || "",
        value: opportunity.value,
        status: opportunity.status,
        expected_close_date: opportunity.expected_close_date ? parseISO(opportunity.expected_close_date) : null,
        lead_source: opportunity.lead_source || "",
        priority_level: opportunity.priority_level as "low" | "medium" | "high" || undefined,
        requested_machine: opportunity.requested_machine || "",
        requested_attachments: opportunity.requested_attachments || "",
        trade_in_description: opportunity.trade_in_description || "",
        description: opportunity.description || "",
        stage_notes: opportunity.stage_notes || "",
        requested_delivery_date: opportunity.requested_delivery_date ? parseISO(opportunity.requested_delivery_date) : null,
        has_been_delivered: opportunity.has_been_delivered || false,
        invoiced_at: opportunity.invoiced_at ? parseISO(opportunity.invoiced_at) : null,
        invoice_amount: opportunity.invoice_amount || null,
        attachments: opportunity.attachments || [],
      })
    } else {
      form.reset({
        title: "",
        company_name: "",
        contact_name: "",
        client_name: "",
        value: 0,
        status: initialStatus || "new",
        expected_close_date: null,
        lead_source: "",
        priority_level: undefined,
        requested_machine: "",
        requested_attachments: "",
        trade_in_description: "",
        description: "",
        stage_notes: "",
        requested_delivery_date: null,
        has_been_delivered: false,
        invoiced_at: null,
        invoice_amount: null,
        attachments: [],
      })
    }
  }, [form, isEditing, opportunity, initialStatus])

  /**
   * Form submission handler
   * Processes form data and calls the appropriate service method
   * @param data - Form values validated against the schema
   */
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      // Format data for API submission
      const formattedData = {
        title: data.title,
        company_name: data.company_name,
        contact_name: data.contact_name || null,
        client_name: data.client_name || null,
        value: data.value,
        status: data.status,
        expected_close_date: data.expected_close_date ? format(data.expected_close_date, "yyyy-MM-dd") : null,
        lead_source: data.lead_source || null,
        priority_level: data.priority_level || null,
        requested_machine: data.requested_machine || null,
        requested_attachments: data.requested_attachments || null,
        trade_in_description: data.trade_in_description || null,
        description: data.description || null,
        stage_notes: data.stage_notes || null,
        requested_delivery_date: data.requested_delivery_date ? format(data.requested_delivery_date, "yyyy-MM-dd") : null,
        has_been_delivered: data.has_been_delivered,
        invoiced_at: data.invoiced_at ? format(data.invoiced_at, "yyyy-MM-dd") : null,
        invoice_amount: data.invoice_amount,
        attachments: data.attachments,
      }

      // Call appropriate service method based on whether we're editing or creating
      if (opportunity) {
        await opportunityService.updateOpportunity(opportunity.id, formattedData)
      } else {
        await opportunityService.createOpportunity({
          ...formattedData,
          owner_id: user?.id || "",
        })
      }
      onSubmitSuccess()
    } catch (error) {
      console.error("Error submitting opportunity:", error)
      alert("Failed to submit opportunity. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render the form with all its fields
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Opportunity Info Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Core Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opportunity Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter opportunity title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Sales Data Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sales Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lead_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Source</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="trade_show">Trade Show</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_close_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Close Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Machine Requests Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Machine Requests</h3>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="requested_machine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Machine</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter details about the requested machine"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requested_attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Attachments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter details about requested attachments"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Trade-in Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Trade-in Information</h3>
          <FormField
            control={form.control}
            name="trade_in_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trade-in Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter details about trade-in machines"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notes</h3>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>General Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter general notes about the opportunity"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter internal sales stage updates"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Logistics Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Logistics</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="requested_delivery_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Requested Delivery Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="has_been_delivered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Has Been Delivered</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Invoicing Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Invoicing</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="invoiced_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Invoice Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoice_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter invoice amount" 
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form action buttons */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Opportunity" : "Create Opportunity"}
          </Button>
        </div>
      </form>
    </Form>
  )
}