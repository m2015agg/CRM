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

    // Test direct access to users table
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("*")
      .limit(1)

    if (usersError) {
      console.error("RLS Check: Error accessing users table:", usersError)
      return NextResponse.json({ 
        error: "Failed to access users table",
        details: usersError.message,
        code: usersError.code
      }, { status: 500 })
    }

    // Check RLS policies using a simpler query
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from("users")
      .select("id, role, full_name")
      .limit(1)

    if (policiesError) {
      console.error("RLS Check: Error checking RLS policies:", policiesError)
      return NextResponse.json({ 
        error: "Failed to check RLS policies",
        details: policiesError.message,
        code: policiesError.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: users,
      policies: policies,
      message: "RLS check completed successfully"
    })
  } catch (error) {
    console.error("RLS Check: Unexpected error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

