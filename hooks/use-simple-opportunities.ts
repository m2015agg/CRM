"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"]

export function useSimpleOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        console.log("Fetching opportunities...")
        setLoading(true)

        const { data, error } = await supabase
          .from("opportunities")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Supabase error:", error)
          throw error
        }

        console.log("Fetched opportunities:", data?.length || 0)
        setOpportunities(data || [])
      } catch (err) {
        console.error("Error fetching opportunities:", err)
        setError(err instanceof Error ? err : new Error("Unknown error occurred"))
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunities()
  }, [])

  return {
    opportunities,
    loading,
    error,
  }
}

