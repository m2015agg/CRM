"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { OpportunityForm } from "@/components/opportunity-form"

interface OpportunityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpportunityCreated: () => void
  opportunity?: any // For editing existing opportunities
  initialStatus?: string // For setting initial status when adding from a specific column
}

export function OpportunityDialog({
  open,
  onOpenChange,
  onOpportunityCreated,
  opportunity,
  initialStatus,
}: OpportunityDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          onOpenChange(false)
        } else {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{opportunity ? "Edit Opportunity" : "Create New Opportunity"}</DialogTitle>
          <DialogDescription>
            {opportunity
              ? "Update the details of this sales opportunity."
              : "Enter the details for a new sales opportunity."}
          </DialogDescription>
        </DialogHeader>

        <OpportunityForm
          onSubmitSuccess={() => {
            onOpportunityCreated()
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
          opportunity={opportunity}
          initialStatus={initialStatus}
        />
      </DialogContent>
    </Dialog>
  )
}

