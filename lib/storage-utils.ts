import { uploadFileToBlobAction, deleteFileFromBlobAction } from "@/lib/blob-actions"

// Define bucket constants for backward compatibility
export const ATTACHMENTS_BUCKET = "attachments"
export const AVATARS_BUCKET = "avatars"
export const RECEIPTS_BUCKET = "receipts"

/**
 * Uploads a file to Vercel Blob
 * @param file The file to upload
 * @param bucket Deprecated, use folder instead
 * @param folder Optional folder path
 * @returns The URL of the uploaded file
 */
export async function uploadFile(file: File, bucket = "", folder = ""): Promise<string> {
  try {
    // For backward compatibility, use bucket as folder if folder is not provided
    const folderPath = folder || bucket

    // Create FormData and append the file
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folderPath)

    // Upload using server action
    const result = await uploadFileToBlobAction(formData)

    if (result.success && result.url) {
      return result.url
    } else {
      throw new Error(result.error || "Failed to upload file")
    }
  } catch (error) {
    console.error("Error in uploadFile:", error)
    throw error
  }
}

/**
 * Gets the public URL for a file
 * @param url The file URL
 * @returns The public URL of the file
 */
export async function getFileUrl(url: string): Promise<string> {
  // With Vercel Blob, the URL is already public
  return url
}

/**
 * Deletes a file
 * @param url The file URL
 * @returns A boolean indicating success
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    const result = await deleteFileFromBlobAction(url)
    return result.success
  } catch (error) {
    console.error("Error in deleteFile:", error)
    return false
  }
}

/**
 * Tests if storage is accessible
 * @returns A status object with details about the storage access
 */
export async function testBucketAccess(): Promise<{
  exists: boolean
  canRead: boolean
  canWrite: boolean
  message: string
}> {
  try {
    // Create a small test file
    const testContent = "test-" + Date.now()
    const testBlob = new Blob([testContent], { type: "text/plain" })
    const testFile = new File([testBlob], "test.txt", { type: "text/plain" })

    // Try to upload
    const url = await uploadFile(testFile, "test")

    return {
      exists: true,
      canRead: true,
      canWrite: true,
      message: "Vercel Blob is ready to use.",
    }
  } catch (error) {
    console.error("Error testing bucket access:", error)
    return {
      exists: false,
      canRead: false,
      canWrite: false,
      message: error instanceof Error ? error.message : "Failed to access Vercel Blob",
    }
  }
}

