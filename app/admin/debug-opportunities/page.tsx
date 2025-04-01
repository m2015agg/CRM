import { DebugOpportunities } from "@/components/debug-opportunities"
import { DarkModeToggle } from "@/components/dark-mode-toggle"

export default function DebugOpportunitiesPage() {
  return (
    <div className="space-y-4 p-4 bg-background text-foreground min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Debug Opportunities</h1>
        <DarkModeToggle />
      </div>
      <DebugOpportunities />
    </div>
  )
}

