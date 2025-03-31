"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import type { Opportunity } from "@/types"

export function useKanbanOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const fetchOpportunities = async () => {
      try {
        setLoading(true)
        console.log("Fetching opportunities...")

        let query = supabase.from("opportunities").select("*")

        // If filtering by a specific user
        if (selectedUserId) {
          query = query.eq("owner_id", selectedUserId)
        }

        const { data, error } = await query.order("updated_at", { ascending: false })

        if (error) {
          console.error("Error fetching opportunities:", error)
          throw error
        }

        console.log(`Fetched ${data.length} opportunities`)
        setOpportunities(data || [])
      } catch (err) {
        console.error("Error in fetchOpportunities:", err)
        setError(err instanceof Error ? err : new Error("Unknown error occurred"))
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunities()

    // Set up real-time subscription
    const subscription = supabase
      .channel("opportunities_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
        },
        (payload) => {
          console.log("Real-time update received:", payload)
          fetchOpportunities()
        },
      )
      .subscribe()

    return () => {
      console.log("Cleaning up subscription")
      subscription.unsubscribe()
    }
  }, [user, selectedUserId])

  const updateOpportunityStatus = async (id: string, status: string) => {
    try {
      console.log(`Updating opportunity ${id} to status ${status}`)
      const { error } = await supabase
        .from("opportunities")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      return { success: true }
    } catch (err) {
      console.error("Error updating opportunity status:", err)
      return { success: false, error: err instanceof Error ? err : new Error("Unknown error occurred") }
    }
  }

  return {
    opportunities,
    loading,
    error,
    selectedUserId,
    setSelectedUserId,
    updateOpportunityStatus,
  }
}

