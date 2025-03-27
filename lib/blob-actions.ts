"use server"

import { put, del, list } from "@vercel/blob"

// Upload a file to Vercel Blob
export async function uploadFileToBlobAction(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || ""

    if (!file) {
      console.error("No file provided in formData")
      return { success: false, error: "No file provided" }
    }

    // Log file details
    console.log("File details:", {
      name: file.name,
      type: file.type,
      size: file.size,
      folder: folder,
    })

    // Generate a unique filename with the original extension
    const originalName = file.name
    const extension = originalName.split(".").pop() || ""
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const filename = `${folder ? folder + "/" : ""}${timestamp}-${randomString}.${extension}`

    console.log(`Uploading file ${originalName} to Vercel Blob as ${filename}`)

    // Create a promise with a timeout
    const uploadPromise = new Promise<any>(async (resolve, reject) => {
      try {
        // Set a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          reject(new Error("Upload timed out after 30 seconds"))
        }, 30000)

        // Upload to Vercel Blob with explicit content type
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: false,
          contentType: file.type || undefined,
        })

        // Clear the timeout
        clearTimeout(timeoutId)

        console.log("File uploaded successfully to Vercel Blob:", blob.url)
        resolve(blob)
      } catch (error) {
        reject(error)
      }
    })

    // Wait for the upload to complete or timeout
    const blob = await uploadPromise

    // Return the URL
    return { success: true, url: blob.url }
  } catch (error) {
    console.error("Error uploading file to Vercel Blob:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred during upload",
    }
  }
}

// Delete a file from Vercel Blob
export async function deleteFileFromBlobAction(url: string) {
  try {
    console.log(`Deleting file from Vercel Blob: ${url}`)

    // Extract the pathname from the URL
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname

    // Delete from Vercel Blob
    await del(pathname)

    console.log("File deleted successfully from Vercel Blob")

    // Return success
    return { success: true }
  } catch (error) {
    console.error("Error deleting file from Vercel Blob:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred during deletion",
    }
  }
}

// List files in a folder
export async function listFilesInBlobAction(folder: string) {
  try {
    console.log(`Listing files in Vercel Blob folder: ${folder}`)

    // List files in the folder
    const { blobs } = await list({ prefix: folder })

    console.log(`Found ${blobs.length} files in folder ${folder}`)

    // Return the list of files
    return {
      success: true,
      files: blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })),
    }
  } catch (error) {
    console.error("Error listing files in Vercel Blob:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred while listing files",
      files: [],
    }
  }
}

// Test Blob access to verify configuration
export async function testBlobAccessAction() {
  try {
    console.log("Testing Vercel Blob access...")

    // Create a test file name with timestamp to avoid conflicts
    const testFileName = `test-blob-access-${Date.now()}.txt`

    // Create a simple text file for testing
    const testContent = new Blob(["This is a test file to verify Blob access."], {
      type: "text/plain",
    })

    // Upload the test file
    const blob = await put(testFileName, testContent, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log("Test file uploaded successfully:", blob.url)

    // Delete the test file to clean up
    await del(testFileName)

    console.log("Test file deleted successfully")

    // Return success with the URL (even though it's deleted)
    return {
      success: true,
      message: "Blob access test successful. Upload and delete operations completed.",
      testUrl: blob.url,
    }
  } catch (error) {
    console.error("Error testing Blob access:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred during Blob access test",
      message: "Blob access test failed. Check your environment variables and permissions.",
    }
  }
}

