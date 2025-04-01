"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, session, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    const handleRedirect = async () => {
      console.log("=== LOGIN PAGE: AUTH CHECK ===")
      console.log("Auth state:", { 
        isLoading: authLoading, 
        hasSession: !!session 
      })

      if (!authLoading && session) {
        console.log("LOGIN PAGE: Session found, redirecting to dashboard")
        try {
          await router.push("/dashboard")
        } catch (error) {
          console.error("LOGIN PAGE: Error during redirect:", error)
        }
      }
    }

    handleRedirect()
  }, [session, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== LOGIN FORM: SUBMISSION START ===")
    setIsLoading(true)
    setError(null)

    try {
      console.log("LOGIN FORM: Attempting to sign in with email:", email)
      console.log("LOGIN FORM: Auth context state:", { 
        isLoading: authLoading, 
        hasSession: !!session,
        hasUser: !!session?.user
      })

      // Log the Supabase URL and key presence
      console.log("LOGIN FORM: Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log("LOGIN FORM: Supabase Key present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

      const { error } = await signIn(email, password)

      if (error) {
        console.error("❌ LOGIN FORM: Sign in error:", error)
        setError(`Authentication error: ${error.message}`)
        setIsLoading(false)
        return
      }

      console.log("✅ LOGIN FORM: Sign in successful")
      console.log("LOGIN FORM: Current session state:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        userEmail: session?.user?.email
      })

      // Wait a moment for the session to be properly set
      await new Promise(resolve => setTimeout(resolve, 100))

      console.log("LOGIN FORM: Redirecting to dashboard")
      await router.push("/dashboard")
    } catch (err) {
      console.error("❌ LOGIN FORM: Unexpected error:", err)
      if (err instanceof Error) {
        console.error("❌ LOGIN FORM: Error stack:", err.stack)
      }
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
      console.log("=== LOGIN FORM: SUBMISSION COMPLETE ===")
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

