"use client"

import { useState, useEffect, useCallback } from "react"
import { DragDropContext } from "@hello-pangea/dnd"
import { toast } from "sonner"
import { KanbanColumn } from "./kanban-column"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OpportunityDialog } from "./opportunity-dialog"
import { useAuth } from "@/hooks/use-auth"

export function FullKanbanBoard() {
  // Auth context to determine user role and permissions
  const { userDetails } = useAuth()

  // State for opportunities grouped by status
  const [opportunities, setOpportunities] = useState<Record<string, any[]>>({
    new: [],
    quoted: [],
    accepted: [],
    lost_deal: [],
  })

  // State for user list and loading states
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch users - only for admin role
  useEffect(() => {
    if (userDetails?.role !== "admin") return

    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true)

        const { data, error } = await supabase
          .from("users")
          .select("id, email, full_name, role")
          .order("full_name", { ascending: true })

        if (error) throw error

        setUsers(data || [])
      } catch (err: any) {
        console.error("Error fetching users:", err.message)
        toast.error("Failed to load users")
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [userDetails?.role])

  // Fetch opportunities with role-based filtering
  const fetchOpportunities = useCallback(async () => {
    try {
      setIsLoading(true)

      // Base query for opportunities
      let query = supabase.from("opportunities").select("*").order("updated_at", { ascending: false })

      // Role-based filtering
      if (userDetails?.role === "admin" && selectedUser && selectedUser !== "all") {
        query = query.eq("owner_id", selectedUser)
      } else if (userDetails?.role === "submitter") {
        // Submitters only see their own opportunities
        query = query.eq("owner_id", userDetails.id)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Group opportunities by status
      const grouped = data.reduce(
        (acc: Record<string, any[]>, opp) => {
          const status = opp.status || "new"
          if (!acc[status]) {
            acc[status] = []
          }
          acc[status].push(opp)
          return acc
        },
        {
          new: [],
          quoted: [],
          accepted: [],
          lost_deal: [],
        },
      )

      setOpportunities(grouped)
    } catch (error) {
      console.error("Error fetching opportunities:", error)
      toast.error("Failed to load opportunities")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [selectedUser, userDetails?.role, userDetails?.id])

  // Set up real-time subscription for opportunity changes
  useEffect(() => {
    fetchOpportunities()

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
  }, [fetchOpportunities])

  // Handle drag and drop events
  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result

    // Dropped outside the list
    if (!destination) {
      return
    }

    // Dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    // Get the opportunity that was dragged
    const sourceStatus = source.droppableId
    const destinationStatus = destination.droppableId
    const draggedOpp = opportunities[sourceStatus][source.index]

    // Optimistically update the UI
    const newOpportunities = { ...opportunities }

    // Remove from source
    newOpportunities[sourceStatus] = [
      ...newOpportunities[sourceStatus].slice(0, source.index),
      ...newOpportunities[sourceStatus].slice(source.index + 1),
    ]

    // Add to destination
    const updatedOpp = { ...draggedOpp, status: destinationStatus }
    newOpportunities[destinationStatus] = [
      ...newOpportunities[destinationStatus].slice(0, destination.index),
      updatedOpp,
      ...newOpportunities[destinationStatus].slice(destination.index),
    ]

    setOpportunities(newOpportunities)

    // Update in the database
    try {
      const { error } = await supabase.from("opportunities").update({ status: destinationStatus }).eq("id", draggableId)

      if (error) {
        throw error
      }

      toast.success(`Moved opportunity to ${destinationStatus}`)
    } catch (error) {
      console.error("Error updating opportunity:", error)
      toast.error("Failed to update opportunity")
      // Revert the UI change on error
      fetchOpportunities()
    }
  }

  // Refresh opportunities
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchOpportunities()
  }

  // Open new opportunity dialog
  const handleNewOpportunity = () => {
    setIsDialogOpen(true)
  }

  // Handle new opportunity creation
  const handleOpportunityCreated = () => {
    fetchOpportunities()
    toast.success("New opportunity created successfully!")
  }

  // User selector component - only visible to admins
  const EnhancedUserSelector = () => {
    if (userDetails?.role !== "admin") return null

    return (
      <div className="w-64">
        <Select value={selectedUser || "all"} onValueChange={setSelectedUser} disabled={isLoadingUsers}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Filter by user">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                {selectedUser === "all"
                  ? "Everyone"
                  : users.find((u) => u.id === selectedUser)?.full_name || "Select user"}
              </div>
            </SelectValue>
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
    )
  }

  return (
    <div className="space-y-4">
      {/* Header section with gradient background */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-900">Sales Pipeline</h1>
            <p className="text-blue-700">Manage and track opportunities through the sales pipeline</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <EnhancedUserSelector />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white hover:bg-blue-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNewOpportunity}>
              <Plus className="h-4 w-4 mr-2" />
              New Opportunity
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban board grid layout */}
      {/* 
        To adjust the layout:
        - grid-cols-1: Single column on mobile
        - md:grid-cols-2: Two columns on medium screens
        - lg:grid-cols-4: Four columns on large screens
        - gap-4: Spacing between columns
        To change card sizes, modify the KanbanColumn component
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* 
            KanbanColumn props:
            - title: Column header text
            - opportunities: Array of opportunities in this column
            - droppableId: Unique ID for drag and drop
            - isLoading: Loading state
            To adjust card sizes, modify the KanbanColumn component
          */}
          <KanbanColumn title="New Lead" opportunities={opportunities.new} droppableId="new" isLoading={isLoading} />
          <KanbanColumn
            title="Proposal Sent"
            opportunities={opportunities.quoted}
            droppableId="quoted"
            isLoading={isLoading}
          />
          <KanbanColumn
            title="Won"
            opportunities={opportunities.accepted}
            droppableId="accepted"
            isLoading={isLoading}
          />
          <KanbanColumn
            title="Lost"
            opportunities={opportunities.lost_deal}
            droppableId="lost_deal"
            isLoading={isLoading}
          />
        </DragDropContext>
      </div>

      {/* Opportunity Dialog for creating new opportunities */}
      <OpportunityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onOpportunityCreated={handleOpportunityCreated}
        initialStatus="new"
      />
    </div>
  )
}

