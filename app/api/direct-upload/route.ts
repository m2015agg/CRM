import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    console.log("Direct upload API route called")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("No file provided")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log("File received:", file.name, file.type, file.size)

    // Generate a unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const filename = `direct-upload/${timestamp}-${randomString}-${file.name}`

    console.log(`Uploading file to Vercel Blob as ${filename}`)

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log("File uploaded successfully:", blob.url)

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("Error in direct upload API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

