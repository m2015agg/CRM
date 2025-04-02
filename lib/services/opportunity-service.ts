import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/supabase"

type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"]
type OpportunityInsert = Database["public"]["Tables"]["opportunities"]["Insert"]
type OpportunityUpdate = Database["public"]["Tables"]["opportunities"]["Update"]

// Get all opportunities
export async function getOpportunities(): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Error getting opportunities:", error)
    throw error
  }
}

// Update the createOpportunity function to handle nullable fields correctly
export async function createOpportunity(data: {
  name?: string
  title?: string
  company_name: string
  contact_name?: string
  description?: string
  value?: number
  status?: string
  expected_close_date?: Date
  request_machine?: string
  requested_attachments?: string
}): Promise<Opportunity> {
  try {
    // Get current user ID
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()
    
    if (userError) {
      console.error("Error getting user:", userError)
      throw new Error(`Authentication error: ${userError.message}`)
    }
    
    if (!user) {
      throw new Error("User not authenticated")
    }

    console.log("Current user:", user)

    // Map form fields to database fields
    const name = data.title || data.name

    // Ensure all required fields are present
    if (!name) throw new Error("Title is required")
    if (!data.company_name) throw new Error("Company name is required")

    // Prepare the data for insertion
    const opportunityData = {
      name: name.trim(),
      company_name: data.company_name.trim(),
      contact_name: data.contact_name?.trim() || null,
      description: data.description?.trim() || null,
      value: typeof data.value === 'number' ? data.value : 0,
      status: data.status?.trim() || "new",
      expected_close_date: data.expected_close_date?.toISOString() || null,
      owner_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      request_machine: data.request_machine?.trim() || null,
      requested_attachments: data.requested_attachments?.trim() || null,
    }

    console.log("Creating opportunity with data:", opportunityData)

    // Insert the opportunity
    const { data: result, error: insertError } = await supabase
      .from("opportunities")
      .insert([opportunityData])
      .select()
      .single()

    if (insertError) {
      console.error("Supabase error creating opportunity:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        data: opportunityData
      })
      throw new Error(`Failed to create opportunity: ${insertError.message}`)
    }

    if (!result) {
      throw new Error("No data returned after successful insert")
    }

    console.log("Opportunity created successfully:", result)
    return result
  } catch (error) {
    // Enhanced error logging
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorDetails = {
      message: errorMessage,
      stack: errorStack,
      data: data,
      timestamp: new Date().toISOString()
    }
    
    console.error("Error creating opportunity:", errorDetails)
    throw new Error(`Failed to create opportunity: ${errorMessage}`)
  }
}

// Update an opportunity's status
export async function updateOpportunityStatus(id: string, status: string): Promise<Opportunity> {
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
    title?: string
    company_name?: string
    contact_name?: string
    description?: string | null
    value?: number
    status?: string
    expected_close_date?: Date | null
    request_machine?: string | null
    requested_attachments?: string | null
  },
): Promise<Opportunity> {
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
  try {
    const { error } = await supabase.from("opportunities").delete().eq("id", id)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error deleting opportunity:", error)
    throw error
  }
}

