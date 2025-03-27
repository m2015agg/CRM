import { getSupabaseClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database.types"

type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"]
type OpportunityInsert = Database["public"]["Tables"]["opportunities"]["Insert"]
type OpportunityUpdate = Database["public"]["Tables"]["opportunities"]["Update"]

// Get all opportunities
export async function getOpportunities(): Promise<Opportunity[]> {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error getting opportunities:", error)
    throw error
  }
}

// Create a new opportunity
export async function createOpportunity(data: {
  name: string
  company_name: string
  contact_name: string
  request_machine: string
  requested_attachments?: string
  value: number
  status: string
  expected_close_date?: Date
  description?: string
  trade_in_description?: string
}): Promise<Opportunity> {
  const supabase = getSupabaseClient()

  try {
    // Get current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const opportunityData: OpportunityInsert = {
      name: data.name,
      company_name: data.company_name,
      contact_name: data.contact_name,
      request_machine: data.request_machine,
      requested_attachments: data.requested_attachments || null,
      value: data.value,
      status: data.status,
      expected_close_date: data.expected_close_date?.toISOString() || null,
      description: data.description || null,
      trade_in_description: data.trade_in_description || null,
      owner_id: user.id,
    }

    const { data: result, error } = await supabase.from("opportunities").insert(opportunityData).select().single()

    if (error) throw error

    return result
  } catch (error) {
    console.error("Error creating opportunity:", error)
    throw error
  }
}

// Update an opportunity's status
export async function updateOpportunityStatus(id: string, status: string): Promise<Opportunity> {
  const supabase = getSupabaseClient()

  try {
    const { data, error } = await supabase
      .from("opportunities")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Error updating opportunity status:", error)
    throw error
  }
}

// Update the updateOpportunity function to add better logging
export async function updateOpportunity(
  id: string,
  data: {
    name?: string
    company_name?: string
    contact_name?: string
    request_machine?: string
    requested_attachments?: string | null
    value?: number
    status?: string
    expected_close_date?: Date | null
    description?: string | null
    trade_in_description?: string | null
  },
): Promise<Opportunity> {
  const supabase = getSupabaseClient()

  try {
    console.log(`Updating opportunity ${id} with data:`, data)

    // Format the date properly if it exists
    const updateData: OpportunityUpdate = {
      ...data,
      expected_close_date: data.expected_close_date?.toISOString() || null,
      updated_at: new Date().toISOString(),
    }

    console.log("Formatted update data:", updateData)

    const { data: result, error } = await supabase
      .from("opportunities")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error updating opportunity:", error)
      throw error
    }

    console.log("Update successful, returned data:", result)
    return result
  } catch (error) {
    console.error("Error updating opportunity:", error)
    throw error
  }
}

// Delete an opportunity
export async function deleteOpportunity(id: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase.from("opportunities").delete().eq("id", id)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting opportunity:", error)
    throw error
  }
}

