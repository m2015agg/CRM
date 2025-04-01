import { createClient } from "@supabase/supabase-js"

// Create a single instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("Supabase URL:", supabaseUrl)
    console.log("Supabase Key:", supabaseKey ? "Present" : "Missing")

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables")
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return supabaseInstance
}

// For backward compatibility
export const supabase = getSupabase()

