"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { getSupabase } from "@/lib/supabase"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Skeleton } from "@/components/ui/skeleton"

// Define the status columns based on the actual values in the database
const statusColumns = ["new", "quoted", "accepted", "lost_deal"]

// Define a mapping for display names
const statusDisplayNames = {
  new: "New Lead",
  quoted: "Proposal Sent",
  accepted: "Won",
  lost_deal: "Lost",
}

export function OptimizedKanbanBoard() {
  const { userDetails, loading: loadingAuth } = useAuth()
  const [opportunities, setOpportunities] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState("all")
  const [loadingOpportunities, setLoadingOpportunities] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState(null)

  const supabase = getSupabase()

  // Fetch users - optimized to only get necessary fields
  useEffect(() => {
    if (!userDetails) return

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true)

        const { data, error } = await supabase
          .from("users")
          .select("id, email, full_name")
          .order("full_name", { ascending: true })

        if (error) throw error

        setUsers(data || [])
      } catch (err) {
        console.error("Error fetching users:", err)
        setError(err)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [userDetails])

  // Fetch opportunities - optimized to only get necessary fields
  useEffect(() => {
    if (!userDetails) return

    const fetchOpportunities = async () => {
      try {
        setLoadingOpportunities(true)

        let query = supabase.from("opportunities").select("id, company_name, contact_name, value, status, updated_at")

        if (selectedUserId !== "all") {
          query = query.eq("owner_id", selectedUserId)
        }

        const { data, error } = await query.order("updated_at", { ascending: false })

        if (error) throw error

        setOpportunities(data || [])
      } catch (err) {
        console.error("Error fetching opportunities:", err)
        setError(err)
      } finally {
        setLoadingOpportunities(false)
      }
    }

    fetchOpportunities()

    // Set up real-time subscription for only the necessary fields
    const subscription = supabase
      .channel("opportunities_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
        },
        () => {
          fetchOpportunities()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userDetails, selectedUserId])

  // Memoize the grouped opportunities to prevent unnecessary recalculations
  const opportunitiesByStatus = useMemo(() => {
    const grouped = {}

    // Initialize all status columns with empty arrays
    statusColumns.forEach((status) => {
      grouped[status] = []
    })

    // Group opportunities by status
    opportunities.forEach((opp) => {
      const status = opp.status

      if (statusColumns.includes(status)) {
        grouped[status].push(opp)
      }
    })

    return grouped
  }, [opportunities])

  // Memoize the handler to prevent unnecessary recreations
  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newStatus = statusColumns[destination.droppableId]

    try {
      const { error } = await supabase
        .from("opportunities")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draggableId)

      if (error) throw error

      // Optimistically update the UI
      setOpportunities((prev) => prev.map((opp) => (opp.id === draggableId ? { ...opp, status: newStatus } : opp)))
    } catch (err) {
      console.error("Error updating opportunity:", err)
      setError(err)
    }
  }, [])

  // Render loading skeletons
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statusColumns.map((status) => (
        <div key={status} className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{statusDisplayNames[status] || status}</h3>
            <Badge variant="outline">-</Badge>
          </div>
          <div className="bg-muted/50 rounded-md p-2 min-h-[200px]">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="mb-2">
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  if (loadingAuth) {
    return <div className="p-4 text-foreground">Loading authentication...</div>
  }

  if (!userDetails) {
    return <div className="p-4 text-red-500">You must be logged in to view this page.</div>
  }

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Team Opportunities</h2>

        {userDetails?.role === "admin" && (
          <div className="w-64">
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={loadingUsers}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {loadingOpportunities ? (
        renderSkeletons()
      ) : error ? (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 rounded-md">
          Error: {error.message}
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusColumns.map((status, index) => (
              <div key={status} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{statusDisplayNames[status] || status}</h3>
                  <Badge variant="outline">{opportunitiesByStatus[status]?.length || 0}</Badge>
                </div>
                <Droppable droppableId={index.toString()}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-muted/50 rounded-md p-2 min-h-[200px]"
                    >
                      {opportunitiesByStatus[status]?.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                              <Card className="mb-2">
                                <CardContent className="p-3 space-y-2">
                                  <div className="font-medium truncate">{opp.company_name}</div>
                                  <div className="text-sm text-muted-foreground truncate">{opp.contact_name}</div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">{formatCurrency(opp.value || 0)}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}

