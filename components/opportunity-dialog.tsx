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

// Update the form schema to match our current database schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client_name: z.string().min(1, "Client name is required"),
  description: z.string().optional(),
  value: z.coerce.number().min(0, "Value must be a positive number"),
  status: z.string().min(1, "Status is required"),
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
          title: opportunity.title,
          client_name: opportunity.client_name,
          description: opportunity.description || "",
          value: opportunity.value || 0,
          status: opportunity.status,
        }
      : {
          title: "",
          client_name: "",
          description: "",
          value: 0,
          status: initialStatus || "new", // Default to "new" status
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
          title: opportunity.title,
          client_name: opportunity.client_name,
          description: opportunity.description || "",
          value: opportunity.value || 0,
          status: opportunity.status,
        })
      } else {
        // Reset to default values for new opportunity
        form.reset({
          title: "",
          client_name: "",
          description: "",
          value: 0,
          status: initialStatus || "new",
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
          onOpenChange(false)
        } else {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking on the calendar
          if (e.target instanceof HTMLElement && e.target.closest('.rdp')) {
            e.preventDefault()
          }
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
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter opportunity title" {...field} />
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter opportunity description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter opportunity value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  isEditing ? "Update Opportunity" : "Create Opportunity"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

