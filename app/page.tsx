"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"

export default function Home() {
  const router = useRouter()
  const { session, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (session) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [session, isLoading, router])

  // Show a nicer loading state while checking authentication
  return <AuthLoadingScreen message="Loading application..." />
}

