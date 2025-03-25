import { createServerComponentClient, createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export const getSupabaseServerClient = () => {
  try {
    return createServerComponentClient<Database>({
      cookies,
      options: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    })
  } catch (error) {
    console.error("Error creating server component client:", error)
    // Fallback to creating a client without explicit options
    return createServerComponentClient<Database>({ cookies })
  }
}

export const getSupabaseServerActionClient = () => {
  try {
    return createServerActionClient<Database>({
      cookies,
      options: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      },
    })
  } catch (error) {
    console.error("Error creating server action client:", error)
    // Fallback to creating a client without explicit options
    return createServerActionClient<Database>({ cookies })
  }
}

