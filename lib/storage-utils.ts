import { getSupabaseClient } from "./supabase/client"
import { v4 as uuidv4 } from "uuid"

// Cache bucket existence to avoid repeated checks
const bucketExistsCache: Record<string, boolean> = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const bucketCacheTimestamps: Record<string, number> = {}

// Function to ensure a bucket exists before uploading
async function ensureBucketExists(bucket: string, forceCheck = false): Promise<boolean> {
  try {
    // Check cache first if not forcing a check
    const now = Date.now()
    if (
      !forceCheck &&
      bucketExistsCache[bucket] !== undefined &&
      bucketCacheTimestamps[bucket] &&
      now - bucketCacheTimestamps[bucket] < CACHE_DURATION
    ) {
      return bucketExistsCache[bucket]
    }

    const supabase = getSupabaseClient()

    // First try to check by listing files in the bucket
    try {
      const { data, error } = await supabase.storage.from(bucket).list()

      if (!error) {
        // If we can list files (even if empty), the bucket exists
        console.log(`Bucket ${bucket} exists (verified by listing files)`)
        bucketExistsCache[bucket] = true
        bucketCacheTimestamps[bucket] = now
        return true
      }
    } catch (err) {
      console.log(`Could not verify bucket ${bucket} by listing files:`, err)
      // Continue to the next method if this fails
    }

    // Fallback: try listing all buckets
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()

      if (listError) {
        console.error("Error listing buckets:", listError)
        return false
      }

      // Check if our bucket is in the list (case insensitive)
      const bucketExists = buckets.some((b) => b.name.toLowerCase() === bucket.toLowerCase())

      // Update cache
      bucketExistsCache[bucket] = bucketExists
      bucketCacheTimestamps[bucket] = now

      if (!bucketExists) {
        console.log(`Bucket '${bucket}' not found. This requires admin configuration.`)
      }

      return bucketExists
    } catch (err) {
      console.error("Error listing buckets:", err)
      return false
    }
  } catch (error) {
    console.error("Error in ensureBucketExists:", error)
    return false
  }
}

export async function uploadFile(file: File, bucket: string, folder: string): Promise<string | null> {
  try {
    const supabase = getSupabaseClient()

    // Ensure bucket exists before uploading
    const bucketExists = await ensureBucketExists(bucket)
    if (!bucketExists) {
      throw new Error(
        `Storage bucket '${bucket}' does not exist. This bucket needs to be created in the Supabase dashboard by an administrator.`,
      )
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${folder}/${uuidv4()}.${fileExt}`

    console.log(`Uploading file to ${bucket}/${fileName}`)
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading file:", error)
      throw error
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    console.log(`File uploaded successfully. Public URL: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error("Error in uploadFile:", error)
    throw error
  }
}

export async function deleteFile(path: string, bucket: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Ensure bucket exists before attempting to delete
    const bucketExists = await ensureBucketExists(bucket)
    if (!bucketExists) {
      throw new Error(
        `Storage bucket '${bucket}' does not exist. This bucket needs to be created in the Supabase dashboard by an administrator.`,
      )
    }

    // Extract the file path from the public URL
    const urlParts = path.split(`${bucket}/`)
    if (urlParts.length < 2) return false

    const filePath = urlParts[1]

    console.log(`Deleting file: ${bucket}/${filePath}`)
    const { error } = await supabase.storage.from(bucket).remove([filePath])

    if (error) {
      console.error("Error deleting file:", error)
      return false
    }

    console.log(`File deleted successfully: ${bucket}/${filePath}`)
    return true
  } catch (error) {
    console.error("Error in deleteFile:", error)
    return false
  }
}

// Function to clear the bucket cache
export function clearBucketCache() {
  Object.keys(bucketExistsCache).forEach((key) => {
    delete bucketExistsCache[key]
    delete bucketCacheTimestamps[key]
  })
}

// Revised function to test bucket access without violating RLS policies
export async function testBucketAccess(
  bucket: string,
): Promise<{ exists: boolean; canRead: boolean; canWrite: boolean; message: string }> {
  try {
    const supabase = getSupabaseClient()
    const result = {
      exists: false,
      canRead: false,
      canWrite: false,
      message: "",
    }

    // First check if we can list files (read access)
    try {
      const { data, error } = await supabase.storage.from(bucket).list()

      if (!error) {
        result.exists = true
        result.canRead = true
        result.message = "Bucket exists and you have read access."
      } else if (error.message.includes("does not exist")) {
        result.message = "Bucket does not exist."
      } else if (error.message.includes("security policy")) {
        result.exists = true
        result.message = "Bucket exists but you don't have read access due to RLS policies."
      } else {
        result.message = `Error checking read access: ${error.message}`
      }
    } catch (err) {
      result.message = `Error checking read access: ${err instanceof Error ? err.message : String(err)}`
    }

    // Only test write access if the bucket exists
    if (result.exists) {
      try {
        // Get bucket info to check if it's public
        const { data: buckets, error: listError } = await supabase.storage.listBuckets()

        if (!listError) {
          const bucketInfo = buckets.find((b) => b.name.toLowerCase() === bucket.toLowerCase())
          if (bucketInfo) {
            result.message += ` Bucket is ${bucketInfo.public ? "public" : "private"}.`
          }
        }

        // We won't actually try to upload a file since that's what caused the RLS violation
        // Instead, we'll just note that write access requires proper RLS policies
        result.message += " Write access requires appropriate RLS policies."
      } catch (err) {
        // Don't update the message if this fails
      }
    }

    return result
  } catch (err) {
    console.error(`Error testing bucket ${bucket} access:`, err)
    return {
      exists: false,
      canRead: false,
      canWrite: false,
      message: `Error testing bucket access: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

