import { put, del, list } from "@vercel/blob"

/**
 * Checks if the BLOB_READ_WRITE_TOKEN environment variable is set
 * @returns Boolean indicating if the token is available
 */
export function isBlobTokenAvailable(): boolean {
  return typeof process.env.BLOB_READ_WRITE_TOKEN === "string" && process.env.BLOB_READ_WRITE_TOKEN.length > 0
}

/**
 * Uploads a file to Vercel Blob
 * @param file The file to upload
 * @param folder Optional folder path to organize files
 * @returns The URL of the uploaded file
 */
export async function uploadToBlob(file: File, folder = ""): Promise<string> {
  try {
    // Check if token is available
    if (!isBlobTokenAvailable()) {
      throw new Error(
        "BLOB_READ_WRITE_TOKEN environment variable is not set. Please configure it in your Vercel project settings.",
      )
    }

    // Generate a unique file path including the folder if provided
    const fileExt = file.name.split(".").pop()
    const fileName = `${folder ? `${folder}/` : ""}${crypto.randomUUID()}.${fileExt}`

    // Upload to Vercel Blob
    const { url } = await put(fileName, file, {
      access: "public",
    })

    return url
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Access denied") || error.message.includes("token")) {
        throw new Error(
          "Vercel Blob token error: Your BLOB_READ_WRITE_TOKEN may be invalid or missing. Please check your environment variables.",
        )
      }
    }

    throw error
  }
}

/**
 * Deletes a file from Vercel Blob
 * @param url The URL of the file to delete
 * @returns A boolean indicating success
 */
export async function deleteFromBlob(url: string): Promise<boolean> {
  try {
    // Check if token is available
    if (!isBlobTokenAvailable()) {
      console.error("BLOB_READ_WRITE_TOKEN environment variable is not set. Cannot delete blob.")
      return false
    }

    if (!url) {
      console.error("Invalid URL provided to deleteFromBlob")
      return false
    }

    // Extract the pathname from the URL
    const urlObj = new URL(url)

    // Get the full pathname without the domain
    const pathname = urlObj.pathname

    if (!pathname) {
      console.error("Invalid URL format:", url)
      return false
    }

    console.log("Deleting blob with pathname:", pathname)

    // Delete from Vercel Blob
    await del(pathname)
    return true
  } catch (error) {
    console.error("Error deleting from Vercel Blob:", error)
    return false
  }
}

/**
 * Lists files in Vercel Blob
 * @param prefix Optional prefix to filter files
 * @returns An array of file objects
 */
export async function listBlobFiles(prefix = ""): Promise<Array<{ name: string; url: string }>> {
  try {
    // Check if token is available
    if (!isBlobTokenAvailable()) {
      console.error("BLOB_READ_WRITE_TOKEN environment variable is not set. Cannot list blobs.")
      return []
    }

    const { blobs } = await list({ prefix })

    return blobs.map((blob) => ({
      name: blob.pathname,
      url: blob.url,
    }))
  } catch (error) {
    console.error("Error listing Vercel Blob files:", error)
    return []
  }
}

