"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { OpportunityModal } from "@/components/opportunity-modal"
import { useOpportunities } from "@/hooks/use-opportunities"
import { KanbanBoard } from "@/components/kanban-board"
import { useRouter } from "next/navigation"

export default function OpportunitiesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { opportunities, isLoading, error, refreshOpportunities } = useOpportunities()
  const router = useRouter()

  // Force refresh when component mounts
  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      if (mounted) {
        await refreshOpportunities()
      }
    }

    loadData()

    // Cleanup function to prevent state updates after unmounting
    return () => {
      mounted = false
    }
  }, [refreshOpportunities])

  // Handle navigation cleanup
  useEffect(() => {
    // This will run when the component unmounts
    return () => {
      // Force any pending state updates to be discarded
      window.history.scrollRestoration = "auto"

      // Clear any event listeners that might be causing issues
      const cleanup = () => {
        document.body.style.pointerEvents = ""
        document.body.style.overflow = ""
      }

      cleanup()
      setTimeout(cleanup, 100)
    }
  }, [])

  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales Opportunities</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Opportunity
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-700">
          <p>Error loading opportunities: {error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <KanbanBoard opportunities={opportunities} onOpportunityUpdated={refreshOpportunities} />
      )}

      {/* Use our custom modal instead of the Dialog component */}
      <OpportunityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refreshOpportunities}
      />
    </div>
  )
}

