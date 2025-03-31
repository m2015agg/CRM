"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { getSupabase } from "@/lib/supabase"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

// Define the status columns based on the actual values in the database
const statusColumns = ["new", "quoted", "accepted", "lost_deal"]

// Define a mapping for display names
const statusDisplayNames = {
  new: "New Lead",
  quoted: "Proposal Sent",
  accepted: "Won",
  lost_deal: "Lost",
}

export function WorkingKanbanBoard() {
  const { userDetails, loading: loadingAuth } = useAuth()
  const [opportunities, setOpportunities] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState("all")
  const [loadingOpportunities, setLoadingOpportunities] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])

  const supabase = getSupabase()

  // Add a log entry
  const addLog = (message) => {
    const timestamp = new Date().toISOString()
    console.log(`${timestamp}: ${message}`)
    setLogs((prev) => [...prev, { timestamp, message }])
  }

  // Fetch users
  useEffect(() => {
    if (!userDetails) return

    const fetchUsers = async () => {
      try {
        addLog("Fetching users...")
        setLoadingUsers(true)

        const { data, error } = await supabase
          .from("users")
          .select("id, email, full_name")
          .order("full_name", { ascending: true })

        if (error) {
          addLog(`Error fetching users: ${error.message}`)
          throw error
        }

        addLog(`Fetched ${data.length} users`)
        setUsers(data || [])
      } catch (err) {
        addLog(`Error in fetchUsers: ${err.message}`)
        setError(err)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [userDetails])

  // Fetch opportunities
  useEffect(() => {
    if (!userDetails) return

    const fetchOpportunities = async () => {
      try {
        addLog("Fetching opportunities...")
        setLoadingOpportunities(true)

        let query = supabase.from("opportunities").select("*")

        if (selectedUserId !== "all") {
          query = query.eq("owner_id", selectedUserId)
          addLog(`Filtering by user ID: ${selectedUserId}`)
        }

        const { data, error } = await query.order("updated_at", { ascending: false })

        if (error) {
          addLog(`Error fetching opportunities: ${error.message}`)
          throw error
        }

        addLog(`Fetched ${data.length} opportunities`)

        // Log the first opportunity to see its structure
        if (data && data.length > 0) {
          addLog(`First opportunity: ${JSON.stringify(data[0])}`)
        }

        setOpportunities(data || [])
      } catch (err) {
        addLog(`Error in fetchOpportunities: ${err.message}`)
        setError(err)
      } finally {
        setLoadingOpportunities(false)
      }
    }

    fetchOpportunities()
  }, [userDetails, selectedUserId])

  // Handle drag end
  const handleDragEnd = async (result) => {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newStatus = statusColumns[destination.droppableId]

    addLog(`Moving opportunity ${draggableId} to ${newStatus}`)

    try {
      const { error } = await supabase.from("opportunities").update({ status: newStatus }).eq("id", draggableId)

      if (error) {
        addLog(`Error updating opportunity: ${error.message}`)
        throw error
      }

      // Update local state
      setOpportunities((prev) => prev.map((opp) => (opp.id === draggableId ? { ...opp, status: newStatus } : opp)))

      addLog(`Successfully updated opportunity status`)
    } catch (err) {
      addLog(`Error in handleDragEnd: ${err.message}`)
      setError(err)
    }
  }

  // Group opportunities by status
  const opportunitiesByStatus = {}

  // Initialize all status columns with empty arrays
  statusColumns.forEach((status) => {
    opportunitiesByStatus[status] = []
  })

  // Group opportunities by status
  opportunities.forEach((opp) => {
    const status = opp.status

    // Check if the status is one of our defined columns
    if (statusColumns.includes(status)) {
      opportunitiesByStatus[status].push(opp)
    } else {
      // If not, log it for debugging
      addLog(`Opportunity with unknown status: ${status}`)
    }
  })

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

      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">Debug Logs:</h3>
        <div className="text-xs font-mono h-32 overflow-y-auto bg-background p-2 rounded border">
          {logs.map((log, i) => (
            <div key={i}>
              <span className="text-muted-foreground">{log.timestamp.substring(11, 19)}</span>: {log.message}
            </div>
          ))}
        </div>
      </div>

      {loadingOpportunities ? (
        <div className="p-4 bg-muted rounded-md">Loading opportunities...</div>
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

