import { getSupabaseClient } from "@/lib/supabase/client"
import { deleteFile } from "@/lib/storage-utils"

// Helper functions
const getCurrentUserId = async () => {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error("User not authenticated")
  }

  return data.user.id
}

const formatDate = (date) => {
  if (typeof date === "string") {
    return date
  }

  return date.toISOString().split("T")[0]
}

// Daily Report Service
const dailyReportService = {
  async create(data) {
    const supabase = getSupabaseClient()
    try {
      const userId = await getCurrentUserId()

      const reportData = {
        submitter_id: userId,
        report_date: formatDate(data.report_date),
        mileage: data.mileage || null,
        comments: data.comments || null,
      }

      const { data: result, error } = await supabase.from("daily_reports").insert(reportData).select().single()

      if (error) {
        throw error
      }

      return result
    } catch (error) {
      console.error("Error creating daily report:", error)
      throw error
    }
  },

  async getByDate(date, userId) {
    const supabase = getSupabaseClient()
    try {
      const submitterId = userId || (await getCurrentUserId())
      const formattedDate = formatDate(date)

      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("submitter_id", submitterId)
        .eq("report_date", formattedDate)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting daily report:", error)
      throw error
    }
  },

  async getAll(options = {}) {
    const supabase = getSupabaseClient()
    try {
      const userId = options.userId || (await getCurrentUserId())

      let query = supabase
        .from("daily_reports")
        .select("*")
        .eq("submitter_id", userId)
        .order("report_date", { ascending: false })

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

      return data || []
    } catch (error) {
      console.error("Error getting daily reports:", error)
      throw error
    }
  },

  async update(id, data) {
    const supabase = getSupabaseClient()
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      if (data.report_date) {
        updateData.report_date = formatDate(data.report_date)
      }

      const { data: result, error } = await supabase
        .from("daily_reports")
        .update(updateData)
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

  async delete(id) {
    const supabase = getSupabaseClient()
    try {
      const { error } = await supabase.from("daily_reports").delete().eq("id", id)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error deleting daily report:", error)
      throw error
    }
  },

  async cleanupDuplicates(date, userId) {
    const supabase = getSupabaseClient()
    try {
      const submitterId = userId || (await getCurrentUserId())
      const formattedDate = formatDate(date)

      // Get all reports for this date, ordered by created_at (newest first)
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("submitter_id", submitterId)
        .eq("report_date", formattedDate)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      if (!data || data.length <= 1) {
        return 0 // No duplicates
      }

      // Keep the newest report, delete the rest
      const keepId = data[0].id
      const deleteIds = data.slice(1).map((report) => report.id)

      const { error: deleteError } = await supabase.from("daily_reports").delete().in("id", deleteIds)

      if (deleteError) {
        throw deleteError
      }

      return deleteIds.length
    } catch (error) {
      console.error("Error cleaning up duplicates:", error)
      throw error
    }
  },
}

// Call Note Service
const callNoteService = {
  async create(data) {
    const supabase = getSupabaseClient()
    try {
      const userId = await getCurrentUserId()

      const callNoteData = {
        submitter_id: userId,
        client_name: data.client_name,
        contact_name: data.contact_name || null,
        location_type: data.location_type || null,
        call_date: formatDate(data.call_date),
        notes: data.notes,
        attachments: data.attachments && data.attachments.length > 0 ? data.attachments : null,
      }

      const { data: result, error } = await supabase.from("call_notes").insert(callNoteData).select().single()

      if (error) {
        throw error
      }

      return result
    } catch (error) {
      console.error("Error creating call note:", error)
      throw error
    }
  },

  async getById(id) {
    const supabase = getSupabaseClient()
    try {
      const { data, error } = await supabase.from("call_notes").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting call note:", error)
      throw error
    }
  },

  async getAll(options = {}) {
    const supabase = getSupabaseClient()
    try {
      const userId = options.userId || (await getCurrentUserId())

      let query = supabase
        .from("call_notes")
        .select("*")
        .eq("submitter_id", userId)
        .order("call_date", { ascending: false })

      if (options.startDate) {
        query = query.gte("call_date", formatDate(options.startDate))
      }

      if (options.endDate) {
        query = query.lte("call_date", formatDate(options.endDate))
      }

      if (options.clientName) {
        query = query.ilike("client_name", `%${options.clientName}%`)
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

      return data || []
    } catch (error) {
      console.error("Error getting call notes:", error)
      throw error
    }
  },

  async update(id, data) {
    const supabase = getSupabaseClient()
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      if (data.call_date) {
        updateData.call_date = formatDate(data.call_date)
      }

      const { data: result, error } = await supabase
        .from("call_notes")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return result
    } catch (error) {
      console.error("Error updating call note:", error)
      throw error
    }
  },

  async delete(id) {
    const supabase = getSupabaseClient()
    try {
      // First get the call note to access its attachments
      const callNote = await this.getById(id)

      if (!callNote) {
        return false
      }

      // Delete attachments if they exist
      if (callNote.attachments && callNote.attachments.length > 0) {
        await Promise.all(
          callNote.attachments.map(async (url) => {
            try {
              await deleteFile(url)
            } catch (err) {
              console.error(`Failed to delete attachment: ${url}`, err)
              // Continue with deletion even if attachment deletion fails
            }
          }),
        )
      }

      // Delete the call note
      const { error } = await supabase.from("call_notes").delete().eq("id", id)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error deleting call note:", error)
      throw error
    }
  },

  async addAttachment(id, attachmentUrl) {
    try {
      // Get current attachments
      const callNote = await this.getById(id)

      if (!callNote) {
        throw new Error("Call note not found")
      }

      const currentAttachments = callNote.attachments || []
      const updatedAttachments = [...currentAttachments, attachmentUrl]

      // Update the call note
      return await this.update(id, { attachments: updatedAttachments })
    } catch (error) {
      console.error("Error adding attachment:", error)
      throw error
    }
  },

  async removeAttachment(id, attachmentUrl) {
    try {
      // Get current attachments
      const callNote = await this.getById(id)

      if (!callNote) {
        throw new Error("Call note not found")
      }

      if (!callNote.attachments) {
        throw new Error("Call note has no attachments")
      }

      // Filter out the attachment to remove
      const updatedAttachments = callNote.attachments.filter((url) => url !== attachmentUrl)

      // Try to delete the file from storage
      try {
        await deleteFile(attachmentUrl)
      } catch (err) {
        console.error(`Failed to delete attachment file: ${attachmentUrl}`, err)
        // Continue with the database update even if file deletion fails
      }

      // Update the call note
      return await this.update(id, {
        attachments: updatedAttachments.length > 0 ? updatedAttachments : null,
      })
    } catch (error) {
      console.error("Error removing attachment:", error)
      throw error
    }
  },
}

// Expense Service
const expenseService = {
  // Other methods remain the same...

  async create(data) {
    const supabase = getSupabaseClient()
    try {
      const userId = await getCurrentUserId()

      // Log the data being sent to the database
      console.log("Creating expense with data:", {
        ...data,
        submitter_id: userId,
      })

      const expenseData = {
        submitter_id: userId,
        expense_date: formatDate(data.expense_date),
        expense_type: data.expense_type,
        amount: data.amount,
        description: data.description || null,
        client_name: data.client_name || null,
        location: data.location || null,
        discussion_notes: data.discussion_notes || null,
        receipt_url: data.receipt_url || null,
        associated_call: data.associated_call || null,
      }

      const { data: result, error } = await supabase.from("expenses").insert(expenseData).select().single()

      if (error) {
        console.error("Database error creating expense:", error)
        throw error
      }

      console.log("Expense created successfully:", result)
      return result
    } catch (error) {
      console.error("Error creating expense:", error)
      throw error
    }
  },

  // Other methods remain the same...

  async update(id, data) {
    const supabase = getSupabaseClient()
    try {
      // Log the data being sent to the database
      console.log(`Updating expense ${id} with data:`, data)

      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      if (data.expense_date) {
        updateData.expense_date = formatDate(data.expense_date)
      }

      const { data: result, error } = await supabase.from("expenses").update(updateData).eq("id", id).select().single()

      if (error) {
        console.error("Database error updating expense:", error)
        throw error
      }

      console.log("Expense updated successfully:", result)
      return result
    } catch (error) {
      console.error("Error updating expense:", error)
      throw error
    }
  },

  // Other methods remain the same...

  async getById(id) {
    const supabase = getSupabaseClient()
    try {
      const { data, error } = await supabase.from("expenses").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting expense:", error)
      throw error
    }
  },

  async getAll(options = {}) {
    const supabase = getSupabaseClient()
    try {
      const userId = options.userId || (await getCurrentUserId())

      let query = supabase
        .from("expenses")
        .select("*")
        .eq("submitter_id", userId)
        .order("expense_date", { ascending: false })

      if (options.startDate) {
        query = query.gte("expense_date", formatDate(options.startDate))
      }

      if (options.endDate) {
        query = query.lte("expense_date", formatDate(options.endDate))
      }

      if (options.expenseType) {
        query = query.eq("expense_type", options.expenseType)
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

      return data || []
    } catch (error) {
      console.error("Error getting expenses:", error)
      throw error
    }
  },

  async delete(id) {
    const supabase = getSupabaseClient()
    try {
      // First get the expense to access its receipt
      const expense = await this.getById(id)

      if (!expense) {
        return false
      }

      // Delete receipt if it exists
      if (expense.receipt_url) {
        try {
          await deleteFile(expense.receipt_url)
        } catch (err) {
          console.error(`Failed to delete receipt: ${expense.receipt_url}`, err)
          // Continue with deletion even if receipt deletion fails
        }
      }

      // Delete the expense
      const { error } = await supabase.from("expenses").delete().eq("id", id)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error deleting expense:", error)
      throw error
    }
  },

  async getTotal(options = {}) {
    try {
      const expenses = await this.getAll(options)
      return expenses.reduce((total, expense) => total + expense.amount, 0)
    } catch (error) {
      console.error("Error getting total expenses:", error)
      throw error
    }
  },
}

// User Service
const userService = {
  async getCurrentUser() {
    const supabase = getSupabaseClient()
    try {
      const userId = await getCurrentUserId()

      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting current user:", error)
      throw error
    }
  },

  async getById(id) {
    const supabase = getSupabaseClient()
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      console.error("Error getting user:", error)
      throw error
    }
  },

  async getAll(options = {}) {
    const supabase = getSupabaseClient()
    try {
      // Check if current user is admin
      const currentUser = await this.getCurrentUser()

      if (currentUser.role !== "admin") {
        throw new Error("Unauthorized: Only admins can list all users")
      }

      let query = supabase.from("users").select("*").order("full_name", { ascending: true })

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

      return data || []
    } catch (error) {
      console.error("Error getting users:", error)
      throw error
    }
  },

  async updateProfile(data) {
    const supabase = getSupabaseClient()
    try {
      const userId = await getCurrentUserId()

      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      const { data: result, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

      if (error) {
        throw error
      }

      return result
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  },

  async updateAvatar(avatarUrl) {
    try {
      const userId = await getCurrentUserId()

      // Get current user to check if they have an existing avatar
      const currentUser = await this.getById(userId)

      if (currentUser?.avatar_url) {
        // Delete the old avatar
        try {
          await deleteFile(currentUser.avatar_url)
        } catch (err) {
          console.error(`Failed to delete old avatar: ${currentUser.avatar_url}`, err)
          // Continue with update even if deletion fails
        }
      }

      // Update with new avatar
      return await this.updateProfile({ avatar_url: avatarUrl })
    } catch (error) {
      console.error("Error updating avatar:", error)
      throw error
    }
  },

  async updateRole(userId, role) {
    const supabase = getSupabaseClient()
    try {
      // Check if current user is admin
      const currentUser = await this.getCurrentUser()

      if (currentUser.role !== "admin") {
        throw new Error("Unauthorized: Only admins can update user roles")
      }

      const updateData = {
        role,
        updated_at: new Date().toISOString(),
      }

      const { data: result, error } = await supabase.from("users").update(updateData).eq("id", userId).select().single()

      if (error) {
        throw error
      }

      return result
    } catch (error) {
      console.error("Error updating user role:", error)
      throw error
    }
  },
}

// Export services
export { dailyReportService, callNoteService, expenseService, userService }

