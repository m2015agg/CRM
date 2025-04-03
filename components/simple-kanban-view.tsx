"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSupabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/utils"

export function SimpleKanbanView() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingStage, setLoadingStage] = useState("initializing")

  const supabase = getSupabase()

  // Define the status columns
  const statusColumns = ["New Lead", "Contacted", "Proposal", "Negotiation", "Won", "Lost"]

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoadingStage("fetching")
        console.log("SimpleKanbanView: Fetching opportunities...")

        const { data, error } = await supabase
          .from("opportunities")
          .select("*")
          .order("updated_at", { ascending: false })

        if (error) {
          console.error("SimpleKanbanView: Error fetching opportunities:", error)
          throw error
        }

        console.log(`SimpleKanbanView: Fetched ${data?.length || 0} opportunities`)
        setOpportunities(data || [])
        setLoadingStage("complete")
      } catch (err) {
        console.error("SimpleKanbanView: Error in fetchOpportunities:", err)
        setError(err)
        setLoadingStage("error")
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunities()
  }, [])

  // Group opportunities by status
  const opportunitiesByStatus = statusColumns.reduce((acc, status) => {
    acc[status] = opportunities.filter((opp) => opp.status === status)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 text-blue-500 rounded-md">Loading opportunities... (Stage: {loadingStage})</div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        Error loading opportunities: {error.message || "Unknown error"}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusColumns.map((status) => (
          <div key={status} className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{status}</h3>
              <Badge variant="outline">{opportunitiesByStatus[status]?.length || 0}</Badge>
            </div>
            <div className="bg-gray-50 rounded-md p-2 min-h-[300px]">
              {opportunitiesByStatus[status]?.map((opp) => (
                <Card key={opp.id} className="mb-2">
                  <CardContent className="p-3 space-y-2">
                    <div className="font-medium truncate">{opp.company_name}</div>
                    <div className="text-sm text-muted-foreground truncate">{opp.contact_name}</div>
                    <div>
                      <span className="text-sm font-medium">{formatCurrency(opp.value || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

