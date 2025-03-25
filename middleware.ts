import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/lib/database.types"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    // Create a middleware-specific client
    const supabase = createMiddlewareClient<Database>({
      req,
      res,
    })

    // Get session
    const { data } = await supabase.auth.getSession()
    const session = data.session

    // If user is signed in and the current path is /login,
    // redirect the user to /dashboard
    if (session && req.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to continue
    return res
  }
}

// Only apply middleware to the login route
export const config = {
  matcher: ["/login"],
}

