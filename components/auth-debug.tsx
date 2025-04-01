"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AuthDebug() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const supabase = getSupabase()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("AuthDebug: Checking authentication...")

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("AuthDebug: Error getting session:", error)
          throw error
        }

        console.log("AuthDebug: Session data:", data)
        setSession(data.session)
      } catch (err) {
        console.error("AuthDebug: Error in checkAuth:", err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("AuthDebug: Auth state changed:", event)
      setSession(session)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Checking authentication...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-300">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error checking authentication: {error.message || "Unknown error"}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span>Status:</span>
            <Badge variant={session ? "default" : "destructive"}>
              {session ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>
          {session && (
            <>
              <div>
                <span className="font-medium">User ID:</span> {session.user.id}
              </div>
              <div>
                <span className="font-medium">Email:</span> {session.user.email}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

