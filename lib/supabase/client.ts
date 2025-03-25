"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

// Create a singleton Supabase client
let supabaseInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    },
  })

  return supabaseInstance
}

// Helper function to retry a Supabase operation with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000,
  operationName = "Supabase operation",
): Promise<T> {
  let retries = 0
  let lastError: any

  while (retries < maxRetries) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      retries++

      // Log detailed error information
      console.error(`${operationName} failed (attempt ${retries}/${maxRetries}):`, error)

      if (retries >= maxRetries) break

      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(2, retries - 1) * (0.5 + Math.random() * 0.5)
      console.log(`${operationName} failed, retrying in ${Math.round(delay)}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Check if the network is online
export const isOnline = () => {
  return typeof navigator !== "undefined" && navigator.onLine
}

