"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function CheckRLS() {
  const [policies, setPolicies] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const checkPolicies = async () => {
    try {
      setLoading(true)

      // We need to use a server function to check policies
      // This is just a placeholder - you'll need to implement this
      // in a server action or API route
      const response = await fetch("/api/check-rls")
      const data = await response.json()

      setPolicies(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium mb-4">Check RLS Policies</h3>
        <Button onClick={checkPolicies} disabled={loading}>
          {loading ? "Checking..." : "Check Policies"}
        </Button>

        {error && <div className="mt-4 p-2 bg-red-50 text-red-500 rounded">Error: {error}</div>}

        {policies && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Policies:</h4>
            <pre className="text-xs font-mono bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(policies, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

