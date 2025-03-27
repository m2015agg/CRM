"use client"

import type React from "react"

import { useState } from "react"
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

  // Group opportunities by stage
  const opportunitiesByStage = OPPORTUNITY_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = opportunities.filter((opp) => opp.status === stage.id)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, opportunity: any) => {
    setActiveId(opportunity.id)
    e.dataTransfer.setData("opportunityId", opportunity.id)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle drop
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const opportunityId = e.dataTransfer.getData("opportunityId")

    if (!opportunityId) return

    const opportunity = opportunities.find((opp) => opp.id === opportunityId)
    if (!opportunity || opportunity.status === newStatus) {
      setActiveId(null)
      return
    }

    try {
      await updateOpportunityStatus(opportunityId, newStatus)
      onOpportunityUpdated()
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setActiveId(null)
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    setActiveId(null)
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
      {/* Adjusted grid layout with fewer columns on larger screens and more spacing */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full max-w-[2000px] mx-auto px-4">
        {OPPORTUNITY_STAGES.map((stage) => (
          <div key={stage.id} className="flex flex-col">
            <Card className="h-full overflow-hidden border shadow-sm w-full min-w-[280px]">
              <CardHeader className={`py-3 px-4 ${getStageColorClasses(stage.id).header}`}>
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
                className={`flex-1 overflow-y-auto p-3 ${getStageColorClasses(stage.id).content} min-h-[70vh]`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="space-y-3">
                  {opportunitiesByStage[stage.id]?.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, opportunity)}
                      onDragEnd={handleDragEnd}
                      className="w-full"
                    >
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

