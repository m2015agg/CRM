import { getSupabaseClient } from "@/lib/supabase/client"
import { format } from "date-fns"

// Define the bucket name as a constant to ensure consistency
export const ATTACHMENTS_BUCKET = "attachments"
export const RECEIPTS_BUCKET = "attachments"

// Daily Reports CRUD operations
export const dailyReportsService = {
  // Create a new daily report
  async create(data: {
    submitter_id: string
    report_date: Date | string
    mileage?: number | null
    comments?: string | null
  }) {
    const supabase = getSupabaseClient()
    const formattedDate =
      typeof data.report_date === "string" ? data.report_date : format(data.report_date, "yyyy-MM-dd")

    const { data: result, error } = await supabase
      .from("daily_reports")
      .insert({
        submitter_id: data.submitter_id,
        report_date: formattedDate,
        mileage: data.mileage || null,
        comments: data.comments || null,
      })
      .select()

    if (error) throw error
    return result
  },

  // Get daily reports for a specific submitter
  async getBySubmitter(
    submitterId: string,
    options?: {
      startDate?: Date | string
      endDate?: Date | string
    },
  ) {
    const supabase = getSupabaseClient()
    let query = supabase
      .from("daily_reports")
      .select("*")
      .eq("submitter_id", submitterId)
      .order("report_date", { ascending: false })

    if (options?.startDate) {
      const startDateStr =
        typeof options.startDate === "string" ? options.startDate : format(options.startDate, "yyyy-MM-dd")
      query = query.gte("report_date", startDateStr)
    }

    if (options?.endDate) {
      const endDateStr = typeof options.endDate === "string" ? options.endDate : format(options.endDate, "yyyy-MM-dd")
      query = query.lte("report_date", endDateStr)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Get a specific daily report by date
  async getByDate(submitterId: string, date: Date | string) {
    const supabase = getSupabaseClient()
    const formattedDate = typeof date === "string" ? date : format(date, "yyyy-MM-dd")

    const { data, error } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("submitter_id", submitterId)
      .eq("report_date", formattedDate)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  },

  // Update a daily report
  async update(
    id: string,
    data: {
      mileage?: number | null
      comments?: string | null
    },
  ) {
    const supabase = getSupabaseClient()
    const { data: result, error } = await supabase
      .from("daily_reports")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) throw error
    return result
  },

  // Delete a daily report
  async delete(id: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("daily_reports").delete().eq("id", id)

    if (error) throw error
    return true
  },
}

// Expenses CRUD operations
export const expensesService = {
  // Create a new expense
  async create(data: {
    submitter_id: string
    expense_date: Date | string
    expense_type: string
    amount: number
    description?: string | null
    client_name?: string | null
    location?: string | null
    discussion_notes?: string | null
    receipt_url?: string | null
  }) {
    const supabase = getSupabaseClient()
    const formattedDate =
      typeof data.expense_date === "string" ? data.expense_date : format(data.expense_date, "yyyy-MM-dd")

    const { data: result, error } = await supabase
      .from("expenses")
      .insert({
        submitter_id: data.submitter_id,
        expense_date: formattedDate,
        expense_type: data.expense_type,
        amount: data.amount,
        description: data.description || null,
        client_name: data.client_name || null,
        location: data.location || null,
        discussion_notes: data.discussion_notes || null,
        receipt_url: data.receipt_url || null,
      })
      .select()

    if (error) throw error
    return result
  },

  // Get expenses for a specific submitter
  async getBySubmitter(
    submitterId: string,
    options?: {
      expenseType?: string
      startDate?: Date | string
      endDate?: Date | string
    },
  ) {
    const supabase = getSupabaseClient()
    let query = supabase
      .from("expenses")
      .select("*")
      .eq("submitter_id", submitterId)
      .order("expense_date", { ascending: false })

    if (options?.expenseType) {
      query = query.eq("expense_type", options.expenseType)
    }

    if (options?.startDate) {
      const startDateStr =
        typeof options.startDate === "string" ? options.startDate : format(options.startDate, "yyyy-MM-dd")
      query = query.gte("expense_date", startDateStr)
    }

    if (options?.endDate) {
      const endDateStr = typeof options.endDate === "string" ? options.endDate : format(options.endDate, "yyyy-MM-dd")
      query = query.lte("expense_date", endDateStr)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Get a specific expense by ID
  async getById(id: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from("expenses").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },

  // Update an expense
  async update(
    id: string,
    data: {
      expense_type?: string
      amount?: number
      description?: string | null
      client_name?: string | null
      location?: string | null
      discussion_notes?: string | null
      receipt_url?: string | null
    },
  ) {
    const supabase = getSupabaseClient()
    const { data: result, error } = await supabase
      .from("expenses")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) throw error
    return result
  },

  // Delete an expense
  async delete(id: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("expenses").delete().eq("id", id)

    if (error) throw error
    return true
  },
}

// File upload and management
export const fileService = {
  // Upload a file to storage
  async uploadFile(file: File, bucket: string, folder: string): Promise<string | null> {
    try {
      const supabase = getSupabaseClient()

      const fileExt = file.name.split(".").pop()
      const fileName = `${folder}/${crypto.randomUUID()}.${fileExt}`

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Error uploading file:", error)
        throw error
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error("Error in uploadFile:", error)
      throw error
    }
  },

  // Delete a file from storage
  async deleteFile(path: string, bucket: string): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()

      // Extract the file path from the public URL
      const urlParts = path.split(`${bucket}/`)
      if (urlParts.length < 2) return false

      const filePath = urlParts[1]

      const { error } = await supabase.storage.from(bucket).remove([filePath])

      if (error) {
        console.error("Error deleting file:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in deleteFile:", error)
      return false
    }
  },
}

// Weekly report service
export const weeklyReportService = {
  // Get all data for a weekly report
  async getWeeklyData(submitterId: string, startDate: Date | string, endDate: Date | string) {
    const supabase = getSupabaseClient()
    const startDateStr = typeof startDate === "string" ? startDate : format(startDate, "yyyy-MM-dd")
    const endDateStr = typeof endDate === "string" ? endDate : format(endDate, "yyyy-MM-dd")

    try {
      // Fetch daily reports
      const { data: reportsData, error: reportsError } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("submitter_id", submitterId)
        .gte("report_date", startDateStr)
        .lte("report_date", endDateStr)
        .order("report_date")

      if (reportsError && !reportsError.message.includes("does not exist")) {
        throw reportsError
      }

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("submitter_id", submitterId)
        .gte("expense_date", startDateStr)
        .lte("expense_date", endDateStr)
        .order("expense_date")

      if (expensesError && !expensesError.message.includes("does not exist")) {
        throw expensesError
      }

      return {
        reports: reportsData || [],
        expenses: expensesData || [],
      }
    } catch (error) {
      console.error("Error fetching weekly data:", error)
      throw error
    }
  },
}

