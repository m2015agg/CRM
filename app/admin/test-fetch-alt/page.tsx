"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

export default function TestFetchAltPage() {
  const [logs, setLogs] = useState(["Page loaded at " + new Date().toISOString()])
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const addLog = (message) => {
    console.log(message)
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  useEffect(() => {
    addLog("Component mounted")

    // Create a new Supabase client directly with URL and key
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    addLog("Supabase client created with URL and key")

    const fetchData = async () => {
      try {
        addLog("Starting to fetch opportunities")

        const { data, error } = await supabase.from("opportunities").select("*").limit(5)

        if (error) {
          addLog(`Error fetching opportunities: ${error.message}`)
          setError(error)
          return
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Fetch Alt Page</h1>

      <div className="mb-4 p-4 bg-gray-100 rounded-md">
        <h2 className="font-medium mb-2">Debug Logs:</h2>
        <pre className="text-xs bg-black text-white p-2 rounded overflow-auto max-h-60">{logs.join("\n")}</pre>
      </div>

      <div className="mb-4">
        <h2 className="font-medium mb-2">Status:</h2>
        {loading ? (
          <div className="p-2 bg-blue-50 text-blue-500 rounded">Loading...</div>
        ) : error ? (
          <div className="p-2 bg-red-50 text-red-500 rounded">Error: {error.message || "Unknown error"}</div>
        ) : (
          <div className="p-2 bg-green-50 text-green-500 rounded">Data loaded successfully!</div>
        )}
      </div>

      {!loading && !error && (
        <div>
          <h2 className="font-medium mb-2">Opportunities ({opportunities.length}):</h2>
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

