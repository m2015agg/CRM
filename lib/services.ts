import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"
import { format } from "date-fns"
import { deleteFile } from "@/lib/storage-utils"

// Define types for all database tables
type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"]
type CallNote = Database["public"]["Tables"]["call_notes"]["Row"]
type Expense = Database["public"]["Tables"]["expenses"]["Row"]
type User = Database["public"]["Tables"]["users"]["Row"]

// Helper functions
const getCurrentUserId = async () => {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error("User not authenticated")
  }

  return data.user.id
}

const formatDate = (date: Date | string): string => {
  return format(new Date(date), "yyyy-MM-dd")
}

// Daily Report Service
interface DailyReportOptions {
  userId?: string
  startDate?: Date | string
  endDate?: Date | string
  limit?: number
  offset?: number
}

const dailyReportService = {
  async getByDate(date: Date | string, userId?: string) {
    try {
      const formattedDate = typeof date === "string" ? date : formatDate(date)
      console.log("Looking for report with date:", formattedDate, "and userId:", userId)
      
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("report_date", formattedDate)
        .eq("submitter_id", userId)
        .maybeSingle()

      if (error) {
        console.error("Error fetching daily report:", error)
        throw error
      }

      if (data) {
        console.log("Found report:", data)
      } else {
        console.log("No report found for date:", formattedDate)
      }

      return data || null
    } catch (error) {
      console.error("Error in getByDate:", error)
      throw error
    }
  },

  async getAll(options: DailyReportOptions = {}) {
    try {
      let query = supabase
        .from("daily_reports")
        .select("*")
        .order("report_date", { ascending: false })

      if (options.userId) {
        query = query.eq("submitter_id", options.userId)
      }

      if (options.startDate) {
        query = query.gte("report_date", formatDate(options.startDate))
      }

      if (options.endDate) {
        query = query.lte("report_date", formatDate(options.endDate))
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching daily reports:", error)
      throw error
    }
  },

  async create(data: any) {
    try {
      const { data: result, error } = await supabase
        .from("daily_reports")
        .insert([data])
        .select()
        .single()

      if (error) {
        throw error
      }

      return result
    } catch (error) {
      console.error("Error creating daily report:", error)
      throw error
    }
  },

  async update(id: string, data: any) {
    try {
      const { data: result, error } = await supabase
        .from("daily_reports")
        .update(data)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return result
    } catch (error) {
      console.error("Error updating daily report:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase.from("daily_reports").delete().eq("id", id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Error deleting daily report:", error)
      throw error
    }
  },

  async cleanupDuplicates(date: Date | string, userId?: string) {
    try {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("report_date", formatDate(date))
        .eq("submitter_id", userId)

      if (error) {
        throw error
      }

      if (data && data.length > 1) {
        // Keep the most recent report and delete others
        const [keep, ...toDelete] = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        await Promise.all(
          toDelete.map(report => 
            supabase.from("daily_reports").delete().eq("id", report.id)
          )
        )

        return keep
      }

      return data?.[0]
    } catch (error) {
      console.error("Error cleaning up duplicate reports:", error)
      throw error
    }
  }
}

// Opportunity Service
const opportunityService = {
  async getOpportunities() {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      return data as Opportunity[]
    } catch (error) {
      console.error("Error fetching opportunities:", error)
      throw error
    }
  },

  async getOpportunityById(id: string) {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        throw error
      }

      return data as Opportunity
    } catch (error) {
      console.error("Error fetching opportunity:", error)
      throw error
    }
  },

  async createOpportunity(opportunity: Omit<Opportunity, "id" | "created_at" | "updated_at">) {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .insert([opportunity])
        .select()
        .single()

      if (error) {
        throw error
      }

      return data as Opportunity
    } catch (error) {
      console.error("Error creating opportunity:", error)
      throw error
    }
  },

  async updateOpportunity(id: string, updates: Partial<Opportunity>) {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data as Opportunity
    } catch (error) {
      console.error("Error updating opportunity:", error)
      throw error
    }
  },

  async deleteOpportunity(id: string) {
    try {
      const { error } = await supabase.from("opportunities").delete().eq("id", id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Error deleting opportunity:", error)
      throw error
    }
  }
}

