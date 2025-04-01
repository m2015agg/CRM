"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SupabaseDebug() {
  const [session, setSession] = useState<any>(null)
  const [tables, setTables] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setLoading(true)

        // Check session
        const { data: sessionData } = await supabase.auth.getSession()
        setSession(sessionData.session)

        // List tables (requires admin privileges)
        const { data, error } = await supabase.from("opportunities").select("id").limit(1)

        if (error) throw error

        // If we got here, connection is working
        setTables(["Connection successful"])
      } catch (err) {
        console.error("Supabase connection error:", err)
        setError(err instanceof Error ? err : new Error("Unknown error occurred"))
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase Connection Debug</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Checking connection...</p>
        ) : error ? (
          <div className="bg-destructive/10 p-4 rounded-md">
            <p className="text-destructive">Error: {error.message}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Authentication:</h3>
              <p>{session ? "Authenticated" : "Not authenticated"}</p>
            </div>
            <div>
              <h3 className="font-medium">Connection:</h3>
              <ul className="list-disc pl-5">
                {tables.map((table, i) => (
                  <li key={i}>{table}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

