import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create a service role client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get all policies for the users table
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from("users")
      .select("id, role, full_name")
      .limit(1)

    if (policiesError) {
      console.error("Policy Check: Error checking policies:", policiesError)
      return NextResponse.json({ 
        error: "Failed to check policies",
        details: policiesError.message,
        code: policiesError.code
      }, { status: 500 })
    }

    // Get the current RLS policies
    const { data: rlsPolicies, error: rlsError } = await supabaseAdmin
      .rpc('get_rls_policies', { table_name: 'users' })

    if (rlsError) {
      console.error("Policy Check: Error getting RLS policies:", rlsError)
      return NextResponse.json({ 
        error: "Failed to get RLS policies",
        details: rlsError.message,
        code: rlsError.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      policies: rlsPolicies,
      message: "Policy check completed successfully"
    })
  } catch (error) {
    console.error("Policy Check: Unexpected error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 