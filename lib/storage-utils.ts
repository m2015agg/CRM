import { getSupabaseClient } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"

// Define bucket constants
export const ATTACHMENTS_BUCKET = "attachments"
export const AVATARS_BUCKET = "avatars"
export const RECEIPTS_BUCKET = "receipts"

/**
 * Uploads a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name
 * @param folder Optional folder path within the bucket
 * @returns The URL of the uploaded file
 */
export async function uploadFile(file: File, bucket: string, folder = ""): Promise<string> {
  try {
    const supabase = getSupabaseClient()

    // Generate a unique file name to prevent collisions
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`

    // Create the full path including the folder if provided
    const filePath = folder ? `${folder}/${fileName}` : fileName

    console.log(`Uploading file to ${bucket}/${filePath}`)

    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading file:", error)

      // Provide more specific error messages
      if (error.message.includes("row-level security") || error.message.includes("policy")) {
        throw new Error(`Row-level security policy violation: ${error.message}`)
      } else if (error.message.includes("bucket") || error.message.includes("Bucket")) {
        throw new Error(`Storage bucket error: ${error.message}`)
      }

      throw error
    }

    if (!data?.path) {
      throw new Error("File upload failed: No path returned")
    }

    // Return the full path including the bucket name for easier reference
    return `${bucket}/${data.path}`
  } catch (error) {
    console.error("Error in uploadFile:", error)
    throw error
  }
}

/**
 * Gets the public URL for a file in Supabase Storage
 * @param bucket The storage bucket name
 * @param path The file path within the bucket
 * @returns The public URL of the file
 */
export async function getFileUrl(bucket: string, path: string): Promise<string> {
  try {
    const supabase = getSupabaseClient()

    // Try to get a signed URL first (works even for private buckets)
    const { data: signedData, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(path, 3600) // 1 hour expiry

    if (!signedError && signedData?.signedUrl) {
      return signedData.signedUrl
    }

    // Fall back to public URL if signed URL fails
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)

    if (!data?.publicUrl) {
      throw new Error("Failed to get file URL")
    }

    return data.publicUrl
  } catch (error) {
    console.error("Error in getFileUrl:", error)
    throw error
  }
}

/**
 * Deletes a file from Supabase Storage
 * @param url The file URL or path
 * @returns A boolean indicating success
 */
export async function deleteFile(url: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Parse the URL to extract bucket and path
    const fileInfo = parseStorageUrl(url)

    if (!fileInfo) {
      console.error("Invalid file URL format:", url)
      return false
    }

    const { bucket, path } = fileInfo

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error("Error deleting file:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteFile:", error)
    return false
  }
}

/**
 * Parses a storage URL to extract bucket and path
 * @param url The storage URL to parse
 * @returns An object containing the bucket and path
 */
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  // Handle full Supabase URLs
  // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  const fullUrlMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/)
  if (fullUrlMatch) {
    return {
      bucket: fullUrlMatch[1],
      path: fullUrlMatch[2],
    }
  }

  // Handle bucket/path format
  // Format: [bucket]/[path]
  if (!url.startsWith("http")) {
    const parts = url.split("/")
    if (parts.length >= 2) {
      return {
        bucket: parts[0],
        path: parts.slice(1).join("/"),
      }
    }
  }

  return null
}

/**
 * Lists all files in a folder
 * @param bucket The storage bucket name
 * @param folder The folder path within the bucket
 * @returns An array of file objects
 */
export async function listFiles(bucket: string, folder = ""): Promise<Array<{ name: string; url: string }>> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.storage.from(bucket).list(folder)

    if (error) {
      console.error("Error listing files:", error)
      throw error
    }

    if (!data) {
      return []
    }

    // Filter out folders (items without a mimetype)
    const files = data.filter((item) => !item.id.endsWith("/"))

    // Get URLs for all files
    const fileUrls = await Promise.all(
      files.map(async (file) => {
        const path = folder ? `${folder}/${file.name}` : file.name
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        return {
          name: file.name,
          url: data.publicUrl,
        }
      }),
    )

    return fileUrls
  } catch (error) {
    console.error("Error in listFiles:", error)
    throw error
  }
}

/**
 * Copies a file within storage
 * @param sourceBucket Source bucket name
 * @param sourcePath Source file path
 * @param destBucket Destination bucket name
 * @param destPath Destination file path
 * @returns The URL of the copied file
 */
export async function copyFile(
  sourceBucket: string,
  sourcePath: string,
  destBucket: string,
  destPath: string,
): Promise<string> {
  try {
    const supabase = getSupabaseClient()

    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage.from(sourceBucket).download(sourcePath)

    if (downloadError) {
      console.error("Error downloading file for copy:", downloadError)
      throw downloadError
    }

    if (!fileData) {
      throw new Error("No file data received")
    }

    // Upload to the destination
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(destBucket)
      .upload(destPath, fileData, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading copied file:", uploadError)
      throw uploadError
    }

    if (!uploadData?.path) {
      throw new Error("File copy failed: No path returned")
    }

    // Return the full path including the bucket name
    return `${destBucket}/${uploadData.path}`
  } catch (error) {
    console.error("Error in copyFile:", error)
    throw error
  }
}

/**
 * Tests if a bucket exists and is accessible
 * @param bucketName The name of the bucket to test
 * @returns A status object with details about the bucket access
 */
export async function testBucketAccess(bucketName: string): Promise<{
  exists: boolean
  canRead: boolean
  canWrite: boolean
  message: string
}> {
  try {
    const supabase = getSupabaseClient()

    // Try to list files in the bucket
    const { data, error } = await supabase.storage.from(bucketName).list()

    if (error) {
      // Check for specific error types
      if (error.message.includes("does not exist")) {
        return {
          exists: false,
          canRead: false,
          canWrite: false,
          message: "Bucket does not exist.",
        }
      }

      if (error.message.includes("row-level security") || error.message.includes("policy")) {
        return {
          exists: true,
          canRead: false,
          canWrite: false,
          message: "Bucket exists but you don't have permission to read it. RLS policy needs to be configured.",
        }
      }

      return {
        exists: false,
        canRead: false,
        canWrite: false,
        message: error.message,
      }
    }

    // Bucket exists and we can read it
    // Now try to write to it
    const testFile = new Blob(["test"], { type: "text/plain" })
    const testFileName = `test-${Date.now()}.txt`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`test/${testFileName}`, testFile, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      // Check if it's an RLS policy issue
      if (uploadError.message.includes("row-level security") || uploadError.message.includes("policy")) {
        return {
          exists: true,
          canRead: true,
          canWrite: false,
          message: "You can read from this bucket but not write to it. RLS policy needs to be configured for uploads.",
        }
      }

      return {
        exists: true,
        canRead: true,
        canWrite: false,
        message: `Can read but not write: ${uploadError.message}`,
      }
    }

    // Clean up the test file
    if (uploadData?.path) {
      await supabase.storage.from(bucketName).remove([`test/${testFileName}`])
    }

    return {
      exists: true,
      canRead: true,
      canWrite: true,
      message: "Full access to bucket.",
    }
  } catch (error) {
    console.error("Error testing bucket access:", error)
    return {
      exists: false,
      canRead: false,
      canWrite: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

