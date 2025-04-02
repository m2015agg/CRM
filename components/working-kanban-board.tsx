"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { getSupabase } from "@/lib/supabase"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import type { Database } from "@/types/supabase"

type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"]

// Define the status columns based on the actual values in the database
const statusColumns = ["New", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"] as const
type Status = typeof statusColumns[number]

// Define a mapping for display names
const statusDisplayNames: Record<Status, string> = {
  "New": "New Lead",
  "Qualified": "Qualified",
  "Proposal": "Proposal Sent",
  "Negotiation": "Negotiation",
  "Closed Won": "Won",
  "Closed Lost": "Lost",
}

interface LogEntry {
  timestamp: string
  message: string
}

interface DbUser {
  id: string
  email: string
  full_name: string | null
}

export function WorkingKanbanBoard() {
  const { userDetails, loading: loadingAuth } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [users, setUsers] = useState<DbUser[]>([])
  const [selectedUserId, setSelectedUserId] = useState("all")
  const [loadingOpportunities, setLoadingOpportunities] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const supabase = getSupabase()

  // Add a log entry
  const addLog = (message: string) => {
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
        setUsers(data as DbUser[])
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        addLog(`Error in fetchUsers: ${error.message}`)
        setError(error)
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

        addLog(`Fetched ${data?.length || 0} opportunities`)

        // Get unique status values from the data
        if (data) {
          const uniqueStatuses = [...new Set(data.map(opp => opp.status))]
          addLog(`Unique status values in database: ${uniqueStatuses.join(', ')}`)

          // Log opportunities grouped by status
          const statusGroups = data.reduce<Record<string, number>>((acc, opp) => {
            const status = opp.status as string
            acc[status] = (acc[status] || 0) + 1
            return acc
          }, {})
          addLog(`Opportunities by status: ${JSON.stringify(statusGroups)}`)
        }

        // Log the first opportunity to see its structure
        if (data && data.length > 0) {
          addLog(`First opportunity: ${JSON.stringify(data[0])}`)
        }

        // Type assertion with runtime check
        if (!data) {
          setOpportunities([])
          return
        }

        // Validate that each opportunity has the required fields and convert to Opportunity type
        const validOpportunities = data
          .filter((opp: any): opp is Record<string, any> => {
            const hasRequiredFields = 
              typeof opp === 'object' && 
              opp !== null &&
              typeof opp.id === 'string' &&
              typeof opp.title === 'string' &&
              typeof opp.status === 'string' &&
              typeof opp.owner_id === 'string' &&
              typeof opp.created_at === 'string' &&
              (typeof opp.value === 'number' || opp.value === null) &&
              (typeof opp.updated_at === 'string' || opp.updated_at === null) &&
              (typeof opp.description === 'string' || opp.description === null) &&
              (typeof opp.expected_close_date === 'string' || opp.expected_close_date === null) &&
              (typeof opp.client_name === 'string' || opp.client_name === null)
            
            if (!hasRequiredFields) {
              addLog(`Invalid opportunity data: ${JSON.stringify(opp)}`)
              return false
            }
            
            return true
          })
          .map((opp) => ({
            id: opp.id,
            title: opp.title,
            client_name: opp.client_name,
            status: opp.status as Status,
            value: opp.value,
            created_at: opp.created_at,
            updated_at: opp.updated_at,
            description: opp.description,
            expected_close_date: opp.expected_close_date,
            owner_id: opp.owner_id
          })) as Opportunity[]

        setOpportunities(validOpportunities)
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        addLog(`Error in fetchOpportunities: ${error.message}`)
        setError(error)
      } finally {
        setLoadingOpportunities(false)
      }
    }

    fetchOpportunities()
  }, [userDetails, selectedUserId])

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { draggableId, source, destination } = result
    const newStatus = destination.droppableId as Status

    addLog(`Moving opportunity ${draggableId} from ${source.droppableId} to ${newStatus}`)

    try {
      // Find the opportunity being moved
      const opportunity = opportunities.find(opp => opp.id === draggableId)
      if (!opportunity) {
        addLog(`Could not find opportunity with ID: ${draggableId}`)
        return
      }

      addLog(`Current opportunity status: ${opportunity.status}`)

      // Update local state immediately using functional update
      setOpportunities((prevOpportunities) => {
        const updated = prevOpportunities.map(opp => 
          opp.id === draggableId 
            ? { ...opp, status: newStatus, updated_at: new Date().toISOString() }
            : opp
        )
        
        // Log the updated state for debugging
        addLog(`Updated opportunities state: ${JSON.stringify(updated.map(opp => ({ id: opp.id, status: opp.status })))}`)
        return updated
      })

      // Update the database in the background
      const { error } = await supabase
        .from("opportunities")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", draggableId)

      if (error) {
        // If database update fails, revert the local state using functional update
        setOpportunities((prevOpportunities) => {
          const reverted = prevOpportunities.map(opp => 
            opp.id === draggableId 
              ? { ...opp, status: opportunity.status, updated_at: opportunity.updated_at }
              : opp
          )
          addLog(`Reverted opportunities state: ${JSON.stringify(reverted.map(opp => ({ id: opp.id, status: opp.status })))}`)
          return reverted
        })
        addLog(`Error updating opportunity: ${error.message}`)
        throw error
      }

      addLog(`Successfully updated opportunity status to ${newStatus}`)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      addLog(`Error in handleDragEnd: ${error.message}`)
      setError(error)
    }
  }

  // Group opportunities by status
  const opportunitiesByStatus: Record<Status, Opportunity[]> = statusColumns.reduce(
    (acc, status) => {
      acc[status] = opportunities.filter((opp) => opp.status === status)
      return acc
    },
    {} as Record<Status, Opportunity[]>,
  )

  // Log the current grouping before rendering
  useEffect(() => {
    addLog(`Current opportunities grouping: ${JSON.stringify(
      Object.entries(opportunitiesByStatus).map(([status, opps]) => ({
        status,
        count: opps.length,
        ids: opps.map(opp => opp.id)
      }))
    )}`)
  }, [opportunitiesByStatus])

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
            {statusColumns.map((status) => (
              <div key={status} className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{statusDisplayNames[status]}</h3>
                  <Badge variant="outline">{opportunitiesByStatus[status]?.length || 0}</Badge>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-muted/50 rounded-md p-2 min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-muted' : ''
                      }`}
                    >
                      {opportunitiesByStatus[status]?.map((opp, index) => (
                        <Draggable key={opp.id} draggableId={opp.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                marginBottom: '8px',
                                opacity: snapshot.isDragging ? 0.8 : 1,
                                transform: snapshot.isDragging 
                                  ? provided.draggableProps.style?.transform 
                                  : 'none'
                              }}
                            >
                              <Card className={`mb-2 ${snapshot.isDragging ? 'shadow-lg' : ''}`}>
                                <CardContent className="p-3 space-y-2">
                                  <div className="font-medium truncate">{opp.title}</div>
                                  {opp.client_name && (
                                    <div className="text-sm text-muted-foreground truncate">{opp.client_name}</div>
                                  )}
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

