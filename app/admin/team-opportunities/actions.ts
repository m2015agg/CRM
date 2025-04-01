"use server"

import { getSupabaseServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Get current user with role
export async function getCurrentUser() {
  const supabase = getSupabaseServer()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { user: null, role: null }
  }

  // Get user role from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (userError) {
    console.error("Error fetching user role:", userError)
    return { user, role: null }
  }

  return {
    user,
    role: userData?.role,
    fullName: userData?.full_name,
  }
}

// Get all team members (for admin use)
export async function getTeamMembers() {
  const supabase = getSupabaseServer()

  const { data: users, error } = await supabase.from("users").select("id, full_name, email, role").order("full_name")

  if (error) {
    console.error("Error fetching team members:", error)
    return []
  }

  return users
}

// Get all opportunities (for admin) or user's opportunities (for regular users)
export async function getOpportunities() {
  const { user, role } = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const supabase = getSupabaseServer()

  // The RLS policies will automatically filter based on user role
  const { data: opportunities, error } = await supabase
    .from("opportunities")
    .select(`
      *,
      users:owner_id (
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching opportunities:", error)
    return []
  }

  return { opportunities, userRole: role }
}

// Create a new opportunity (admins can create for any user)
export async function createOpportunity(formData: FormData) {
  const { user, role } = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const supabase = getSupabaseServer()

  // Get form data
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const status = formData.get("status") as string
  const value = Number.parseFloat(formData.get("value") as string) || null
  const clientName = formData.get("clientName") as string
  const expectedCloseDate = (formData.get("expectedCloseDate") as string) || null

  // For admins, they can set the owner_id to any user
  // For regular users, owner_id is always their own id
  let ownerId = user.id
  if (role === "admin") {
    const formOwnerId = formData.get("ownerId") as string
    if (formOwnerId) {
      ownerId = formOwnerId
    }
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      title,
      description,
      status,
      value,
      client_name: clientName,
      expected_close_date: expectedCloseDate,
      owner_id: ownerId,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating opportunity:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/team-opportunities")
  return { success: true, data }
}

// Update an opportunity (admins can update any, users can only update their own)
export async function updateOpportunity(id: string, formData: FormData) {
  const { user } = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const supabase = getSupabaseServer()

  // Get form data
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const status = formData.get("status") as string
  const value = Number.parseFloat(formData.get("value") as string) || null
  const clientName = formData.get("clientName") as string
  const expectedCloseDate = (formData.get("expectedCloseDate") as string) || null
  const ownerId = formData.get("ownerId") as string

  const { data, error } = await supabase
    .from("opportunities")
    .update({
      title,
      description,
      status,
      value,
      client_name: clientName,
      expected_close_date: expectedCloseDate,
      owner_id: ownerId || user.id,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating opportunity:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/team-opportunities")
  return { success: true, data }
}

// Delete an opportunity (admins can delete any, users can only delete their own)
export async function deleteOpportunity(id: string) {
  const { user } = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  const supabase = getSupabaseServer()

  const { error } = await supabase.from("opportunities").delete().eq("id", id)

  if (error) {
    console.error("Error deleting opportunity:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/team-opportunities")
  return { success: true }
}

