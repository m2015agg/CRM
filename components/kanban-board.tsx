"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { OpportunityCard } from "@/components/opportunity-card"
import { updateOpportunityStatus } from "@/lib/services/opportunity-service"
import { OPPORTUNITY_STAGES } from "@/components/airtable-kanban-board"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { OpportunityModal } from "@/components/opportunity-modal"

interface KanbanBoardProps {
  opportunities: any[]
  onOpportunityUpdated: () => void
}

export function KanbanBoard({ opportunities, onOpportunityUpdated }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  // Set up sensors for drag and drop
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  // Group opportunities by stage
  const opportunitiesByStage = OPPORTUNITY_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = opportunities.filter((opp) => opp.status === stage.id)
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Handle drag start event
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    setCurrentStatus(active.data.current?.status || null)
  }

  // Handle drag over event
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Find the containers
    const activeContainer = active.data.current?.status
    const overContainer = OPPORTUNITY_STAGES.find((stage) => stage.id === overId)?.id

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return
    }

    // We're moving to a new container
    setCurrentStatus(overContainer)
  }

  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setCurrentStatus(null)
      return
    }

    // Check if we're dropping on a column
    const isColumn = OPPORTUNITY_STAGES.some((stage) => stage.id === over.id)

    // If the item was dropped in a different container
    if (isColumn && active.data.current?.status !== over.id) {
      try {
        // Update the opportunity status in the database
        await updateOpportunityStatus(active.id as string, over.id as string)

        // Refresh opportunities
        onOpportunityUpdated()
      } catch (error) {
        console.error("Error updating opportunity status:", error)
      }
    }

    setActiveId(null)
    setCurrentStatus(null)
  }

  // Handle adding a new opportunity to a specific stage
  const handleAddToStage = (stageId: string) => {
    setSelectedStage(stageId)
    setIsAddModalOpen(true)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        {OPPORTUNITY_STAGES.map((stage) => (
          <div key={stage.id} className="flex flex-col">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{stage.name}</CardTitle>
                  <Badge variant="outline">{opportunitiesByStage[stage.id]?.length || 0}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-2">
                <SortableContext
                  id={stage.id}
                  items={opportunitiesByStage[stage.id]?.map((opp) => opp.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[200px]" id={stage.id} data-stage={stage.id}>
                    {opportunitiesByStage[stage.id]?.map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={opportunity}
                        isActive={activeId === opportunity.id}
                        onOpportunityUpdated={onOpportunityUpdated}
                      />
                    ))}
                  </div>
                </SortableContext>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-gray-500 hover:text-gray-700 mt-2"
                  onClick={() => handleAddToStage(stage.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add opportunity
                </Button>
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
    </DndContext>
  )
}

