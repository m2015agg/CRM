"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import OpportunityDialog from "@/components/opportunities/opportunity-dialog"
import { getCurrentUser, getTeamMembers } from "../actions"

export default function NewOpportunityPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const { role } = await getCurrentUser()

        if (role === "admin") {
          setIsAdmin(true)
          const members = await getTeamMembers()
          setTeamMembers(members)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading data:", error)
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return <div className="flex justify-center items-center h-[50vh]">Loading...</div>
  }

  return (
    <OpportunityDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          router.push("/admin/team-opportunities")
        }
      }}
      teamMembers={isAdmin ? teamMembers : []}
      isAdmin={isAdmin}
    />
  )
}

