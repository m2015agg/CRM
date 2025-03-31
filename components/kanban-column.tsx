import { Badge } from "@/components/ui/badge"
import { Droppable } from "@hello-pangea/dnd"
import { OpportunityCard } from "./opportunity-card"

interface KanbanColumnProps {
  title: string
  opportunities: any[]
  droppableId: string
  isLoading: boolean
}

export function KanbanColumn({ title, opportunities, droppableId, isLoading }: KanbanColumnProps) {
  // Column header color based on status
  const getColumnHeaderColor = (droppableId: string) => {
    switch (droppableId.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "quoted":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "lost_deal":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Column background color based on status
  const getColumnBgColor = (droppableId: string) => {
    switch (droppableId.toLowerCase()) {
      case "new":
        return "bg-blue-50/50"
      case "quoted":
        return "bg-amber-50/50"
      case "accepted":
        return "bg-green-50/50"
      case "lost_deal":
        return "bg-red-50/50"
      default:
        return "bg-gray-50/50"
    }
  }

  const headerColor = getColumnHeaderColor(droppableId)
  const bgColor = getColumnBgColor(droppableId)

  return (
    <div className="flex flex-col h-full border rounded-md shadow-sm">
      <div className={`flex justify-between items-center p-2 rounded-t-md ${headerColor}`}>
        <h3 className="font-medium text-sm">{title}</h3>
        <Badge variant="outline" className="text-xs font-bold">
          {opportunities?.length || 0}
        </Badge>
      </div>

      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`${bgColor} rounded-b-md p-2 flex-1 min-h-[calc(100vh-220px)] overflow-y-auto ${
              snapshot.isDraggingOver ? "ring-2 ring-primary/20" : ""
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : opportunities?.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                No opportunities
              </div>
            ) : (
              opportunities?.map((opp, index) => <OpportunityDraggable key={opp.id} opportunity={opp} index={index} />)
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

// Separate component for the draggable to optimize renders
import { Draggable } from "@hello-pangea/dnd"
import { memo } from "react"

interface OpportunityDraggableProps {
  opportunity: any
  index: number
}

const OpportunityDraggable = memo(function OpportunityDraggable({ opportunity, index }: OpportunityDraggableProps) {
  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <OpportunityCard opportunity={opportunity} isDragging={snapshot.isDragging} />
        </div>
      )}
    </Draggable>
  )
})

