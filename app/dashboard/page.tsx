"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        router.push("/dashboard/admin")
      } else if (user.role === "submitter") {
        router.push("/dashboard/submitter")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  return null
}

