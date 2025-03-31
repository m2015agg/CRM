"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { getSupabase } from "@/lib/supabase"

export function DebugOpportunities() {
  const { userDetails, loading: loadingAuth } = useAuth()
  const [opportunities, setOpportunities] = useState([])
  const [loadingOpportunities, setLoadingOpportunities] = useState(true)
  const [adminCheck, setAdminCheck] = useState(null)
  const [loadingAdminCheck, setLoadingAdminCheck] = useState(false)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])

  const supabase = getSupabase()

  // Add a log entry
  const addLog = (message) => {
    const timestamp = new Date().toISOString()
    console.log(`${timestamp}: ${message}`)
    setLogs((prev) => [...prev, { timestamp, message }])
  }

  // Fetch opportunities
  useEffect(() => {
    if (!userDetails) return

    const fetchOpportunities = async () => {
      try {
        addLog("Fetching opportunities...")
        setLoadingOpportunities(true)

        // Now let's try to fetch opportunities
        const { data, error, status, statusText } = await supabase.from("opportunities").select("*").limit(10)

        addLog(`Query status: ${status} ${statusText}`)

        if (error) {
          addLog(`Error fetching opportunities: ${error.message}`)
          throw error
        }

        if (data) {
          addLog(`Fetched ${data.length} opportunities`)
          setOpportunities(data)
        } else {
          addLog("No data returned")
          setOpportunities([])
        }
      } catch (err) {
        addLog(`Error in fetchOpportunities: ${err.message}`)
        setError(err)
      } finally {
        setLoadingOpportunities(false)
      }
    }

    fetchOpportunities()
  }, [userDetails])

  const checkWithAdmin = async () => {
    try {
      setLoadingAdminCheck(true)
      addLog("Checking opportunities with admin privileges...")

      const response = await fetch("/api/check-opportunities")
      const data = await response.json()

      addLog(`Admin check result: ${JSON.stringify(data)}`)
      setAdminCheck(data)
    } catch (err) {
      addLog(`Admin check error: ${err.message}`)
      setError(err)
    } finally {
      setLoadingAdminCheck(false)
    }
  }

  if (loadingAuth) {
    return <div className="p-4 text-foreground">Loading authentication...</div>
  }

  if (!userDetails) {
    return <div className="p-4 text-red-500">You must be logged in to view this page.</div>
  }

  return (
    <div className="space-y-6 text-foreground">
      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">Debug Logs:</h3>
        <div className="text-xs font-mono h-32 overflow-y-auto bg-background p-2 rounded border">
          {logs.map((log, i) => (
            <div key={i}>
              <span className="text-muted-foreground">{log.timestamp.substring(11, 19)}</span>: {log.message}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">User Details:</h3>
        <pre className="text-xs font-mono bg-background p-2 rounded border overflow-x-auto">
          {JSON.stringify(userDetails, null, 2)}
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

