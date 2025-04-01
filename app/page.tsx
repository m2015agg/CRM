"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading, session } = useAuth()

  useEffect(() => {
    const handleRedirect = async () => {
      console.log("=== ROOT PAGE: REDIRECT CHECK ===")
      console.log("Auth state:", { 
        isLoading, 
        hasUser: !!user, 
        hasSession: !!session 
      })

      try {
        if (!isLoading) {
          if (!user) {
            console.log("ROOT PAGE: No user found, redirecting to login")
            await router.push("/login")
            return
          }

          console.log("ROOT PAGE: User found, redirecting to dashboard")
          await router.push("/dashboard")
        }
      } catch (error) {
        console.error("ROOT PAGE: Error during redirect:", error)
        // Fallback to login page on error
        await router.push("/login")
      }
    }

    handleRedirect()
  }, [user, isLoading, session, router])

  // Show a simple loading spinner
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
    </div>
  )
}

