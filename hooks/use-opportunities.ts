"use client"

import { useState, useEffect, useCallback } from "react"
import { getOpportunities } from "@/lib/services/opportunity-service"

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOpportunities = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getOpportunities()
      setOpportunities(data || [])
    } catch (err) {
      console.error("Error fetching opportunities:", err)
      setError(err instanceof Error ? err.message : "Failed to load opportunities")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOpportunities()
  }, [fetchOpportunities])

  return {
    opportunities,
    isLoading,
    error,
    refreshOpportunities: fetchOpportunities,
  }
}

