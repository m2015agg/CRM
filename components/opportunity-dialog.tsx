"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { createOpportunity, updateOpportunity } from "@/lib/services/opportunity-service"

// Update the form schema to ensure all fields are properly validated
const formSchema = z.object({
  name: z.string().min(1, "Opportunity name is required"),
  company_name: z.string().min(1, "Company name is required"),
  contact_name: z.string().min(1, "Contact name is required"),
  request_machine: z.string().min(1, "Request machine is required"),
  requested_attachments: z.string().optional(),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  status: z.string().min(1, "Status is required"),
  expected_close_date: z.date().optional(),
  description: z.string().optional(),
  trade_in_description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface OpportunityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpportunityCreated: () => void
  opportunity?: any // For editing existing opportunities
  initialStatus?: string // For setting initial status when adding from a specific column
}

// Update the form component to display all fields properly
export function OpportunityDialog({
  open,
  onOpenChange,
  onOpportunityCreated,
  opportunity,
  initialStatus,
}: OpportunityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!opportunity

  // Initialize form with default values or existing opportunity data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing
      ? {
          name: opportunity.name,
          company_name: opportunity.company_name,
          contact_name: opportunity.contact_name,
          request_machine: opportunity.request_machine || "",
          requested_attachments: opportunity.requested_attachments || "",
          value: opportunity.value,
          status: opportunity.status,
          expected_close_date: opportunity.expected_close_date ? parseISO(opportunity.expected_close_date) : undefined,
          description: opportunity.description || "",
          trade_in_description: opportunity.trade_in_description || "",
        }
      : {
          name: "",
          company_name: "",
          contact_name: "",
          request_machine: "",
          requested_attachments: "",
          value: 0,
          status: initialStatus || "new", // Default to "new" status
          description: "",
          trade_in_description: "",
        },
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      console.log("Submitting form data:", data)

      // Always set value to 0 and status to "new" for new opportunities
      if (!isEditing) {
        data.value = 0
        data.status = "new"
      }

      if (isEditing) {
        console.log("Updating opportunity:", opportunity.id)
        await updateOpportunity(opportunity.id, data)
      } else {
        console.log("Creating new opportunity")
        await createOpportunity(data)
      }

      console.log("Operation successful")
      onOpportunityCreated()
      form.reset()
      onOpenChange(false) // Explicitly close the dialog after successful submission
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} opportunity:`, error)
      // Show error message to user
      alert(`Failed to ${isEditing ? "update" : "create"} opportunity. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add this useEffect to reset the form when the dialog opens/closes
  useEffect(() => {
    if (open) {
      // If editing, populate the form with opportunity data
      if (isEditing) {
        form.reset({
          name: opportunity.name,
          company_name: opportunity.company_name,
          contact_name: opportunity.contact_name,
          request_machine: opportunity.request_machine || "",
          requested_attachments: opportunity.requested_attachments || "",
          value: opportunity.value,
          status: opportunity.status,
          expected_close_date: opportunity.expected_close_date ? parseISO(opportunity.expected_close_date) : undefined,
          description: opportunity.description || "",
          trade_in_description: opportunity.trade_in_description || "",
        })
      } else {
        // Reset to default values for new opportunity
        form.reset({
          name: "",
          company_name: "",
          contact_name: "",
          request_machine: "",
          requested_attachments: "",
          value: 0,
          status: initialStatus || "new",
          description: "",
          trade_in_description: "",
        })
      }
    }
  }, [open, isEditing, opportunity, initialStatus, form])

  // Replace the entire Dialog component with this simplified version
  // that uses a different approach to handle closing

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // First reset the form
          form.reset()
          setIsSubmitting(false)

          // Force a complete DOM refresh before closing
          document.body.style.pointerEvents = "none"

          // Use multiple timeouts with increasing delays to ensure cleanup happens
          setTimeout(() => {
            // Re-enable pointer events
            document.body.style.pointerEvents = ""

            // Then close the dialog
            onOpenChange(false)

            // Force focus back to the document body
            document.body.focus()

            // Force a refresh of the parent component
            setTimeout(() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("resize"))
              }
            }, 50)
          }, 10)
        } else {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={() => {
          // Handle ESC key specifically
          form.reset()
          setTimeout(() => onOpenChange(false), 10)
        }}
        onPointerDownOutside={() => {
          // Handle clicking outside
          form.reset()
          setTimeout(() => onOpenChange(false), 10)
        }}
        onInteractOutside={(e) => {
          // Prevent any outside interactions from closing the dialog unexpectedly
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Opportunity" : "Create New Opportunity"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of this sales opportunity."
              : "Enter the details for a new sales opportunity."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opportunity Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter opportunity name" {...field} />
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
                name="expected_close_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expected Close Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            type="button"
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="request_machine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Machine</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter requested machine"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
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
                      placeholder="Enter requested attachments"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes/Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter opportunity details"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trade_in_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description of Trade-in Machines</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter details about trade-in machines"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  // Prevent event bubbling
                  e.preventDefault()
                  e.stopPropagation()

                  // Reset form state
                  form.reset()
                  setIsSubmitting(false)

                  // Disable pointer events temporarily
                  document.body.style.pointerEvents = "none"

                  // Close with delay
                  setTimeout(() => {
                    // Re-enable pointer events
                    document.body.style.pointerEvents = ""
                    onOpenChange(false)

                    // Force focus back to document
                    document.body.focus()

                    // Force a refresh
                    setTimeout(() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("resize"))
                      }
                    }, 50)
                  }, 10)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Opportunity" : "Create Opportunity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

