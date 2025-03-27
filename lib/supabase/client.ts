import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

// Create a single instance of the Supabase client
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

// Use a proper singleton pattern with a global variable
export const getSupabaseClient = () => {
  // If we already have a client instance, return it
  if (supabaseClient) return supabaseClient

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    // Server-side initialization
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

    // Log warning instead of throwing error
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Warning: Missing Supabase environment variables. Using placeholder values.")
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Don't persist session on server
      },
    })
  } else {
    // Client-side initialization
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

    // Log warning instead of throwing error
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Warning: Missing Supabase environment variables. Using placeholder values.")
    }

    // Create the client only once
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "app-auth-token", // Use a consistent storage key
      },
    })
  }

  return supabaseClient
}

// Export a direct instance for components that need it
export const supabase = getSupabaseClient()

