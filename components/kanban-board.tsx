"use client"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useUsers } from "@/hooks/use-users"
import { useKanbanOpportunities } from "@/hooks/use-kanban-opportunities"
import { Skeleton } from "@/components/ui/skeleton"
import type { Opportunity } from "@/types"

// Define the status columns based on the actual values in the database
const statusColumns = ["new", "quoted", "accepted", "lost_deal"] as const
type Status = typeof statusColumns[number]

// Define a mapping for display names
const statusDisplayNames: Record<Status, string> = {
  new: "New Lead",
  quoted: "Proposal Sent",
  accepted: "Won",
  lost_deal: "Lost",
}

export function KanbanBoard() {
  const { userDetails } = useAuth()
  const { users, loading: loadingUsers } = useUsers()
  const {
    opportunities,
    loading: loadingOpportunities,
    error,
    selectedUserId,
    setSelectedUserId,
    updateOpportunityStatus,
  } = useKanbanOpportunities()

  const isAdmin = userDetails?.role === "admin"

  // Group opportunities by status
  const opportunitiesByStatus: Record<Status, Opportunity[]> = statusColumns.reduce(
    (acc, status) => {
      acc[status] = opportunities.filter((opp) => opp.status === status)
      return acc
    },
    {} as Record<Status, Opportunity[]>,
  )

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    // Dropped outside a droppable area
    if (!destination) return

    // Dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    // Update opportunity status
    updateOpportunityStatus(draggableId, destination.droppableId)
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-md">Error loading opportunities: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">View:</span>
          <Select
            value={selectedUserId || "everyone"}
            onValueChange={(value) => setSelectedUserId(value === "everyone" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Everyone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              {loadingUsers ? (
                <SelectItem value="loading" disabled>
                  Loading users...
                </SelectItem>
              ) : (
                users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((status) => (
            <div key={status} className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{statusDisplayNames[status]}</h3>
                <Badge variant="outline">{opportunitiesByStatus[status]?.length || 0}</Badge>
              </div>
              <Droppable droppableId={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-50 rounded-md p-2 min-h-[500px]"
                  >
                    {loadingOpportunities ? (
                      <div className="space-y-2">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : (
                      opportunitiesByStatus[status]?.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-2 cursor-grab active:cursor-grabbing"
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="font-medium truncate">{opp.name}</div>
                                <div className="text-sm text-muted-foreground truncate">{opp.company_name}</div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{formatCurrency(opp.value || 0)}</span>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

