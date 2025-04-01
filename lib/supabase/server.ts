import { createServerComponentClient, createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"
import { createClient } from "@supabase/supabase-js"

// Create a Supabase client for server-side usage
export const getSupabaseServer = () => {
  const cookieStore = cookies()

  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
}

// Server component client
export const getSupabaseServerClient = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co"
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

    // Log warning instead of failing
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Warning: Missing Supabase environment variables in server client. Using placeholder values.")
    }

    return createServerComponentClient<Database>({
      cookies,
      options: {
        supabaseUrl,
        supabaseKey,
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "app-auth-token-server", // Use a unique storage key
          debug: false, // Disable debug logs
        },
      },
    })
  } catch (error) {
    console.error("Error creating server component client:", error)
    // Fallback to creating a client without explicit options
    return createServerComponentClient<Database>({ cookies })
  }
}

// Server action client
export const getSupabaseServerActionClient = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co"
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

    // Log warning instead of failing
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("Warning: Missing Supabase environment variables in server action client. Using placeholder values.")
    }

    return createServerActionClient<Database>({
      cookies,
      options: {
        supabaseUrl,
        supabaseKey,
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "app-auth-token-server-action", // Use a unique storage key
          debug: false, // Disable debug logs
        },
      },
    })
  } catch (error) {
    console.error("Error creating server action client:", error)
    // Fallback to creating a client without explicit options
    return createServerActionClient<Database>({ cookies })
  }
}

