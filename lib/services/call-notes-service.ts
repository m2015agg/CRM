import { getSupabaseClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { deleteFile } from "@/lib/storage-utils"
import type { Database } from "@/lib/database.types"

type CallNote = Database["public"]["Tables"]["call_notes"]["Row"]
type CallNoteInsert = Database["public"]["Tables"]["call_notes"]["Insert"]
type CallNoteUpdate = Database["public"]["Tables"]["call_notes"]["Update"]

export const callNotesService = {
  /**
   * Create a new call note
   */
  async create(data: {
    submitter_id: string
    client_name: string
    contact_name?: string | null
    location_type?: string | null
    call_date: Date | string
    notes: string
    attachments?: string[] | null
  }): Promise<CallNote> {
    const supabase = getSupabaseClient()

    // Format the date if it's a Date object
    const formattedDate = data.call_date instanceof Date ? format(data.call_date, "yyyy-MM-dd") : data.call_date

    const callNoteData: CallNoteInsert = {
      submitter_id: data.submitter_id,
      client_name: data.client_name,
      contact_name: data.contact_name || null,
      location_type: data.location_type || null,
      call_date: formattedDate,
      notes: data.notes,
      attachments: data.attachments && data.attachments.length > 0 ? data.attachments : null,
    }

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
   * Get a call note by ID
   */
  async getById(id: string): Promise<CallNote | null> {
    const supabase = getSupabaseClient()

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
   * Get call notes by submitter ID
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
    const supabase = getSupabaseClient()

    let query = supabase
      .from("call_notes")
      .select("*")
      .eq("submitter_id", submitterId)
      .order("call_date", { ascending: false })

    // Apply date filters if provided
    if (options?.startDate) {
      const startDateStr =
        options.startDate instanceof Date ? format(options.startDate, "yyyy-MM-dd") : options.startDate

      query = query.gte("call_date", startDateStr)
    }

    if (options?.endDate) {
      const endDateStr = options.endDate instanceof Date ? format(options.endDate, "yyyy-MM-dd") : options.endDate

      query = query.lte("call_date", endDateStr)
    }

    // Apply pagination if provided
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
   * Update a call note
   */
  async update(
    id: string,
    data: {
      client_name?: string
      contact_name?: string | null
      location_type?: string | null
      call_date?: Date | string
      notes?: string
      attachments?: string[] | null
    },
  ): Promise<CallNote> {
    const supabase = getSupabaseClient()

    // Format the date if it's a Date object and provided
    const updateData: CallNoteUpdate = { ...data }

    if (data.call_date instanceof Date) {
      updateData.call_date = format(data.call_date, "yyyy-MM-dd")
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

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
   * Delete a call note and its attachments
   */
  async delete(id: string): Promise<boolean> {
    const supabase = getSupabaseClient()

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

    // Delete the attachments if they exist
    if (callNote?.attachments && callNote.attachments.length > 0) {
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

    // Delete the call note record
    const { error: deleteError } = await supabase.from("call_notes").delete().eq("id", id)

    if (deleteError) {
      console.error("Error deleting call note:", deleteError)
      throw deleteError
    }

    return true
  },

  /**
   * Add an attachment to a call note
   */
  async addAttachment(id: string, attachmentUrl: string): Promise<CallNote> {
    const supabase = getSupabaseClient()

    // First, get the current attachments
    const { data: callNote, error: fetchError } = await supabase
      .from("call_notes")
      .select("attachments")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching call note for attachment update:", fetchError)
      throw fetchError
    }

    // Create a new attachments array with the new URL
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
   * Remove an attachment from a call note
   */
  async removeAttachment(id: string, attachmentUrl: string): Promise<CallNote> {
    const supabase = getSupabaseClient()

    // First, get the current attachments
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

    // Filter out the attachment to remove
    const updatedAttachments = callNote.attachments.filter((url) => url !== attachmentUrl)

    // Try to delete the file from storage
    try {
      await deleteFile(attachmentUrl)
    } catch (err) {
      console.error(`Failed to delete attachment file: ${attachmentUrl}`, err)
      // Continue with the database update even if file deletion fails
    }

    // Update the call note with the new attachments array
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

