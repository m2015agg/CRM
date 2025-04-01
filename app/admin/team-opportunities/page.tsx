import { getOpportunities, getTeamMembers } from "./actions"
import TeamOpportunitiesTable from "./team-opportunities-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default async function TeamOpportunitiesPage() {
  const { opportunities, userRole } = await getOpportunities()
  const teamMembers = userRole === "admin" ? await getTeamMembers() : []

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Opportunities</h1>
        <Button asChild>
          <Link href="/admin/team-opportunities/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Opportunity
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <TeamOpportunitiesTable opportunities={opportunities} teamMembers={teamMembers} userRole={userRole} />
      </div>
    </div>
  )
}

