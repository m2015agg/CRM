"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  // This will show briefly before the role-based redirect happens
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Redirecting to your dashboard...</p>

            {user && (
              <div className="border p-4 rounded-md">
                <h3 className="font-medium">User Information:</h3>
                <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto text-sm">
                  {JSON.stringify(
                    {
                      id: user.id,
                      email: user.email,
                      role: user.role,
                      full_name: user.full_name,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

