import { getSupabaseClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

export class BaseService {
  protected supabase: SupabaseClient<Database>

  constructor() {
    this.supabase = getSupabaseClient()
  }

  /**
   * Get the current user ID
   * @returns The user ID or throws an error if not authenticated
   */
  protected async getCurrentUserId(): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser()

    if (error || !data.user) {
      throw new Error("User not authenticated")
    }

    return data.user.id
  }

  /**
   * Format a date for database storage
   * @param date Date to format
   * @returns Formatted date string (YYYY-MM-DD)
   */
  protected formatDate(date: Date | string): string {
    if (typeof date === "string") {
      return date
    }

    return date.toISOString().split("T")[0]
  }

  /**
   * Handle Supabase errors consistently
   * @param error The error to handle
   * @param operation Description of the operation that failed
   */
  protected handleError(error: any, operation: string): never {
    console.error(`Error in ${operation}:`, error)

    // Customize error message based on error type
    if (error?.code === "23505") {
      throw new Error(`Duplicate entry: ${error.details || error.message}`)
    }

    if (error?.code === "PGRST116") {
      throw new Error("Record not found")
    }

    throw new Error(`Failed to ${operation}: ${error?.message || "Unknown error"}`)
  }
}

