"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CalendarIcon, DollarSign, Building, User, MoreHorizontal, Plus, ChevronDown } from "lucide-react"
import { format, parseISO } from "date-fns"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { updateOpportunityStatus, deleteOpportunity } from "@/lib/services/opportunity-service"
import { OpportunityDialog } from "@/components/opportunity-dialog"

// Define opportunity stages with colors
export const OPPORTUNITY_STAGES = [
  { id: "new", name: "New", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "quoted", name: "Quoted", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "waiting_on_trade_eval", name: "Waiting on Trade Eval", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "accepted", name: "Accepted", color: "bg-teal-100 text-teal-800 border-teal-300" },
  { id: "rpo", name: "RPO", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "ready_to_bill", name: "Ready to Bill", color: "bg-green-100 text-green-800 border-green-300" },
  { id: "lost_deal", name: "Lost Deal", color: "bg-red-100 text-red-800 border-red-300" },
]

interface AirtableKanbanBoardProps {
  opportunities: any[]
  onOpportunityUpdated: () => void
}

export function AirtableKanbanBoard({ opportunities, onOpportunityUpdated }: AirtableKanbanBoardProps) {
  const [draggedItem, setDraggedItem] = useState<any | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<any | null>(null)
  const [activeStage, setActiveStage] = useState<string | null>(null)
  const dragCounter = useRef<Record<string, number>>({})

  // Group opportunities by stage
  const opportunitiesByStage = OPPORTUNITY_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = opportunities.filter((opp) => opp.status === stage.id)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Get stage color
  const getStageColor = (stageId: string) => {
    return OPPORTUNITY_STAGES.find((stage) => stage.id === stageId)?.color || ""
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, opportunity: any) => {
    setDraggedItem(opportunity)
    e.dataTransfer.setData("text/plain", opportunity.id)
    e.dataTransfer.effectAllowed = "move"

    // Create a custom drag image
    const dragPreview = document.createElement("div")
    dragPreview.className = "bg-white p-2 rounded shadow-lg border border-primary opacity-90"
    dragPreview.textContent = opportunity.name
    document.body.appendChild(dragPreview)
    e.dataTransfer.setDragImage(dragPreview, 20, 20)

    // Remove the element after drag starts
    setTimeout(() => {
      document.body.removeChild(dragPreview)
    }, 0)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    // Set active stage for visual feedback
    setActiveStage(stageId)
  }

  // Handle drag enter
  const handleDragEnter = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()

    // Increment counter for this stage
    dragCounter.current[stageId] = (dragCounter.current[stageId] || 0) + 1
    setActiveStage(stageId)
  }

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()

    // Decrement counter for this stage
    dragCounter.current[stageId] = (dragCounter.current[stageId] || 0) - 1

    // Only remove active state if counter is 0
    if (dragCounter.current[stageId] === 0) {
      if (activeStage === stageId) {
        setActiveStage(null)
      }
    }
  }

  // Handle drop
  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault()

    // Reset active stage
    setActiveStage(null)
    dragCounter.current = {}

    if (!draggedItem) return

    // If dropped in a different stage
    if (draggedItem.status !== stageId) {
      try {
        // Update the opportunity status in the database
        await updateOpportunityStatus(draggedItem.id, stageId)

        // Refresh opportunities
        onOpportunityUpdated()
      } catch (error) {
        console.error("Error updating opportunity status:", error)
      }
    }

    setDraggedItem(null)
  }

  // Handle edit
  const handleEdit = (opportunity: any) => {
    setEditingOpportunity(opportunity)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this opportunity?")) {
      try {
        await deleteOpportunity(id)
        onOpportunityUpdated()
      } catch (error) {
        console.error("Error deleting opportunity:", error)
      }
    }
  }

  // Handle dialog close
  const handleDialogClose = () => {
    // First disable pointer events to prevent any interactions during cleanup
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = "none"
    }

    // Use a sequence of timeouts to ensure proper cleanup
    setTimeout(() => {
      // Re-enable pointer events
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = ""
      }

      // Close dialogs
      setIsAddDialogOpen(false)
      setEditingOpportunity(null)

      // Force focus back to document body
      if (typeof document !== "undefined") {
        document.body.focus()
      }

      // Refresh data after dialog is fully closed
      setTimeout(() => {
        onOpportunityUpdated()

        // Force a UI refresh
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("resize"))
        }
      }, 100)
    }, 10)
  }

  // Handle opportunity created/updated
  const handleOpportunityChange = () => {
    onOpportunityUpdated()
    handleDialogClose()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">Opportunities</h2>
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">{opportunities.length}</Badge>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Opportunity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {OPPORTUNITY_STAGES.map((stage) => (
          <div
            key={stage.id}
            className={`flex flex-col rounded-lg border ${activeStage === stage.id ? "border-primary border-2" : "border-gray-200"}`}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDrop={(e) => handleDrop(e, stage.id)}
            onDragEnter={(e) => handleDragEnter(e, stage.id)}
            onDragLeave={(e) => handleDragLeave(e, stage.id)}
          >
            <div className={`p-3 rounded-t-lg ${stage.color.split(" ")[0]} border-b ${stage.color.split(" ")[2]}`}>
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">{stage.name}</h3>
                <Badge variant="outline" className="bg-white">
                  {opportunitiesByStage[stage.id]?.length || 0}
                </Badge>
              </div>
            </div>

            <div className="flex-1 p-2 space-y-2 min-h-[300px] bg-gray-50">
              {opportunitiesByStage[stage.id]?.map((opportunity) => (
                <Card
                  key={opportunity.id}
                  className={`border hover:shadow-md cursor-grab ${draggedItem?.id === opportunity.id ? "opacity-50" : ""}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, opportunity)}
                >
                  <CardContent className="p-3 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm">{opportunity.name}</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(opportunity)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(opportunity.id)} className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center text-gray-600">
                        <Building className="h-3 w-3 mr-1" />
                        <span className="truncate">{opportunity.company_name}</span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <User className="h-3 w-3 mr-1" />
                        <span className="truncate">{opportunity.contact_name}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                      <div className="flex items-center text-xs text-gray-600">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>
                          {opportunity.expected_close_date
                            ? format(parseISO(opportunity.expected_close_date), "MMM d")
                            : "No date"}
                        </span>
                      </div>

                      <Badge className="text-xs bg-gray-100 text-gray-800 hover:bg-gray-200">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(opportunity.value)}
                      </Badge>
                    </div>

                    <div className="flex items-center">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {opportunity.contact_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {opportunity.description && (
                        <Button variant="ghost" size="sm" className="h-6 ml-auto p-0">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {opportunitiesByStage[stage.id]?.length === 0 && (
                <div className="flex items-center justify-center h-20 text-sm text-gray-500">No opportunities</div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setIsAddDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add opportunity
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog for adding/editing opportunities */}
      <OpportunityDialog
        open={isAddDialogOpen || !!editingOpportunity}
        onOpenChange={(open) => {
          if (!open) {
            // Use requestAnimationFrame to ensure DOM updates before state changes
            requestAnimationFrame(() => {
              handleDialogClose()
            })
          }
        }}
        onOpportunityCreated={handleOpportunityChange}
        opportunity={editingOpportunity}
        initialStatus={activeStage || undefined}
      />
    </div>
  )
}

