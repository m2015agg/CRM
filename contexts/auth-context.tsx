"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

type UserWithRole = User & {
  role?: "admin" | "submitter"
  full_name?: string
  avatar_url?: string | null
}

interface AuthContextType {
  user: UserWithRole | null
  session: Session | null
  isLoading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
  }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Local storage keys for caching user data
const USER_CACHE_KEY = "auth:user-cache"
const SESSION_CACHE_KEY = "auth:session-cache"
const CACHE_EXPIRY_KEY = "auth:cache-expiry"
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Helper to save user data to local storage
const cacheUserData = (user: UserWithRole | null, session: Session | null) => {
  if (typeof window === "undefined") return

  if (user && session) {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session))
    localStorage.setItem(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION))
  } else {
    localStorage.removeItem(USER_CACHE_KEY)
    localStorage.removeItem(SESSION_CACHE_KEY)
    localStorage.removeItem(CACHE_EXPIRY_KEY)
  }
}

// Helper to get cached user data
const getCachedUserData = (): { user: UserWithRole | null; session: Session | null } => {
  if (typeof window === "undefined") return { user: null, session: null }

  try {
    const expiryStr = localStorage.getItem(CACHE_EXPIRY_KEY)
    if (!expiryStr) return { user: null, session: null }

    const expiry = Number.parseInt(expiryStr, 10)
    if (Date.now() > expiry) {
      // Cache expired
      localStorage.removeItem(USER_CACHE_KEY)
      localStorage.removeItem(SESSION_CACHE_KEY)
      localStorage.removeItem(CACHE_EXPIRY_KEY)
      return { user: null, session: null }
    }

    const userStr = localStorage.getItem(USER_CACHE_KEY)
    const sessionStr = localStorage.getItem(SESSION_CACHE_KEY)

    if (!userStr || !sessionStr) return { user: null, session: null }

    return {
      user: JSON.parse(userStr) as UserWithRole,
      session: JSON.parse(sessionStr) as Session,
    }
  } catch (error) {
    console.error("Error reading user cache:", error)
    return { user: null, session: null }
  }
}

// Create a single instance of the Supabase client for the auth context
// This is important to prevent multiple GoTrueClient instances
const supabase = getSupabaseClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const fetchSession = async () => {
      try {
        console.log("Auth context: Fetching session")
        setIsLoading(true)

        // Check for cached data first
        const { user: cachedUser, session: cachedSession } = getCachedUserData()
        if (cachedUser && cachedSession && isMounted) {
          console.log("Auth context: Using cached user data")
          setUser(cachedUser)
          setSession(cachedSession)
          // Don't set isLoading to false yet - we'll still verify with the server
        }

        // Get the current session
        try {
          const {
            data: { session: currentSession },
            error: sessionError,
          } = await supabase.auth.getSession()

          if (sessionError) {
            console.error("Auth context: Error fetching session:", sessionError)
            if (isMounted) setIsLoading(false)
            return
          }

          if (!currentSession) {
            console.log("Auth context: No session found")
            if (isMounted) {
              setSession(null)
              setUser(null)
              cacheUserData(null, null)
              setIsLoading(false)
            }
            return
          }

          console.log("Auth context: Session found, user ID:", currentSession.user.id)
          if (isMounted) setSession(currentSession)

          // Fetch user data
          try {
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("role, full_name, avatar_url")
              .eq("id", currentSession.user.id)
              .single()

            if (userError) {
              console.error("Auth context: Error fetching user data:", userError)

              // If we have cached data and there's a network error, use the cached data
              if (cachedUser && cachedSession && isMounted) {
                console.log("Auth context: Using cached user data due to fetch error")
                // We already set the user from cache, just update loading state
                setIsLoading(false)
                return
              }

              if (isMounted) {
                // Still set the basic user info even if we couldn't get the role
                const basicUser = currentSession.user
                setUser(basicUser)
                cacheUserData(basicUser, currentSession)
                setIsLoading(false)
              }
              return
            }

            if (userData && isMounted) {
              console.log("Auth context: User data found, role:", userData.role)
              const fullUser = {
                ...currentSession.user,
                role: userData.role,
                full_name: userData.full_name,
                avatar_url: userData.avatar_url,
              }
              setUser(fullUser)
              cacheUserData(fullUser, currentSession)
              setIsLoading(false)
            }
          } catch (err) {
            console.error("Auth context: Error in user data fetch:", err)

            // If we have cached data and there's a network error, use the cached data
            if (cachedUser && cachedSession && isMounted) {
              console.log("Auth context: Using cached user data due to fetch error")
              // We already set the user from cache, just update loading state
              setIsLoading(false)
              return
            }

            if (isMounted) {
              // Still set the basic user info even if we couldn't get the role
              const basicUser = currentSession.user
              setUser(basicUser)
              cacheUserData(basicUser, currentSession)
              setIsLoading(false)
            }
          }
        } catch (err) {
          console.error("Auth context: Error in session fetch:", err)

          // If we have cached data and there's a network error, use the cached data
          if (cachedUser && cachedSession && isMounted) {
            console.log("Auth context: Using cached user data due to fetch error")
            // We already set the user from cache, just update loading state
            setIsLoading(false)
          } else if (isMounted) {
            setIsLoading(false)
          }
        }
      } catch (err) {
        console.error("Auth context: Unexpected error in fetchSession:", err)
        if (isMounted) setIsLoading(false)
      }
    }

    fetchSession()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth context: Auth state changed:", event)

      if (isMounted) setSession(newSession)

      if (!newSession) {
        if (isMounted) {
          setUser(null)
          cacheUserData(null, null)
        }
        return
      }

      try {
        // Fetch user role from the users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, full_name, avatar_url")
          .eq("id", newSession.user.id)
          .single()

        if (userError) {
          console.error("Auth context: Error fetching user data on auth change:", userError)
          if (isMounted) {
            const basicUser = newSession.user
            setUser(basicUser)
            cacheUserData(basicUser, newSession)
          }
        } else if (userData && isMounted) {
          const fullUser = {
            ...newSession.user,
            role: userData.role,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
          }
          setUser(fullUser)
          cacheUserData(fullUser, newSession)
        }
      } catch (err) {
        console.error("Auth context: Unexpected error in auth change handler:", err)
        if (isMounted) {
          const basicUser = newSession.user
          setUser(basicUser)
          cacheUserData(basicUser, newSession)
        }
      }
    })

    // Cleanup function
    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [router])

  const signIn = async (email: string, password: string) => {
    console.log("Auth context: Attempting to sign in with email:", email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Auth context: Sign in error:", error)
        return { error }
      }

      console.log("Auth context: Sign in successful, session:", data.session ? "exists" : "null")
      return { error: null }
    } catch (err) {
      console.error("Auth context: Unexpected error during sign in:", err)
      return { error: err as Error }
    }
  }

  const signOut = async () => {
    console.log("Auth context: Signing out")

    try {
      // First, clear the local state
      setUser(null)
      setSession(null)

      // Clear cached user data
      cacheUserData(null, null)

      // Clear any other auth-related items in localStorage
      if (typeof window !== "undefined") {
        // Clear any Supabase-specific items
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
            localStorage.removeItem(key)
          }
        }
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Auth context: Error during sign out from Supabase:", error)
      }

      // Force a page reload to clear any in-memory state
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      } else {
        router.push("/login")
      }
    } catch (err) {
      console.error("Auth context: Error during sign out:", err)

      // Even if there's an error, clear the user state and redirect
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      } else {
        router.push("/login")
      }
    }
  }

  return <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

