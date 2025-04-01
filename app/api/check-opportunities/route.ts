import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create a Supabase client with service role key to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Count total opportunities
    const { count, error: countError } = await supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })

    if (countError) {
      return NextResponse.json({
        error: `Error counting opportunities: ${countError.message}`,
      })
    }

    // Get a sample of opportunities
    const { data: sample, error: sampleError } = await supabase.from("opportunities").select("*").limit(3)

    if (sampleError) {
      return NextResponse.json({
        count,
        error: `Error fetching sample: ${sampleError.message}`,
      })
    }

    return NextResponse.json({ count, sample })
  } catch (error) {
    return NextResponse.json({ error: error.message })
  }
}

