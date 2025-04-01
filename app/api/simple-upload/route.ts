import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Simple upload API route called")

    // Just return a success response with a fake URL for testing
    return NextResponse.json({
      success: true,
      url: `https://example.com/test-file-${Date.now()}.txt`,
    })
  } catch (error) {
    console.error("Error in simple upload API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

