import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Create a single instance of the Supabase client for the entire application
export const supabase = createClientComponentClient<Database>()

// For cases where we need to get a fresh instance (should be rare)
export function getSupabase() {
  return supabase
}

