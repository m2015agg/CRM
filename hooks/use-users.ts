"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@/types"

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        console.log("Fetching users...")

        const { data, error } = await supabase.from("users").select("*").order("email")

        if (error) {
          console.error("Error fetching users:", error)
          throw error
        }

        console.log(`Fetched ${data.length} users`)
        setUsers(data || [])
      } catch (err) {
        console.error("Error in fetchUsers:", err)
        setError(err instanceof Error ? err : new Error("Unknown error occurred"))
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
  }
}

