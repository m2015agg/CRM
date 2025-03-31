import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a singleton Supabase client for client-side usage
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Make sure environment variables are properly set.", {
      url: supabaseUrl ? "defined" : "undefined",
      key: supabaseAnonKey ? "defined" : "undefined",
    })

    // In development, provide fallback values to prevent crashes
    // These should be removed in production
    if (process.env.NODE_ENV === "development") {
      supabaseClient = createClient(
        supabaseUrl || "https://your-project.supabase.co",
        supabaseAnonKey || "public-anon-key-placeholder",
      )
      return supabaseClient
    }

    throw new Error("Supabase configuration is missing. Check your environment variables.")
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

