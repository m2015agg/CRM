"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import type { User } from "@/types"

interface DbUser {
  id: string
  email: string
  full_name: string | null
  role: "admin" | "submitter"
}

function isDbUser(data: unknown): data is DbUser {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    typeof d.id === "string" &&
    typeof d.email === "string" &&
    (d.full_name === null || typeof d.full_name === "string") &&
    (d.role === "admin" || d.role === "submitter")
  )
}

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [userDetails, setUserDetails] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = getSupabase()

  useEffect(() => {
    console.log("Auth hook: Initializing")

    // Get the initial session
    const getInitialSession = async () => {
      try {
        console.log("Auth hook: Getting initial session")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (session) {
          console.log("Auth hook: Session found")
          setUser(session.user)
          await getUserDetails(session.user.id)
        } else {
          console.log("Auth hook: No session found")
          setLoading(false)
        }
      } catch (err) {
        console.error("Auth hook error:", err)
        setError(err instanceof Error ? err : new Error("Unknown error"))
        setLoading(false)
      }
    }

    // Get user details from the database
    const getUserDetails = async (userId: string) => {
      try {
        console.log("Auth hook: Getting user details")
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single()

        if (error) {
          throw error
        }

        if (data && isDbUser(data)) {
          console.log("Auth hook: User details found", data)
          const userData: User = {
            id: data.id,
            email: data.email,
            full_name: data.full_name || undefined,
            role: data.role
          }
          setUserDetails(userData)
          setLoading(false)
        }
      } catch (err) {
        console.error("Auth hook error getting user details:", err)
        setError(err instanceof Error ? err : new Error("Unknown error"))
        setLoading(false)
      }
    }

    getInitialSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth hook: Auth state changed", event)

      if (session) {
        setUser(session.user)
        await getUserDetails(session.user.id)
      } else {
        setUser(null)
        setUserDetails(null)
        setLoading(false)
      }
    })

    return () => {
      console.log("Auth hook: Cleaning up")
      subscription.unsubscribe()
    }
  }, [])

  return { user, userDetails, loading, error }
}