// Call Notes Service
const callNoteService = {
  async getAll({ startDate, endDate, userId, daily_reports_uuid }: { 
    startDate?: Date | string; 
    endDate?: Date | string; 
    userId?: string;
    daily_reports_uuid?: string;
  }) {
    try {
      let query = supabase
        .from("call_notes")
        .select("*")
        .order("call_date", { ascending: false })

      if (userId) {
        query = query.eq("submitter_id", userId)
      }

      if (daily_reports_uuid) {
        query = query.eq("daily_reports_uuid", daily_reports_uuid)
      }

      if (startDate) {
        query = query.gte("call_date", formatDate(startDate))
      }

      if (endDate) {
        query = query.lte("call_date", formatDate(endDate))
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching call notes:", error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from("call_notes")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching call note:", error)
      throw error
    }
  },

  async create(data: Omit<CallNote, "id" | "created_at">) {
    try {
      const { data: result, error } = await supabase
        .from("call_notes")
        .insert(data)
        .select()
        .single()

      if (error) {
        throw error
      }

      return result
    } catch (error) {
      console.error("Error creating call note:", error)
      throw error
    }
  },

  async update(id: string, updates: Partial<CallNote>) {
    try {
      const { data, error } = await supabase
        .from("call_notes")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error updating call note:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from("call_notes")
        .delete()
        .eq("id", id)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error deleting call note:", error)
      throw error
    }
  },

  async addAttachment(id: string, attachmentUrl: string) {
    try {
      // First get the current attachments
      const { data: currentData, error: fetchError } = await supabase
        .from("call_notes")
        .select("attachments")
        .eq("id", id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Update with the new attachment
      const { data, error } = await supabase
        .from("call_notes")
        .update({
          attachments: [...(currentData?.attachments || []), attachmentUrl],
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error adding attachment:", error)
      throw error
    }
  },

  async removeAttachment(id: string, attachmentUrl: string) {
    try {
      // First get the current attachments
      const { data: currentData, error: fetchError } = await supabase
        .from("call_notes")
        .select("attachments")
        .eq("id", id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Update with the attachment removed
      const { data, error } = await supabase
        .from("call_notes")
        .update({
          attachments: (currentData?.attachments || []).filter((url: string) => url !== attachmentUrl),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error removing attachment:", error)
      throw error
    }
  },
}

// Expense Service
const expenseService = {
  async getAll({ startDate, endDate, userId, daily_reports_uuid }: { 
    startDate?: Date | string; 
    endDate?: Date | string; 
    userId?: string;
    daily_reports_uuid?: string;
  }) {
    try {
      let query = supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false })

      if (userId) {
        query = query.eq("submitter_id", userId)
      }

      if (daily_reports_uuid) {
        query = query.eq("daily_reports_uuid", daily_reports_uuid)
      }

      if (startDate) {
        query = query.gte("expense_date", formatDate(startDate))
      }

      if (endDate) {
        query = query.lte("expense_date", formatDate(endDate))
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching expenses:", error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error fetching expense:", error)
      throw error
    }
  },

  async create(data: Omit<Expense, "id" | "created_at">) {
    try {
      const { data: result, error } = await supabase
        .from("expenses")
        .insert(data)
        .select()
        .single()

      if (error) {
        throw error
      }

      return result
    } catch (error) {
      console.error("Error creating expense:", error)
      throw error
    }
  },

  async update(id: string, updates: Partial<Expense>) {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error updating expense:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error deleting expense:", error)
      throw error
    }
  },
}

// User Service
interface UserOptions {
  role?: string
  limit?: number
  offset?: number
}

const userService = {
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("No user found")
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        throw error
      }

      return data as User
    } catch (error) {
      console.error("Error getting current user:", error)
      throw error
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        throw error
      }

      return data as User
    } catch (error) {
      console.error("Error getting user:", error)
      throw error
    }
  },

  async getAll(options: UserOptions = {}) {
    try {
      let query = supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })

      if (options.role) {
        query = query.eq("role", options.role)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data as User[]
    } catch (error) {
      console.error("Error getting users:", error)
      throw error
    }
  },

  async updateProfile(data: Partial<User>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("No user found")
      }

      const { data: result, error } = await supabase
        .from("users")
        .update(data)
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return result as User
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  },

  async updateRole(userId: string, role: string) {
    try {
      const { data: result, error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return result as User
    } catch (error) {
      console.error("Error updating user role:", error)
      throw error
    }
  },

  async updateAvatar(userId: string, avatarUrl: string | null) {
    try {
      const { data: result, error } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return result as User
    } catch (error) {
      console.error("Error updating user avatar:", error)
      throw error
    }
  }
}

// Export services
export {
  dailyReportService,
  callNoteService,
  expenseService,
  userService,
  opportunityService,
}

