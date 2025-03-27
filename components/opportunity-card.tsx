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

interface OpportunityCardProps {
  opportunity: any
  isActive: boolean
  onOpportunityUpdated: () => void
  stageId?: string
}

export function OpportunityCard({ opportunity, isActive, onOpportunityUpdated, stageId }: OpportunityCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Format the expected close date
  const closeDate = opportunity.expected_close_date
    ? format(parseISO(opportunity.expected_close_date), "MMM d, yyyy")
    : "No date"

  const handleEditClick = (e: React.MouseEvent) => {
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
      <Card
        className={`${isActive ? "border-primary shadow-md" : "shadow-sm"} cursor-move relative ${
          stageId ? getCardBorderClass(stageId) : ""
        } hover:shadow bg-white w-full`}
      >
        <CardContent className="p-4 space-y-3 pb-12">
          <div className="font-medium text-sm">{opportunity.name}</div>

          <div className="flex items-center text-xs text-muted-foreground">
            <Building className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span className="line-clamp-1">{opportunity.company_name}</span>
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span className="line-clamp-1">{opportunity.contact_name}</span>
          </div>

          {opportunity.request_machine && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Truck className="h-3 w-3 mr-1.5 flex-shrink-0" />
              <span className="line-clamp-1">{opportunity.request_machine}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center text-xs">
              <CalendarIcon className="h-3 w-3 mr-1.5 flex-shrink-0 text-muted-foreground" />
              <span>{closeDate}</span>
            </div>

            <Badge className="text-xs" variant="outline">
              <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
              {formatCurrency(opportunity.value)}
            </Badge>
          </div>

          <div className="absolute bottom-2 right-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleEditClick}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <OpportunityModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onOpportunityUpdated}
        opportunity={opportunity}
      />
    </>
  )
}

