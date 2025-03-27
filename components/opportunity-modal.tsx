"use client"
import { useEffect } from "react"
import { CustomModal } from "@/components/custom-modal"
import { OpportunityForm } from "@/components/opportunity-form"

interface OpportunityModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  opportunity?: any
  initialStatus?: string
}

export function OpportunityModal({ isOpen, onClose, onSuccess, opportunity, initialStatus }: OpportunityModalProps) {
  const isEditing = !!opportunity

  // Handle successful submission
  const handleSuccess = () => {
    // First call onSuccess to refresh data
    onSuccess()

    // Then close the modal
    onClose()
  }

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Ensure body styles are reset when component unmounts
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = ""
        document.body.style.overflow = ""
      }
    }
  }, [])

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Opportunity" : "Create New Opportunity"}
      description={
        isEditing ? "Update the details of this sales opportunity." : "Enter the details for a new sales opportunity."
      }
      className="sm:max-w-[600px]"
    >
      <OpportunityForm
        onSubmitSuccess={handleSuccess}
        onCancel={onClose}
        opportunity={opportunity}
        initialStatus={initialStatus}
      />
    </CustomModal>
  )
}

