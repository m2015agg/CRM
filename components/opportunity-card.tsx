import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface OpportunityCardProps {
  opportunity: {
    id: string
    company_name: string
    contact_name: string
    value: number
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
        return "bg-blue-50 border-blue-200"
      case "quoted":
        return "bg-amber-50 border-amber-200"
      case "accepted":
        return "bg-green-50 border-green-200"
      case "lost_deal":
        return "bg-red-50 border-red-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  // Value badge color based on amount
  const getValueColor = (value: number) => {
    if (value >= 10000) return "bg-green-100 text-green-800 hover:bg-green-200"
    if (value >= 5000) return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }

  const statusColor = getStatusColor(opportunity.status)
  const valueColor = getValueColor(opportunity.value || 0)

  return (
    <Card className={`mb-3 border-2 shadow-sm ${statusColor} ${isDragging ? "shadow-md ring-2 ring-primary/20" : ""}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-sm truncate">{opportunity.company_name}</h4>
          <Badge variant="secondary" className={`ml-2 shrink-0 ${valueColor}`}>
            {formatCurrency(opportunity.value || 0)}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground truncate">{opportunity.contact_name || "No contact"}</div>

        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-border/50">
          <span>Updated {formattedDate}</span>
        </div>
      </CardContent>
    </Card>
  )
}

