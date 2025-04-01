import { BaseService } from "./base-service"
import type { Database } from "@/lib/database.types"

type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"]
type DailyReportInsert = Database["public"]["Tables"]["daily_reports"]["Insert"]
type DailyReportUpdate = Database["public"]["Tables"]["daily_reports"]["Update"]

export class DailyReportService extends BaseService {
  /**
   * Create a new daily report
   * @param data Report data
   * @returns The created report
   */
  async create(data: {
    report_date: Date | string
    mileage?: number | null
    comments?: string | null
  }): Promise<DailyReport> {
    try {
      const userId = await this.getCurrentUserId()

      const reportData: DailyReportInsert = {
        submitter_id: userId,
        report_date: this.formatDate(data.report_date),
        mileage: data.mileage || null,
        comments: data.comments || null,
      }

      const { data: result, error } = await this.supabase.from("daily_reports").insert(reportData).select().single()

      if (error) {
        this.handleError(error, "create daily report")
      }

      return result
    } catch (error) {
      this.handleError(error, "create daily report")
    }
  }

  /**
   * Get a daily report by date
   * @param date The report date
   * @param userId Optional user ID (defaults to current user)
   * @returns The report or null if not found
   */
  async getByDate(date: Date | string, userId?: string): Promise<DailyReport | null> {
    try {
      const submitterId = userId || (await this.getCurrentUserId())
      const formattedDate = this.formatDate(date)

      const { data, error } = await this.supabase
        .from("daily_reports")
        .select("*")
        .eq("submitter_id", submitterId)
        .eq("report_date", formattedDate)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        this.handleError(error, "get daily report")
      }

      return data
    } catch (error) {
      this.handleError(error, "get daily report")
    }
  }

  /**
   * Get all daily reports for a user within a date range
   * @param options Query options
   * @returns Array of daily reports
   */
  async getAll(
    options: {
      userId?: string
      startDate?: Date | string
      endDate?: Date | string
      limit?: number
      offset?: number
    } = {},
  ): Promise<DailyReport[]> {
    try {
      const userId = options.userId || (await this.getCurrentUserId())

      let query = this.supabase
        .from("daily_reports")
        .select("*")
        .eq("submitter_id", userId)
        .order("report_date", { ascending: false })

      if (options.startDate) {
        query = query.gte("report_date", this.formatDate(options.startDate))
      }

      if (options.endDate) {
        query = query.lte("report_date", this.formatDate(options.endDate))
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) {
        this.handleError(error, "get daily reports")
      }

      return data || []
    } catch (error) {
      this.handleError(error, "get daily reports")
    }
  }

  /**
   * Update a daily report
   * @param id Report ID
   * @param data Update data
   * @returns The updated report
   */
  async update(
    id: string,
    data: {
      report_date?: Date | string
      mileage?: number | null
      comments?: string | null
    },
  ): Promise<DailyReport> {
    try {
      const updateData: DailyReportUpdate = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      if (data.report_date) {
        updateData.report_date = this.formatDate(data.report_date)
      }

      const { data: result, error } = await this.supabase
        .from("daily_reports")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        this.handleError(error, "update daily report")
      }

      return result
    } catch (error) {
      this.handleError(error, "update daily report")
    }
  }

  /**
   * Delete a daily report
   * @param id Report ID
   * @returns True if successful
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from("daily_reports").delete().eq("id", id)

      if (error) {
        this.handleError(error, "delete daily report")
      }

      return true
    } catch (error) {
      this.handleError(error, "delete daily report")
    }
  }

  /**
   * Find and remove duplicate reports for a user and date
   * @param date Report date
   * @param userId Optional user ID (defaults to current user)
   * @returns Number of duplicates removed
   */
  async cleanupDuplicates(date: Date | string, userId?: string): Promise<number> {
    try {
      const submitterId = userId || (await this.getCurrentUserId())
      const formattedDate = this.formatDate(date)

      // Get all reports for this date, ordered by created_at (newest first)
      const { data, error } = await this.supabase
        .from("daily_reports")
        .select("*")
        .eq("submitter_id", submitterId)
        .eq("report_date", formattedDate)
        .order("created_at", { ascending: false })

      if (error) {
        this.handleError(error, "cleanup duplicates")
      }

      if (!data || data.length <= 1) {
        return 0 // No duplicates
      }

      // Keep the newest report, delete the rest
      const keepId = data[0].id
      const deleteIds = data.slice(1).map((report) => report.id)

      const { error: deleteError } = await this.supabase.from("daily_reports").delete().in("id", deleteIds)

      if (deleteError) {
        this.handleError(deleteError, "delete duplicate reports")
      }

      return deleteIds.length
    } catch (error) {
      this.handleError(error, "cleanup duplicates")
    }
  }
}

// Export a singleton instance
export const dailyReportService = new DailyReportService()

