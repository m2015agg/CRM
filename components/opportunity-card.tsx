"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { CalendarIcon, DollarSign, Building, User, Truck, Pencil } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { OpportunityModal } from "@/components/opportunity-modal"

// Update the OpportunityCardProps interface to include stageId
interface OpportunityCardProps {
  opportunity: any
  isActive: boolean
  onOpportunityUpdated: () => void
  stageId?: string
}

// Update the function signature to include stageId
export function OpportunityCard({ opportunity, isActive, onOpportunityUpdated, stageId }: OpportunityCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Format the expected close date
  const closeDate = opportunity.expected_close_date
    ? format(parseISO(opportunity.expected_close_date), "MMM d, yyyy")
    : "No date"

  const handleEditClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent drag events from interfering
    e.stopPropagation()
    e.preventDefault()
    setIsEditModalOpen(true)
  }

  // Get card border class based on stage ID
  const getCardBorderClass = (stageId: string) => {
    switch (stageId) {
      case "new":
        return "border-l-4 border-l-blue-400"
      case "quoted":
        return "border-l-4 border-l-purple-400"
      case "waiting_on_trade_eval":
        return "border-l-4 border-l-amber-400"
      case "accepted":
        return "border-l-4 border-l-teal-400"
      case "rpo":
        return "border-l-4 border-l-indigo-400"
      case "ready_to_bill":
        return "border-l-4 border-l-green-400"
      case "lost_deal":
        return "border-l-4 border-l-red-400"
      default:
        return ""
    }
  }

  return (
    <>
      {/* Update the Card component to include a left border color based on the stage */}
      <Card
        className={`${isActive ? "border-primary shadow-md" : "shadow-sm"} cursor-move relative ${
          stageId ? getCardBorderClass(stageId) : ""
        } hover:shadow bg-white`}
        data-id={opportunity.id}
        data-status={opportunity.status}
        draggable="true"
        onDragStart={(e) => {
          // Set data transfer
          e.dataTransfer.setData("text/plain", opportunity.id)
          e.dataTransfer.effectAllowed = "move"

          // Create a custom drag image
          const dragPreview = document.createElement("div")
          dragPreview.textContent = opportunity.name
          dragPreview.style.padding = "8px"
          dragPreview.style.background = "white"
          dragPreview.style.border = "1px solid #ccc"
          dragPreview.style.borderRadius = "4px"
          dragPreview.style.position = "absolute"
          dragPreview.style.top = "-1000px"
          document.body.appendChild(dragPreview)

          e.dataTransfer.setDragImage(dragPreview, 0, 0)

          // Remove the element after drag starts
          setTimeout(() => {
            document.body.removeChild(dragPreview)
          }, 0)
        }}
      >
        <CardContent className="p-3 space-y-2 pb-10">
          <div className="font-medium text-sm truncate">{opportunity.name}</div>

          <div className="flex items-center text-xs text-muted-foreground">
            <Building className="h-3 w-3 mr-1" />
            <span className="truncate">{opportunity.company_name}</span>
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            <span className="truncate">{opportunity.contact_name}</span>
          </div>

          {opportunity.request_machine && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Truck className="h-3 w-3 mr-1" />
              <span className="truncate">{opportunity.request_machine}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center text-xs">
              <CalendarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
              <span>{closeDate}</span>
            </div>

            <Badge className="text-xs" variant="outline">
              <DollarSign className="h-3 w-3 mr-1" />
              {formatCurrency(opportunity.value)}
            </Badge>
          </div>

          {/* Move the edit button position to the absolute bottom right with more padding */}
          <div className="absolute bottom-1 right-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleEditClick}>
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal for editing */}
      <OpportunityModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onOpportunityUpdated}
        opportunity={opportunity}
      />
    </>
  )
}

