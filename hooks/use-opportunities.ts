"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getOpportunities } from "@/lib/services/opportunity-service"

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  // Use useRef to track if the component is mounted
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const fetchOpportunities = useCallback(async () => {
    if (!isMounted.current) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await getOpportunities()

      // Only update state if component is still mounted
      if (isMounted.current) {
        setOpportunities(data || [])
      }
    } catch (err) {
      console.error("Error fetching opportunities:", err)

      // Only update state if component is still mounted
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : "Failed to load opportunities")
      }
    } finally {
      // Only update state if component is still mounted
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [])

  return {
    opportunities,
    isLoading,
    error,
    refreshOpportunities: fetchOpportunities,
  }
}

