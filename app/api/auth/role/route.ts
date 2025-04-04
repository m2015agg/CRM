import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get cookies and create route handler client
    const cookieStore = cookies()
    console.log("Role API: Cookie store available:", !!cookieStore)
    
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    console.log("Role API: Supabase client created")

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log("Role API: Session check result:", { 
      hasSession: !!session, 
      hasError: !!sessionError,
      userId: session?.user?.id 
    })

    if (sessionError) {
      console.error("Role API: Session error", {
        error: sessionError,
        message: sessionError.message
      })
      return NextResponse.json({ error: "Session error" }, { status: 401 })
    }

    if (!session) {
      console.error("Role API: No session found")
      return NextResponse.json({ error: "No session" }, { status: 401 })
    }

    console.log("Role API: Session found for user:", session.user.id)

    // Get user data using the regular client
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, full_name, avatar_url")
      .eq("id", session.user.id)
      .single()

    if (userError) {
      console.error("Role API: Error fetching user data:", {
        error: userError,
        userId: session.user.id,
        errorCode: userError.code,
        errorMessage: userError.message
      })
      return NextResponse.json({ 
        error: "Failed to fetch user role",
        details: userError.message,
        code: userError.code
      }, { status: 500 })
    }

    if (!userData) {
      console.error("Role API: No user data found for ID:", session.user.id)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("Role API: Successfully fetched user data:", {
      userId: session.user.id,
      role: userData.role,
      fullName: userData.full_name
    })

    return NextResponse.json({
      success: true,
      ...userData
    })
  } catch (error) {
    console.error("Role API: Unexpected error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
} 