import { format } from "date-fns"
import { deleteFile } from "@/lib/storage-utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"

type CallNote = Database["public"]["Tables"]["call_notes"]["Row"]
type CallNoteInsert = Database["public"]["Tables"]["call_notes"]["Insert"]
type CallNoteUpdate = Database["public"]["Tables"]["call_notes"]["Update"]

interface GetCallNotesParams {
  startDate: string
  endDate: string
  userId: string
}

export const callNotesService = {
  /**
   * Creates a new call note in the database
   * @param data Object containing call note details
   * @returns Promise resolving to the created call note
   */
  async create(data: {
    submitter_id: string
    daily_reports_uuid: string
    client_name: string
    contact_name?: string | null
    location_type?: string | null
    call_date: Date | string
    notes: string
    attachments?: string[] | null
  }): Promise<CallNote> {
    const supabase = createClientComponentClient()

    // Format the date to YYYY-MM-DD format if it's a Date object
    const formattedDate = data.call_date instanceof Date ? format(data.call_date, "yyyy-MM-dd") : data.call_date

    // Prepare data for insertion, handling null values
    const callNoteData: CallNoteInsert = {
      submitter_id: data.submitter_id,
      daily_reports_uuid: data.daily_reports_uuid,
      client_name: data.client_name,
      contact_name: data.contact_name || null,
      location_type: data.location_type || null,
      call_date: formattedDate,
      notes: data.notes,
      attachments: data.attachments && data.attachments.length > 0 ? data.attachments : null,
    }

    // Insert the call note and return the created record
    const { data: result, error } = await supabase.from("call_notes").insert(callNoteData).select().single()

    if (error) {
      console.error("Error creating call note:", error)
      throw error
    }

    if (!result) {
      throw new Error("Failed to create call note")
    }

    return result
  },

  /**
   * Retrieves a specific call note by its ID
   * @param id The ID of the call note to retrieve
   * @returns Promise resolving to the call note or null if not found
   */
  async getById(id: string): Promise<CallNote | null> {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase.from("call_notes").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        // Record not found
        return null
      }
      console.error("Error getting call note:", error)
      throw error
    }

    return data
  },

  /**
   * Retrieves all call notes for a specific submitter with optional filtering
   * @param submitterId The ID of the submitter
   * @param options Optional filters for date range and pagination
   * @returns Promise resolving to an array of call notes
   */
  async getBySubmitter(
    submitterId: string,
    options?: {
      startDate?: Date | string
      endDate?: Date | string
      limit?: number
      offset?: number
    },
  ): Promise<CallNote[]> {
    const supabase = createClientComponentClient()

    // Build the base query
    let query = supabase
      .from("call_notes")
      .select("*")
      .eq("submitter_id", submitterId)
      .order("call_date", { ascending: false })

    // Apply date range filters if provided
    if (options?.startDate) {
      const startDateStr =
        options.startDate instanceof Date ? format(options.startDate, "yyyy-MM-dd") : options.startDate
      query = query.gte("call_date", startDateStr)
    }

    if (options?.endDate) {
      const endDateStr = options.endDate instanceof Date ? format(options.endDate, "yyyy-MM-dd") : options.endDate
      query = query.lte("call_date", endDateStr)
    }

    // Apply pagination if specified
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error getting call notes:", error)
      throw error
    }

    return data || []
  },

  /**
   * Retrieves call notes by daily report UUID
   * @param dailyReportUuid The UUID of the daily report
   * @returns Promise resolving to an array of call notes
   */
  async getByDailyReport(dailyReportUuid: string): Promise<CallNote[]> {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase
      .from("call_notes")
      .select("*")
      .eq("daily_reports_uuid", dailyReportUuid)
      .order("call_date", { ascending: true })

    if (error) {
      console.error("Error getting call notes by daily report:", error)
      throw error
    }

    return data || []
  },

  /**
   * Updates an existing call note
   * @param id The ID of the call note to update
   * @param data Object containing the fields to update
   * @returns Promise resolving to the updated call note
   */
  async update(
    id: string,
    data: {
      daily_reports_uuid?: string
      client_name?: string
      contact_name?: string | null
      location_type?: string | null
      call_date?: Date | string
      notes?: string
      attachments?: string[] | null
    },
  ): Promise<CallNote> {
    const supabase = createClientComponentClient()

    // Format the date if provided
    const updateData: CallNoteUpdate = {
      ...data,
      call_date: data.call_date instanceof Date ? format(data.call_date, "yyyy-MM-dd") : data.call_date,
    }

    const { data: result, error } = await supabase.from("call_notes").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating call note:", error)
      throw error
    }

    if (!result) {
      throw new Error("Failed to update call note")
    }

    return result
  },

  /**
   * Deletes a call note and its associated attachments
   * @param id The ID of the call note to delete
   * @returns Promise resolving to true if successful
   */
  async delete(id: string): Promise<boolean> {
    const supabase = createClientComponentClient()

    // First, get the call note to access its attachments
    const { data: callNote, error: fetchError } = await supabase
      .from("call_notes")
      .select("attachments")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching call note for deletion:", fetchError)
      throw fetchError
    }

    // Delete all attachments from storage if they exist
    if (callNote?.attachments && callNote.attachments.length > 0) {
      await Promise.all(
        callNote.attachments.map(async (url: string) => {
          try {
            await deleteFile(url)
          } catch (err) {
            console.error(`Failed to delete attachment: ${url}`, err)
            // Continue with deletion even if attachment deletion fails
          }
        }),
      )
    }

    // Delete the call note record from the database
    const { error: deleteError } = await supabase.from("call_notes").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting call note:", deleteError)
      throw deleteError
    }

    return true
  },

  /**
   * Adds an attachment to an existing call note
   * @param id The ID of the call note
   * @param attachmentUrl The URL of the attachment to add
   * @returns Promise resolving to the updated call note
   */
  async addAttachment(id: string, attachmentUrl: string): Promise<CallNote> {
    const supabase = createClientComponentClient()

    // Get current attachments
    const { data: callNote, error: fetchError } = await supabase
      .from("call_notes")
      .select("attachments")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching call note for attachment update:", fetchError)
      throw fetchError
    }

    // Add the new attachment URL to the existing attachments array
    const currentAttachments = callNote?.attachments || []
    const updatedAttachments = [...currentAttachments, attachmentUrl]

    // Update the call note with the new attachments array
    const { data: result, error: updateError } = await supabase
      .from("call_notes")
      .update({
        attachments: updatedAttachments,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error adding attachment to call note:", updateError)
      throw updateError
    }

    if (!result) {
      throw new Error("Failed to add attachment to call note")
    }

    return result
  },

  /**
   * Removes an attachment from a call note
   * @param id The ID of the call note
   * @param attachmentUrl The URL of the attachment to remove
   * @returns Promise resolving to the updated call note
   */
  async removeAttachment(id: string, attachmentUrl: string): Promise<CallNote> {
    const supabase = createClientComponentClient()

    // Get current attachments
    const { data: callNote, error: fetchError } = await supabase
      .from("call_notes")
      .select("attachments")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching call note for attachment removal:", fetchError)
      throw fetchError
    }

    if (!callNote?.attachments) {
      throw new Error("Call note has no attachments")
    }

    // Remove the specified attachment from the array
    const updatedAttachments = callNote.attachments.filter((url: string) => url !== attachmentUrl)

    // Delete the attachment file from storage
    try {
      await deleteFile(attachmentUrl)
    } catch (err) {
      console.error(`Failed to delete attachment file: ${attachmentUrl}`, err)
      // Continue with the database update even if file deletion fails
    }

    // Update the call note with the filtered attachments array
    const { data: result, error: updateError } = await supabase
      .from("call_notes")
      .update({
        attachments: updatedAttachments.length > 0 ? updatedAttachments : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Error removing attachment from call note:", updateError)
      throw updateError
    }

    if (!result) {
      throw new Error("Failed to remove attachment from call note")
    }

    return result
  },
}

/**
 * Retrieves all call notes for a user within a specified date range
 * @param params Object containing startDate, endDate, and userId
 * @returns Promise resolving to an array of call notes
 */
export async function getAllCallNotes({ startDate, endDate, userId }: GetCallNotesParams) {
  try {
    const supabase = createClientComponentClient()
    
    // Query call notes with date range and user filters
    const { data, error } = await supabase
      .from('call_notes')
      .select('*')
      .eq('submitter_id', userId)
      .gte('call_date', startDate)
      .lte('call_date', endDate)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching call notes:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getAllCallNotes:', error)
    throw error
  }
}

