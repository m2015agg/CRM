import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getSupabaseClient } from '@/lib/supabase/client'
import { BaseService } from "./base-service"
import { deleteFile } from "@/lib/storage-utils"
import { formatDate } from "@/lib/utils"

type CallNote = {
  id: string
  submitter_id: string
  client_name: string
  contact_name: string | null
  location_type: string | null
  call_date: string
  notes: string
  attachments: string[] | null
  created_at: string
  updated_at: string
}

type CallNoteInsert = Omit<CallNote, "id" | "created_at" | "updated_at">
type CallNoteUpdate = Partial<CallNoteInsert>

export class CallNoteService extends BaseService {
  constructor() {
    super()
  }

  private formatDate(date: Date | string): string {
    return formatDate(date)
  }

  private async getCurrentUserId(): Promise<string> {
    const supabase = getSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    return user.id
  }

  private handleError(error: any, context: string): never {
    console.error(`Error in ${context}:`, error)
    throw error
  }

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

      const { data: result, error } = await this.supabase
        .from("call_notes")
        .insert(callNoteData)
        .select()
        .single()

      if (error) {
        this.handleError(error, "create call note")
      }

      return result
    } catch (error) {
      this.handleError(error, "create call note")
    }
  }

  async getById(id: string): Promise<CallNote | null> {
    try {
      const { data, error } = await this.supabase
        .from("call_notes")
        .select("*")
        .eq("id", id)
        .single()

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
      return []
    }
  }

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
        client_name: data.client_name,
        contact_name: data.contact_name,
        location_type: data.location_type,
        call_date: data.call_date ? this.formatDate(data.call_date) : undefined,
        notes: data.notes,
        attachments: data.attachments,
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

      // Delete the call note
      const { error } = await this.supabase.from("call_notes").delete().eq("id", id)

      if (error) {
        this.handleError(error, "delete call note")
      }

      return true
    } catch (error) {
      this.handleError(error, "delete call note")
      return false
    }
  }

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
      const updatedAttachments = callNote.attachments.filter((url: string) => url !== attachmentUrl)

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

