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
  signIn: (email: string, password: string) => Promise<void>
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
      
      // Log the exact query we're about to run
      console.log("Running query: SELECT role, full_name, avatar_url FROM users WHERE id =", userId)
      
      const { data, error } = await supabase
        .from("users")
        .select("role, full_name, avatar_url")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        console.error("Error fetching user role:", error)
        return null
      }

      console.log("Raw query response:", { data, error })
      console.log("Fetched user data:", data)
      
      if (!data) {
        console.log("No data returned from query")
        return null
      }

      console.log("User role from database:", data.role)
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
          // Set basic user data first
          setUser(session.user)
          setSession(session)

          // Then try to fetch role data
          const userData = await fetchUserRole(session.user.id)
          if (userData) {
            console.log("Setting user with role:", userData.role)
            setUser({
              ...session.user,
              role: userData.role,
              full_name: userData.full_name,
              avatar_url: userData.avatar_url,
            })
          } else {
            console.log("No role data found for user")
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

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        console.log("Initial session check:", currentSession?.user?.id)
        
        if (currentSession) {
          // Set basic user data first
          setUser(currentSession.user)
          setSession(currentSession)

          // Then try to fetch role data
          const userData = await fetchUserRole(currentSession.user.id)
          if (userData) {
            console.log("Setting initial user with role:", userData.role)
            setUser({
              ...currentSession.user,
              role: userData.role,
              full_name: userData.full_name,
              avatar_url: userData.avatar_url,
            })
          } else {
            console.log("No initial role data found for user")
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    router.refresh()
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
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

