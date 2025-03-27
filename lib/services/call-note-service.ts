import { BaseService } from "./base-service"
import type { Database } from "@/lib/database.types"
import { deleteFile } from "@/lib/storage-utils"

type CallNote = Database["public"]["Tables"]["call_notes"]["Row"]
type CallNoteInsert = Database["public"]["Tables"]["call_notes"]["Insert"]
type CallNoteUpdate = Database["public"]["Tables"]["call_notes"]["Update"]

export class CallNoteService extends BaseService {
  /**
   * Create a new call note
   * @param data Call note data
   * @returns The created call note
   */
  async create(data: {
    client_name: string
    contact_name?: string | null
    location_type?: string | null
    call_date: Date | string
    notes: string
    attachments?: string[] | null
  }): Promise<CallNote> {
    try {
      const userId = await this.getCurrentUserId()

      const callNoteData: CallNoteInsert = {
        submitter_id: userId,
        client_name: data.client_name,
        contact_name: data.contact_name || null,
        location_type: data.location_type || null,
        call_date: this.formatDate(data.call_date),
        notes: data.notes,
        attachments: data.attachments && data.attachments.length > 0 ? data.attachments : null,
      }

      const { data: result, error } = await this.supabase.from("call_notes").insert(callNoteData).select().single()

      if (error) {
        this.handleError(error, "create call note")
      }

      return result
    } catch (error) {
      this.handleError(error, "create call note")
    }
  }

  /**
   * Get a call note by ID
   * @param id Call note ID
   * @returns The call note or null if not found
   */
  async getById(id: string): Promise<CallNote | null> {
    try {
      const { data, error } = await this.supabase.from("call_notes").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        this.handleError(error, "get call note")
      }

      return data
    } catch (error) {
      this.handleError(error, "get call note")
    }
  }

  /**
   * Get call notes for a user within a date range
   * @param options Query options
   * @returns Array of call notes
   */
  async getAll(
    options: {
      userId?: string
      startDate?: Date | string
      endDate?: Date | string
      clientName?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<CallNote[]> {
    try {
      const userId = options.userId || (await this.getCurrentUserId())

      let query = this.supabase
        .from("call_notes")
        .select("*")
        .eq("submitter_id", userId)
        .order("call_date", { ascending: false })

      if (options.startDate) {
        query = query.gte("call_date", this.formatDate(options.startDate))
      }

      if (options.endDate) {
        query = query.lte("call_date", this.formatDate(options.endDate))
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
        this.handleError(error, "get call notes")
      }

      return data || []
    } catch (error) {
      this.handleError(error, "get call notes")
    }
  }

  /**
   * Update a call note
   * @param id Call note ID
   * @param data Update data
   * @returns The updated call note
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
    try {
      const updateData: CallNoteUpdate = {
        ...data,
        updated_at: new Date().toISOString(),
      }

      if (data.call_date) {
        updateData.call_date = this.formatDate(data.call_date)
      }

      const { data: result, error } = await this.supabase
        .from("call_notes")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        this.handleError(error, "update call note")
      }

      return result
    } catch (error) {
      this.handleError(error, "update call note")
    }
  }

  /**
   * Delete a call note and its attachments
   * @param id Call note ID
   * @returns True if successful
   */
  async delete(id: string): Promise<boolean> {
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
      const { error } = await this.supabase.from("call_notes").delete().eq("id", id)

      if (error) {
        this.handleError(error, "delete call note")
      }

      return true
    } catch (error) {
      this.handleError(error, "delete call note")
    }
  }

  /**
   * Add an attachment to a call note
   * @param id Call note ID
   * @param attachmentUrl URL of the attachment
   * @returns The updated call note
   */
  async addAttachment(id: string, attachmentUrl: string): Promise<CallNote> {
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
      this.handleError(error, "add attachment")
    }
  }

  /**
   * Remove an attachment from a call note
   * @param id Call note ID
   * @param attachmentUrl URL of the attachment to remove
   * @returns The updated call note
   */
  async removeAttachment(id: string, attachmentUrl: string): Promise<CallNote> {
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
      this.handleError(error, "remove attachment")
    }
  }
}

// Export a singleton instance
export const callNoteService = new CallNoteService()

