"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OpportunityCard } from "@/components/opportunity-card"
import { updateOpportunityStatus } from "@/lib/services/opportunity-service"
import { OPPORTUNITY_STAGES } from "@/components/airtable-kanban-board"
import { OpportunityModal } from "@/components/opportunity-modal"

interface KanbanBoardProps {
  opportunities: any[]
  onOpportunityUpdated: () => void
}

export function KanbanBoard({ opportunities, onOpportunityUpdated }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [draggedOpportunity, setDraggedOpportunity] = useState<any | null>(null)

  // Group opportunities by stage
  const opportunitiesByStage = OPPORTUNITY_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = opportunities.filter((opp) => opp.status === stage.id)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Set up drag and drop using native HTML5 drag and drop
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      if (!e.target) return

      const card = (e.target as Element).closest("[data-id]")
      if (!card) return

      const id = card.getAttribute("data-id")
      const status = card.getAttribute("data-status")

      if (!id) return

      setActiveId(id)

      // Find the opportunity object
      const opportunity = opportunities.find((opp) => opp.id === id)
      if (opportunity) {
        setDraggedOpportunity(opportunity)

        // Set drag data
        e.dataTransfer?.setData("text/plain", id)

        // Create a drag image
        const dragImage = document.createElement("div")
        dragImage.textContent = opportunity.name
        dragImage.style.padding = "8px"
        dragImage.style.background = "white"
        dragImage.style.border = "1px solid #ccc"
        dragImage.style.borderRadius = "4px"
        dragImage.style.position = "absolute"
        dragImage.style.top = "-1000px"
        document.body.appendChild(dragImage)

        e.dataTransfer?.setDragImage(dragImage, 0, 0)

        // Remove the element after drag starts
        setTimeout(() => {
          document.body.removeChild(dragImage)
        }, 0)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()

      // Set the drop effect
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move"
      }
    }

    // Update the handleDrop function in the useEffect hook
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()

      if (!draggedOpportunity) return

      // Find the closest element with data-stage attribute
      const dropTarget = (e.target as Element).closest("[data-stage]")
      if (!dropTarget) {
        console.log("No drop target found")
        return
      }

      const newStatus = dropTarget.getAttribute("data-stage")
      if (!newStatus) {
        console.log("No status found on drop target")
        return
      }

      if (newStatus === draggedOpportunity.status) {
        console.log("Dropped in the same status column")
        return
      }

      console.log(`Moving opportunity ${draggedOpportunity.id} from ${draggedOpportunity.status} to ${newStatus}`)

      try {
        // Update the opportunity status in the database
        await updateOpportunityStatus(draggedOpportunity.id, newStatus)

        // Refresh opportunities
        onOpportunityUpdated()
      } catch (error) {
        console.error("Error updating opportunity status:", error)
      }

      setActiveId(null)
      setDraggedOpportunity(null)
    }

    const handleDragEnd = () => {
      setActiveId(null)
      setDraggedOpportunity(null)
    }

    // Add event listeners to the document
    document.addEventListener("dragstart", handleDragStart)
    document.addEventListener("dragover", handleDragOver)
    document.addEventListener("drop", handleDrop)
    document.addEventListener("dragend", handleDragEnd)

    // Clean up
    return () => {
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("dragover", handleDragOver)
      document.removeEventListener("drop", handleDrop)
      document.removeEventListener("dragend", handleDragEnd)
    }
  }, [opportunities, onOpportunityUpdated, draggedOpportunity])

  // Handle adding a new opportunity to a specific stage
  const handleAddToStage = (stageId: string) => {
    setSelectedStage(stageId)
    setIsAddModalOpen(true)
  }

  // Get color classes based on stage ID
  const getStageColorClasses = (stageId: string) => {
    switch (stageId) {
      case "new":
        return {
          header: "bg-blue-100 border-b border-blue-200",
          content: "bg-blue-50/50",
          text: "text-blue-800",
          badge: "bg-blue-100 text-blue-800 border-blue-200",
        }
      case "quoted":
        return {
          header: "bg-purple-100 border-b border-purple-200",
          content: "bg-purple-50/50",
          text: "text-purple-800",
          badge: "bg-purple-100 text-purple-800 border-purple-200",
        }
      case "waiting_on_trade_eval":
        return {
          header: "bg-amber-100 border-b border-amber-200",
          content: "bg-amber-50/50",
          text: "text-amber-800",
          badge: "bg-amber-100 text-amber-800 border-amber-200",
        }
      case "accepted":
        return {
          header: "bg-teal-100 border-b border-teal-200",
          content: "bg-teal-50/50",
          text: "text-teal-800",
          badge: "bg-teal-100 text-teal-800 border-teal-200",
        }
      case "rpo":
        return {
          header: "bg-indigo-100 border-b border-indigo-200",
          content: "bg-indigo-50/50",
          text: "text-indigo-800",
          badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
        }
      case "ready_to_bill":
        return {
          header: "bg-green-100 border-b border-green-200",
          content: "bg-green-50/50",
          text: "text-green-800",
          badge: "bg-green-100 text-green-800 border-green-200",
        }
      case "lost_deal":
        return {
          header: "bg-red-100 border-b border-red-200",
          content: "bg-red-50/50",
          text: "text-red-800",
          badge: "bg-red-100 text-red-800 border-red-200",
        }
      default:
        return {
          header: "",
          content: "",
          text: "",
          badge: "",
        }
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {OPPORTUNITY_STAGES.map((stage) => (
          <div key={stage.id} className="flex flex-col">
            <Card className="h-full overflow-hidden border shadow-sm">
              <CardHeader className={`py-2 px-3 ${getStageColorClasses(stage.id).header}`}>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-medium ${getStageColorClasses(stage.id).text}`}>
                    {stage.name}
                  </CardTitle>
                  <Badge variant="outline" className={getStageColorClasses(stage.id).badge}>
                    {opportunitiesByStage[stage.id]?.length || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent
                className={`flex-1 overflow-y-auto p-2 ${getStageColorClasses(stage.id).content} min-h-[70vh]`}
                data-stage={stage.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "move"
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  console.log("Drop event on stage:", stage.id)

                  if (!draggedOpportunity) {
                    console.log("No dragged opportunity")
                    return
                  }

                  const newStatus = stage.id
                  if (newStatus === draggedOpportunity.status) {
                    console.log("Same status, no update needed")
                    return
                  }

                  console.log(
                    `Updating opportunity ${draggedOpportunity.id} status from ${draggedOpportunity.status} to ${newStatus}`,
                  )

                  updateOpportunityStatus(draggedOpportunity.id, newStatus)
                    .then(() => {
                      console.log("Status updated successfully")
                      onOpportunityUpdated()
                    })
                    .catch((error) => {
                      console.error("Error updating opportunity status:", error)
                    })
                    .finally(() => {
                      setActiveId(null)
                      setDraggedOpportunity(null)
                    })
                }}
              >
                <div className="space-y-2" data-stage={stage.id}>
                  {opportunitiesByStage[stage.id]?.map((opportunity) => (
                    <div key={opportunity.id} draggable="true">
                      <OpportunityCard
                        opportunity={opportunity}
                        isActive={activeId === opportunity.id}
                        onOpportunityUpdated={onOpportunityUpdated}
                        stageId={stage.id}
                      />
                    </div>
                  ))}
                  {opportunitiesByStage[stage.id]?.length === 0 && (
                    <div className="flex items-center justify-center h-20 text-sm text-gray-500">No opportunities</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Modal for adding a new opportunity to a specific stage */}
      <OpportunityModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setSelectedStage(null)
        }}
        onSuccess={onOpportunityUpdated}
        initialStatus={selectedStage || undefined}
      />
    </>
  )
}

