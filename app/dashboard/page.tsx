"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      console.log("User found:", user.email, "Role:", user.role || "unknown")

      // Redirect based on role
      if (user.role === "admin") {
        router.push("/dashboard/admin")
      } else if (user.role === "submitter") {
        router.push("/dashboard/submitter")
      }
    }
  }, [user, isLoading, router])

  // Show a nicer loading state while checking authentication
  return <AuthLoadingScreen message="Preparing your dashboard..." />
}

