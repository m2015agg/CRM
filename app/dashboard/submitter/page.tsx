"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"

export default function SubmitterDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      if (user.role !== "submitter") {
        console.log("User is not a submitter, redirecting to login")
        router.push("/login")
        return
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Submitter Dashboard</h1>
      {/* Add your submitter dashboard content here */}
    </div>
  )
}

