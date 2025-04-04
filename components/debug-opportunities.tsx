"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

interface LogEntry {
  timestamp: string
  message: string
}

interface Opportunity {
  id: string
  [key: string]: any
}

export function DebugOpportunities() {
  const { user, isLoading: loadingAuth } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loadingOpportunities, setLoadingOpportunities] = useState(true)
  const [adminCheck, setAdminCheck] = useState<any>(null)
  const [loadingAdminCheck, setLoadingAdminCheck] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Add a log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString()
    console.log(`${timestamp}: ${message}`)
    setLogs((prev) => [...prev, { timestamp, message }])
  }

  // Fetch opportunities
  useEffect(() => {
    if (!user) return

    const fetchOpportunities = async () => {
      try {
        addLog("Fetching opportunities...")
        setLoadingOpportunities(true)

        // Build the query based on user role
        let query = supabase.from("opportunities").select("*").limit(10)
        
        // Log the user role and query conditions
        addLog(`User role: ${user.role || 'not set'}`)
        
        if (user.role === 'submitter') {
          addLog(`Filtering by owner_id: ${user.id}`)
          query = query.eq("owner_id", user.id)
        } else if (user.role === 'admin') {
          addLog("Admin user - no owner_id filter applied")
        }

        // Execute the query
        const { data, error, status, statusText } = await query

        addLog(`Query status: ${status} ${statusText}`)

        if (error) {
          addLog(`Error fetching opportunities: ${error.message}`)
          throw error
        }

        if (data) {
          addLog(`Fetched ${data.length} opportunities`)
          if (data.length > 0) {
            addLog(`First opportunity: ${JSON.stringify(data[0])}`)
          }
          setOpportunities(data as Opportunity[])
        } else {
          addLog("No data returned")
          setOpportunities([])
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        const finalError = new Error(errorMessage)
        addLog(`Error in fetchOpportunities: ${errorMessage}`)
        setError(finalError)
      } finally {
        setLoadingOpportunities(false)
      }
    }

    fetchOpportunities()
  }, [user])

  const checkWithAdmin = async () => {
    try {
      setLoadingAdminCheck(true)
      addLog("Checking opportunities with admin privileges...")

      const response = await fetch("/api/check-opportunities")
      const data = await response.json()

      addLog(`Admin check result: ${JSON.stringify(data)}`)
      setAdminCheck(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      addLog(`Admin check error: ${errorMessage}`)
      setError(new Error(errorMessage))
    } finally {
      setLoadingAdminCheck(false)
    }
  }

  if (loadingAuth) {
    return <div className="p-4 text-foreground">Loading authentication...</div>
  }

  if (!user) {
    return <div className="p-4 text-red-500">You must be logged in to view this page.</div>
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-100 rounded-md">
        <h3 className="font-medium mb-2">Debug Information:</h3>
        <div className="space-y-2">
          <p>Auth Status: {loadingAuth ? "Loading..." : user ? "Authenticated" : "Not authenticated"}</p>
          {user && (
            <>
              <p>User ID: {user.id}</p>
              <p>User Role: {user.role || "Not set"}</p>
              <p>User Email: {user.email}</p>
            </>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-100 rounded-md">
        <h3 className="font-medium mb-2">Debug Logs:</h3>
        <pre className="text-xs bg-black text-white p-2 rounded overflow-auto max-h-40">
          {logs.map((log, i) => (
            `${log.timestamp}: ${log.message}\n`
          ))}
        </pre>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">Check with Admin Privileges:</h3>
        <Button onClick={checkWithAdmin} disabled={loadingAdminCheck} className="mb-4">
          {loadingAdminCheck ? "Checking..." : "Check Opportunities as Admin"}
        </Button>

        {adminCheck && (
          <div className="space-y-2">
            <div className="font-medium">Total Opportunities: {adminCheck.count}</div>
            {adminCheck.sample && (
              <div>
                <div className="font-medium">Sample Opportunities:</div>
                <pre className="text-xs font-mono bg-background p-2 rounded border overflow-x-auto">
                  {JSON.stringify(adminCheck.sample, null, 2)}
                </pre>
              </div>
            )}
            {adminCheck.error && <div className="text-red-500">Error: {adminCheck.error}</div>}
          </div>
        )}
      </div>

      {loadingOpportunities ? (
        <div className="p-4 bg-muted rounded-md">Loading opportunities...</div>
      ) : error ? (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 rounded-md">
          Error: {error.message}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-medium">Raw Opportunities Data ({opportunities.length}):</h3>
          {opportunities.length === 0 ? (
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-md">
              No opportunities found. This could be due to:
              <ul className="list-disc ml-5 mt-2">
                <li>No opportunities exist in the database</li>
                <li>RLS policies are preventing access</li>
                <li>There's an issue with the query</li>
              </ul>
            </div>
          ) : (
            <div className="bg-background p-4 rounded-md border overflow-x-auto">
              <pre className="text-xs font-mono">{JSON.stringify(opportunities, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

