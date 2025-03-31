"use client"

import { useSimpleOpportunities } from "@/hooks/use-simple-opportunities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export function SimpleOpportunitiesList() {
  const { opportunities, loading, error } = useSimpleOpportunities()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">Loading opportunities...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    )
  }

  if (opportunities.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">No opportunities found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Found {opportunities.length} opportunities</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{opportunity.company_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{opportunity.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-medium">{formatCurrency(opportunity.value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{new Date(opportunity.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

