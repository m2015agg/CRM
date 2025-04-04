"use client"

// Import necessary dependencies
// useEffect for handling side effects and component lifecycle
// useRouter for programmatic navigation
// useAuth for accessing authentication context
// AuthLoadingScreen for displaying loading state
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { DebugOpportunities } from "@/components/debug-opportunities"

/**
 * DashboardPage Component
 * 
 * This is the main dashboard entry point that handles role-based routing.
 * It checks the user's authentication status and role, then redirects them
 * to the appropriate dashboard (admin or submitter).
 */
export default function DashboardPage() {
  // Get user authentication state and loading status from auth context
  const { user, isLoading } = useAuth()
  // Initialize router for navigation
  const router = useRouter()

  // Effect hook to handle authentication and routing logic
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace("/login")
      } else if (user.role === "admin") {
        router.replace("/dashboard/admin")
      } else if (user.role === "submitter") {
        router.replace("/dashboard/submitter")
      } else {
        // If user has no role or an unknown role, show a message
        console.log("User has no role or unknown role:", user.role)
      }
    }
  }, [user, isLoading, router]) // Dependencies array for useEffect

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <DebugOpportunities />
    </div>
  )
}

