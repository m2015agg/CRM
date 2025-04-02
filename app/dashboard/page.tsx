"use client"

// Import necessary dependencies
// useEffect for handling side effects and component lifecycle
// useRouter for programmatic navigation
// useAuth for accessing authentication context
// AuthLoadingScreen for displaying loading state
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"

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
    // Only proceed if authentication check is complete
    if (!isLoading) {
      // If no user is found, redirect to login page
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      // Log user information for debugging purposes
      console.log("User found:", user.email, "Role:", user.role || "unknown")

      // Role-based routing logic
      // Admin users are directed to the admin dashboard
      // Submitter users are directed to the submitter dashboard
      if (user.role === "admin") {
        router.push("/dashboard/admin")
      } else if (user.role === "submitter") {
        router.push("/dashboard/submitter")
      }
    }
  }, [user, isLoading, router]) // Dependencies array for useEffect

  // Display loading screen while authentication is being checked
  // This provides a better user experience during the authentication process
  return <AuthLoadingScreen message="Preparing your dashboard..." />
}

