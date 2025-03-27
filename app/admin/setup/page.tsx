"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Info, ExternalLink, AlertCircle, Copy } from "lucide-react"
import { BackButton } from "@/components/back-button"
import { BlobDebug } from "@/components/blob-debug"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { testBlobAccessAction } from "@/lib/blob-actions"

export default function SetupPage() {
  const { user } = useAuth()
  const [isChecking, setIsChecking] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("setup")
  const [copied, setCopied] = useState(false)

  const testBlobAccess = async () => {
    setIsChecking(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await testBlobAccessAction()

      if (result.success) {
        setSuccess(result.message)
      } else {
        setError(result.error || "Failed to test Blob access")
      }
    } catch (err) {
      console.error("Error testing Vercel Blob:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsChecking(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <BackButton href="/dashboard" label="Back to Dashboard" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Vercel Blob Storage Setup</CardTitle>
            <CardDescription>Configure Vercel Blob for file storage</CardDescription>
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
              <Alert className="border-green-500 bg-green-50 text-green-700">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="setup">Setup Instructions</TabsTrigger>
                <TabsTrigger value="test">Test & Debug</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="space-y-4 mt-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertTitle>About Vercel Blob</AlertTitle>
                  <AlertDescription className="text-sm">
                    <p className="mb-2">
                      Vercel Blob is a storage solution for files like images, videos, and documents. It's designed to
                      work seamlessly with Vercel deployments.
                    </p>
                    <p>Key features:</p>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      <li>Simple API for uploading and managing files</li>
                      <li>Automatic CDN distribution for fast global access</li>
                      <li>Secure access control</li>
                      <li>No need to configure buckets or permissions</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Card className="border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Setting Up Vercel Blob</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ol className="list-decimal pl-5 space-y-3">
                      <li>
                        <p className="font-medium">Create a Vercel Blob Store</p>
                        <p className="text-sm text-muted-foreground">
                          Go to your Vercel dashboard, navigate to Storage, and create a new Blob store.
                        </p>
                      </li>
                      <li>
                        <p className="font-medium">Get your Blob token</p>
                        <p className="text-sm text-muted-foreground">
                          After creating the store, Vercel will provide you with a BLOB_READ_WRITE_TOKEN.
                        </p>
                      </li>
                      <li>
                        <p className="font-medium">Add the token to your environment variables</p>
                        <p className="text-sm text-muted-foreground">
                          In your Vercel project settings, add the BLOB_READ_WRITE_TOKEN to your environment variables.
                        </p>
                        <div className="bg-gray-100 p-2 rounded-md mt-2 flex justify-between items-center">
                          <code className="text-sm">BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard("BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here")}
                            className="h-8 w-8 p-0"
                          >
                            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </li>
                      <li>
                        <p className="font-medium">For local development</p>
                        <p className="text-sm text-muted-foreground">
                          Add the same token to your local .env file or use Vercel CLI to pull environment variables.
                        </p>
                        <div className="bg-gray-100 p-2 rounded-md mt-2 flex justify-between items-center">
                          <code className="text-sm">vercel env pull .env.local</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard("vercel env pull .env.local")}
                            className="h-8 w-8 p-0"
                          >
                            {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </li>
                      <li>
                        <p className="font-medium">Redeploy your application</p>
                        <p className="text-sm text-muted-foreground">
                          After setting up the environment variable, redeploy your application for the changes to take
                          effect.
                        </p>
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="test" className="space-y-4 mt-4">
                <Card className="border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Vercel Blob Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      Click the button below to test if Vercel Blob is working correctly. This will attempt to upload a
                      small test file.
                    </p>
                    <Button onClick={testBlobAccess} disabled={isChecking}>
                      {isChecking ? "Testing..." : "Test Vercel Blob"}
                    </Button>
                  </CardContent>
                </Card>

                <div className="mt-6 pt-6 border-t">
                  <h2 className="text-lg font-medium mb-4">Blob URL Debugging</h2>
                  <BlobDebug />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <a
                href="https://vercel.com/docs/storage/vercel-blob"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center"
              >
                Learn More About Vercel Blob
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

