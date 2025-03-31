"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createOpportunity, updateOpportunity } from "@/app/admin/team-opportunities/actions"

const STATUS_OPTIONS = [
  { value: "New", label: "New" },
  { value: "Qualified", label: "Qualified" },
  { value: "Proposal", label: "Proposal" },
  { value: "Negotiation", label: "Negotiation" },
  { value: "Closed Won", label: "Closed Won" },
  { value: "Closed Lost", label: "Closed Lost" },
]

type Opportunity = {
  id: string
  title: string
  description?: string | null
  status: string
  value: number | null
  client_name: string | null
  expected_close_date: string | null
  owner_id?: string
  users?: {
    full_name: string | null
    email: string
  }
}

type TeamMember = {
  id: string
  full_name: string | null
  email: string
  role: string
}

interface OpportunityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunity?: Opportunity
  teamMembers: TeamMember[]
  isAdmin: boolean
}

export default function OpportunityDialog({
  open,
  onOpenChange,
  opportunity,
  teamMembers,
  isAdmin,
}: OpportunityDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!opportunity

  const [formState, setFormState] = useState({
    title: opportunity?.title || "",
    description: opportunity?.description || "",
    status: opportunity?.status || "New",
    value: opportunity?.value?.toString() || "",
    clientName: opportunity?.client_name || "",
    expectedCloseDate: opportunity?.expected_close_date?.split("T")[0] || "",
    ownerId: opportunity?.owner_id || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("title", formState.title)
      formData.append("description", formState.description)
      formData.append("status", formState.status)
      formData.append("value", formState.value)
      formData.append("clientName", formState.clientName)
      formData.append("expectedCloseDate", formState.expectedCloseDate)

      if (isAdmin && formState.ownerId) {
        formData.append("ownerId", formState.ownerId)
      }

      let result

      if (isEditing && opportunity) {
        result = await updateOpportunity(opportunity.id, formData)
      } else {
        result = await createOpportunity(formData)
      }

      if (result.success) {
        toast({
          title: isEditing ? "Opportunity updated" : "Opportunity created",
          description: isEditing
            ? "The opportunity has been successfully updated."
            : "The opportunity has been successfully created.",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save opportunity.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving opportunity:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Opportunity" : "Create New Opportunity"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" value={formState.title} onChange={handleChange} required />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" name="clientName" value={formState.clientName} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                name="value"
                type="number"
                min="0"
                step="0.01"
                value={formState.value}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formState.status} onValueChange={(value) => handleSelectChange("status", value)} required>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
              <Input
                id="expectedCloseDate"
                name="expectedCloseDate"
                type="date"
                value={formState.expectedCloseDate}
                onChange={handleChange}
              />
            </div>

            {isAdmin && teamMembers.length > 0 && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="ownerId">Assign To</Label>
                <Select value={formState.ownerId} onValueChange={(value) => handleSelectChange("ownerId", value)}>
                  <SelectTrigger id="ownerId">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

