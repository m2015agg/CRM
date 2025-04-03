import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface OpportunityCardProps {
  opportunity: {
    id: string
    title?: string
    name?: string
    company_name?: string
    client_name?: string
    description: string | null
    value: number | null
    status: string
    updated_at: string
    created_at?: string
  }
  isDragging?: boolean
}

export function OpportunityCard({ opportunity, isDragging }: OpportunityCardProps) {
  const formattedDate = opportunity.updated_at
    ? formatDistanceToNow(new Date(opportunity.updated_at), { addSuffix: true })
    : "Unknown date"

  // Status-based color mapping
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-blue-25 border-blue-200"
      case "quoted":
        return "bg-amber-25 border-amber-200"
      case "accepted":
        return "bg-green-25 border-green-200"
      case "lost_deal":
        return "bg-red-25 border-red-200"
      default:
        return "bg-gray-25 border-gray-200"
    }
  }

  // Value badge color based on amount
  const getValueColor = (value: number | null) => {
    if (!value) return "bg-gray-25 text-gray-800 hover:bg-gray-50"
    if (value >= 10000) return "bg-green-25 text-green-800 hover:bg-green-50"
    if (value >= 5000) return "bg-blue-25 text-blue-800 hover:bg-blue-50"
    return "bg-gray-25 text-gray-800 hover:bg-gray-50"
  }

  const statusColor = getStatusColor(opportunity.status)
  const valueColor = getValueColor(opportunity.value)

  // Get the title and company name, handling both old and new field names
  const title = opportunity.title || opportunity.name || "Untitled"
  const companyName = opportunity.company_name || opportunity.client_name || "No Company"

  return (
    <Card className={`${isDragging ? "opacity-50" : ""}`}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{companyName}</p>
            </div>
            <Badge variant="outline">{opportunity.status}</Badge>
          </div>
          {opportunity.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{opportunity.description}</p>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {opportunity.value ? formatCurrency(opportunity.value) : "No value"}
            </span>
            <span className="text-muted-foreground">
              Updated {formattedDate}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

