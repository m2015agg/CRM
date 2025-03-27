"use client"

import { useState } from "react"
import { SortableItem } from "@/components/sortable-item"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { CalendarIcon, DollarSign, Building, User, MoreHorizontal, Truck } from "lucide-react"
import { format, parseISO } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { deleteOpportunity } from "@/lib/services/opportunity-service"
import { OpportunityModal } from "@/components/opportunity-modal"

interface OpportunityCardProps {
  opportunity: any
  isActive: boolean
  onOpportunityUpdated: () => void
}

export function OpportunityCard({ opportunity, isActive, onOpportunityUpdated }: OpportunityCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Format the expected close date
  const closeDate = opportunity.expected_close_date
    ? format(parseISO(opportunity.expected_close_date), "MMM d, yyyy")
    : "No date"

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this opportunity?")) {
      setIsDeleting(true)
      try {
        await deleteOpportunity(opportunity.id)
        onOpportunityUpdated()
      } catch (error) {
        console.error("Error deleting opportunity:", error)
        alert("Failed to delete opportunity")
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <>
      <SortableItem id={opportunity.id} data={{ status: opportunity.status }}>
        <Card className={`cursor-grab ${isActive ? "border-primary" : ""}`}>
          <CardContent className="p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div className="font-medium text-sm truncate">{opportunity.name}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

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
          </CardContent>
        </Card>
      </SortableItem>

      {/* Use our custom modal instead of the Dialog component */}
      <OpportunityModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={onOpportunityUpdated}
        opportunity={opportunity}
      />
    </>
  )
}

