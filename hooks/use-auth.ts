"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"

export function useAuth() {
  const [user, setUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        setError(err)
        setLoading(false)
      }
    }

    // Get user details from the database
    const getUserDetails = async (userId) => {
      try {
        console.log("Auth hook: Getting user details")
        const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

        if (error) {
          throw error
        }

        console.log("Auth hook: User details found", data)
        setUserDetails(data)
        setLoading(false)
      } catch (err) {
        console.error("Auth hook error getting user details:", err)
        setError(err)
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

