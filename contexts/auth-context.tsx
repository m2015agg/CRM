"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

type UserWithRole = User & {
  role?: string
  full_name?: string
  avatar_url?: string | null
}

interface AuthContext {
  user: UserWithRole | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContext | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching role for user:", userId)
      
      const { data, error } = await supabase
        .from("users")
        .select("role, full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        console.error("Error fetching user role:", error)
        return null
      }

      if (!data) {
        console.log("No data returned from query")
        return null
      }

      return data
    } catch (error) {
      console.error("Error in fetchUserRole:", error)
      return null
    }
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id)
      if (session) {
        try {
          setUser(session.user)
          setSession(session)

          const userData = await fetchUserRole(session.user.id)
          if (userData) {
            setUser({
              ...session.user,
              role: userData.role,
              full_name: userData.full_name,
              avatar_url: userData.avatar_url,
            })
          }
        } catch (error) {
          console.error("Error in auth state change:", error)
          setUser(session.user)
          setSession(session)
        }
      } else {
        setUser(null)
        setSession(null)
      }
      setIsLoading(false)
    })

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setUser(session.user)
          setSession(session)

          const userData = await fetchUserRole(session.user.id)
          if (userData) {
            setUser({
              ...session.user,
              role: userData.role,
              full_name: userData.full_name,
              avatar_url: userData.avatar_url,
            })
          }
        }
      } catch (error) {
        console.error("Error in initial session check:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { error }
      }

      if (data.session) {
        // Fetch user role to determine redirect path
        const userData = await fetchUserRole(data.session.user.id)
        
        // Set the user data first
        setUser({
          ...data.session.user,
          role: userData?.role,
          full_name: userData?.full_name,
          avatar_url: userData?.avatar_url,
        })
        setSession(data.session)

        // Then redirect based on role
        if (userData?.role === "admin") {
          await router.push("/dashboard/admin")
        } else {
          await router.push("/dashboard/submitter")
        }
      }

      return { error: null }
    } catch (error) {
      console.error("Unexpected error during sign in:", error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error during sign out:", error)
      router.push("/login")
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

