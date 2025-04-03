"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { getSupabase } from "@/lib/supabase"

// Define the status columns based on the actual values in the database
const statusColumns = ["new", "quoted", "accepted", "lost_deal"]

// Define a mapping for display names
const statusDisplayNames = {
  new: "New Lead",
  quoted: "Proposal Sent",
  accepted: "Won",
  lost_deal: "Lost",
}

export function SimpleKanbanDisplay() {
  const { userDetails, loading: loadingAuth } = useAuth()
  const [opportunities, setOpportunities] = useState([])
  const [loadingOpportunities, setLoadingOpportunities] = useState(true)
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

        const { data, error } = await supabase
          .from("opportunities")
          .select("*")
          .order("updated_at", { ascending: false })

        if (error) {
          addLog(`Error fetching opportunities: ${error.message}`)
          throw error
        }

        addLog(`Fetched ${data.length} opportunities`)

        // Log the first opportunity to see its structure
        if (data && data.length > 0) {
          addLog(`First opportunity: ${JSON.stringify(data[0])}`)
        }

        setOpportunities(data || [])
      } catch (err) {
        addLog(`Error in fetchOpportunities: ${err.message}`)
        setError(err)
      } finally {
        setLoadingOpportunities(false)
      }
    }

    fetchOpportunities()
  }, [userDetails])

  // Group opportunities by status
  const opportunitiesByStatus = {}

  // Initialize all status columns with empty arrays
  statusColumns.forEach((status) => {
    opportunitiesByStatus[status] = []
  })

  // Group opportunities by status
  opportunities.forEach((opp) => {
    const status = opp.status

    // Check if the status is one of our defined columns
    if (statusColumns.includes(status)) {
      opportunitiesByStatus[status].push(opp)
    } else {
      // If not, log it for debugging
      addLog(`Opportunity with unknown status: ${status}`)
    }
  })

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
        <h3 className="font-medium mb-2">Raw Opportunities Data:</h3>
        <div className="text-xs font-mono h-32 overflow-y-auto bg-background p-2 rounded border">
          <pre>{JSON.stringify(opportunities, null, 2)}</pre>
        </div>
      </div>

      {loadingOpportunities ? (
        <div className="p-4 bg-muted rounded-md">Loading opportunities...</div>
      ) : error ? (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 rounded-md">
          Error: {error.message}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((status) => (
            <div key={status} className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{statusDisplayNames[status] || status}</h3>
                <Badge variant="outline">{opportunitiesByStatus[status]?.length || 0}</Badge>
              </div>
              <div className="bg-muted/50 rounded-md p-2 min-h-[200px]">
                {opportunitiesByStatus[status]?.map((opp) => (
                  <Card key={opp.id} className="mb-2">
                    <CardContent className="p-3 space-y-2">
                      <div className="font-medium truncate">{opp.company_name}</div>
                      <div className="text-sm text-muted-foreground truncate">{opp.contact_name}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{formatCurrency(opp.value || 0)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

