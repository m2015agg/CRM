"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"

export function BasicOpportunitiesList() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])

  const addLog = (message) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1]}: ${message}`])
    console.log(message)
  }

  useEffect(() => {
    addLog("Component mounted")

    const fetchData = async () => {
      try {
        addLog("Starting to fetch opportunities")
        const supabase = getSupabase()
        addLog("Supabase client initialized")

        const { data, error } = await supabase.from("opportunities").select("*").limit(5)

        if (error) {
          addLog(`Error fetching opportunities: ${error.message}`)
          throw error
        }

        addLog(`Successfully fetched ${data?.length || 0} opportunities`)
        setOpportunities(data || [])
      } catch (err) {
        addLog(`Caught error: ${err.message || "Unknown error"}`)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-100 rounded-md">
        <h3 className="font-medium mb-2">Debug Logs:</h3>
        <pre className="text-xs bg-black text-white p-2 rounded overflow-auto max-h-40">{logs.join("\n")}</pre>
      </div>

      {loading ? (
        <div className="p-4 bg-blue-50 text-blue-500 rounded-md">Loading opportunities...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-500 rounded-md">Error: {error.message || "Unknown error"}</div>
      ) : (
        <div>
          <h3 className="font-medium mb-2">Opportunities ({opportunities.length}):</h3>
          <ul className="space-y-2">
            {opportunities.map((opp) => (
              <li key={opp.id} className="p-2 bg-gray-50 rounded">
                {opp.company_name} - {opp.status}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

