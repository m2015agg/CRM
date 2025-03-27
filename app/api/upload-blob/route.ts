import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Log file details
    console.log("API route - File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Generate a unique filename with the original extension
    const originalName = file.name
    const extension = originalName.split(".").pop() || ""
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const filename = `api-test/${timestamp}-${randomString}.${extension}`

    console.log(`API route - Uploading file ${originalName} to Vercel Blob as ${filename}`)

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined,
    })

    console.log("API route - File uploaded successfully to Vercel Blob:", blob.url)

    // Return the URL
    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("API route - Error uploading file to Vercel Blob:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred during upload",
      },
      { status: 500 },
    )
  }
}

