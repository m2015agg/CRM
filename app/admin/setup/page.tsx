"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Info, ExternalLink, ShieldAlert } from "lucide-react"
import { BackButton } from "@/components/back-button"
import Link from "next/link"

// Define the buckets we need
const REQUIRED_BUCKETS = [
  { name: "attachments", description: "For storing call note attachments" },
  { name: "avatars", description: "For storing user profile pictures" },
]

interface BucketStatus {
  exists: boolean
  canRead: boolean
  canWrite: boolean
  message: string
}

export default function SetupPage() {
  const { user } = useAuth()
  const [isChecking, setIsChecking] = useState(false)
  const [bucketStatus, setBucketStatus] = useState<Record<string, boolean>>({})
  const [detailedStatus, setDetailedStatus] = useState<Record<string, BucketStatus>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [showRlsInfo, setShowRlsInfo] = useState(false)

  const supabase = getSupabaseClient()

  // Memoize the checkBuckets function to prevent recreation on each render
  const checkBuckets = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (isChecking) return

    setIsChecking(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("Checking buckets...")

      // Get a fresh Supabase client
      const supabase = getSupabaseClient()

      // First try to list buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()

      if (listError) {
        console.error("Error listing buckets:", listError)
        setError(`Failed to list buckets: ${listError.message}`)
        setIsChecking(false)
        return
      }

      console.log("Buckets found:", buckets)

      // If no buckets were found, try an alternative approach
      if (!buckets || buckets.length === 0) {
        console.log("No buckets found via listBuckets, trying alternative check...")

        // Try to check each bucket individually by attempting to list files
        const status: Record<string, boolean> = {}
        const detailed: Record<string, BucketStatus> = {}

        for (const bucket of REQUIRED_BUCKETS) {
          try {
            // Try to list files in the bucket
            const { data, error } = await supabase.storage.from(bucket.name).list()

            // If we can list files (even if empty), the bucket exists
            if (!error) {
              console.log(`Bucket ${bucket.name} exists (verified by listing files)`)
              status[bucket.name] = true
              detailed[bucket.name] = {
                exists: true,
                canRead: true,
                canWrite: false, // We don't know yet
                message: "Bucket exists and you have read access.",
              }
            } else {
              console.error(`Error checking bucket ${bucket.name}:`, error)
              status[bucket.name] = false
              detailed[bucket.name] = {
                exists: false,
                canRead: false,
                canWrite: false,
                message: error.message,
              }
            }
          } catch (err) {
            console.error(`Error checking bucket ${bucket.name}:`, err)
            status[bucket.name] = false
            detailed[bucket.name] = {
              exists: false,
              canRead: false,
              canWrite: false,
              message: err instanceof Error ? err.message : String(err),
            }
          }
        }

        setBucketStatus(status)
        setDetailedStatus(detailed)
        setLastChecked(new Date())

        const allExist = Object.values(status).every((exists) => exists)
        if (allExist) {
          setSuccess("All required storage buckets exist!")
        } else {
          // If some buckets weren't found, show a more helpful message
          setError(
            "Some buckets were not found. If you've already created them, ensure they are public and that your Supabase API key has the correct permissions.",
          )
        }
      } else {
        // Process buckets normally if listBuckets worked
        const status: Record<string, boolean> = {}
        const detailed: Record<string, BucketStatus> = {}

        REQUIRED_BUCKETS.forEach((bucket) => {
          const bucketInfo = buckets.find((b) => b.name.toLowerCase() === bucket.name.toLowerCase())
          const exists = !!bucketInfo

          status[bucket.name] = exists
          detailed[bucket.name] = {
            exists,
            canRead: exists, // If we can list buckets, we probably have read access
            canWrite: false, // We don't know yet
            message: exists
              ? `Bucket exists. It is ${bucketInfo?.public ? "public" : "private"}.`
              : "Bucket not found.",
          }

          console.log(`Bucket ${bucket.name}: ${exists ? "Found" : "Not found"}`)
        })

        setBucketStatus(status)
        setDetailedStatus(detailed)
        setLastChecked(new Date())

        const allExist = Object.values(status).every((exists) => exists)
        if (allExist) {
          setSuccess("All required storage buckets exist!")
        } else {
          // Some buckets weren't found
          const missing = REQUIRED_BUCKETS.filter((bucket) => !status[bucket.name])
          console.log(
            "Missing buckets:",
            missing.map((b) => b.name),
          )
        }
      }
    } catch (err) {
      console.error("Error checking buckets:", err)
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsChecking(false)
    }
  }, [supabase, isChecking])

  // Check buckets on initial load only
  useEffect(() => {
    // Only run once on component mount
    checkBuckets()
  }, [])

  const getMissingBuckets = () => {
    return REQUIRED_BUCKETS.filter((bucket) => !bucketStatus[bucket.name])
  }

  const hasMissingBuckets = () => {
    return getMissingBuckets().length > 0
  }

  const handleCheckBuckets = () => {
    // Manual check triggered by button
    checkBuckets()
  }

  // Add a new function to test bucket access directly
  const testBucketAccess = async (bucketName: string) => {
    setIsChecking(true)

    try {
      const { testBucketAccess } = await import("@/lib/storage-utils")
      const result = await testBucketAccess(bucketName)

      // Update the detailed status
      setDetailedStatus((prev) => ({
        ...prev,
        [bucketName]: result,
      }))

      // Update the simple status based on existence
      setBucketStatus((prev) => ({
        ...prev,
        [bucketName]: result.exists,
      }))

      // Show success or error message
      if (result.exists) {
        setSuccess(`Bucket "${bucketName}" exists. ${result.message}`)

        // If we found RLS policy issues, show the RLS info
        if (result.message.includes("RLS") || result.message.includes("policy")) {
          setShowRlsInfo(true)
        }
      } else {
        setError(`Bucket "${bucketName}" not found or not accessible. ${result.message}`)
      }
    } catch (err) {
      console.error(`Error testing bucket ${bucketName}:`, err)
      setError(`Error testing bucket "${bucketName}": ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <BackButton href="/dashboard" label="Back to Dashboard" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Storage Setup</CardTitle>
            <CardDescription>Configure storage buckets required for the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="border-green-500 bg-green-50 text-green-700">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-medium">Required Storage Buckets:</p>
                {lastChecked && (
                  <p className="text-xs text-muted-foreground">Last checked: {lastChecked.toLocaleTimeString()}</p>
                )}
              </div>

              <ul className="list-none space-y-4">
                {REQUIRED_BUCKETS.map((bucket) => (
                  <li key={bucket.name} className="border rounded-md p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{bucket.name}</h3>
                        <p className="text-sm text-muted-foreground">{bucket.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testBucketAccess(bucket.name)}
                        disabled={isChecking}
                      >
                        Test Access
                      </Button>
                    </div>

                    {detailedStatus[bucket.name] ? (
                      <div className="text-sm mt-2">
                        <div className="flex items-center gap-2">
                          <span className={detailedStatus[bucket.name].exists ? "text-green-600" : "text-red-600"}>
                            {detailedStatus[bucket.name].exists ? "✓ Exists" : "✗ Missing"}
                          </span>

                          {detailedStatus[bucket.name].exists && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span
                                className={detailedStatus[bucket.name].canRead ? "text-green-600" : "text-amber-600"}
                              >
                                {detailedStatus[bucket.name].canRead ? "✓ Can Read" : "⚠ Read Access Unknown"}
                              </span>
                            </>
                          )}
                        </div>

                        {detailedStatus[bucket.name].message && (
                          <p className="mt-1 text-gray-600">{detailedStatus[bucket.name].message}</p>
                        )}
                      </div>
                    ) : bucketStatus[bucket.name] !== undefined ? (
                      <div className="text-sm mt-2">
                        <span className={bucketStatus[bucket.name] ? "text-green-600" : "text-red-600"}>
                          {bucketStatus[bucket.name] ? "✓ Exists" : "✗ Missing"}
                        </span>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>

              {hasMissingBuckets() && (
                <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
                  <Info className="h-4 w-4 text-amber-500" />
                  <AlertTitle>Manual Setup Required</AlertTitle>
                  <AlertDescription className="text-sm">
                    <p className="mb-2">
                      Due to Supabase security restrictions, buckets must be created manually in the Supabase dashboard.
                      Automatic creation is not possible with regular authentication.
                    </p>

                    <p className="font-medium mb-1">Follow these steps to create the missing buckets:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>
                        Go to your{" "}
                        <a
                          href="https://app.supabase.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center"
                        >
                          Supabase Dashboard <ExternalLink className="h-3 w-3 ml-0.5" />
                        </a>
                      </li>
                      <li>Select your project</li>
                      <li>Navigate to "Storage" in the left sidebar</li>
                      <li>Click "New Bucket"</li>
                      <li>Enter the bucket name exactly as shown below (case-sensitive)</li>
                      <li>Enable "Public bucket" for file access</li>
                      <li>Click "Create bucket"</li>
                      <li>Repeat for each missing bucket</li>
                    </ol>

                    <div className="mt-3 p-2 bg-amber-100 rounded-md">
                      <p className="font-medium mb-1">Missing buckets to create:</p>
                      <ul className="list-disc pl-5">
                        {getMissingBuckets().map((bucket) => (
                          <li key={bucket.name} className="font-mono text-sm">
                            {bucket.name}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="mt-3">
                      After creating the buckets manually, click "Check Buckets" to verify they're properly set up.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* RLS Policy Information */}
              <Alert variant="default" className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle>About Supabase Storage</AlertTitle>
                <AlertDescription className="text-sm">
                  <p>
                    Supabase Storage uses row-level security (RLS) policies to control access to buckets and files.
                    Creating buckets requires admin privileges in the Supabase dashboard.
                  </p>
                  <p className="mt-2">
                    Once buckets are created, you'll need to configure RLS policies to control who can upload and access
                    files. By default, public buckets allow anyone to read files but restrict uploads to authenticated
                    users.
                  </p>

                  <Button
                    variant="link"
                    className="p-0 h-auto mt-1 text-blue-600"
                    onClick={() => setShowRlsInfo(!showRlsInfo)}
                  >
                    {showRlsInfo ? "Hide RLS policy information" : "Show RLS policy information"}
                  </Button>

                  {showRlsInfo && (
                    <div className="mt-3 p-3 bg-white border rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                        <h4 className="font-medium">RLS Policy Information</h4>
                      </div>

                      <p className="mb-2">
                        If you're seeing "violates row-level security policy" errors, you need to configure appropriate
                        RLS policies in the Supabase dashboard:
                      </p>

                      <ol className="list-decimal pl-5 space-y-1 mb-3">
                        <li>Go to the Supabase Dashboard</li>
                        <li>Navigate to Storage</li>
                        <li>Select the bucket</li>
                        <li>Click on "Policies" tab</li>
                        <li>Add appropriate policies for your use case</li>
                      </ol>

                      <p className="font-medium mb-1">Example RLS Policy for Authenticated Users:</p>
                      <pre className="bg-gray-100 p-2 rounded-md text-xs overflow-x-auto mb-2">
                        {`-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments' AND auth.uid() = owner);

-- Allow users to access their own files
CREATE POLICY "Allow individual access"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner);`}
                      </pre>

                      <p className="text-xs text-muted-foreground">
                        Note: These are example policies. You should customize them based on your application's security
                        requirements.
                      </p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCheckBuckets} disabled={isChecking}>
              {isChecking ? "Checking..." : "Check Buckets"}
            </Button>

            <Button variant="default" asChild>
              <Link
                href="https://app.supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                Open Supabase Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

