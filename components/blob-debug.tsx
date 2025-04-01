"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FilePreview } from "@/components/file-preview"
import { AlertCircle, CheckCircle } from "lucide-react"

export function BlobDebug() {
  const [blobUrl, setBlobUrl] = useState("")
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const testBlobUrl = async () => {
    if (!blobUrl) return

    try {
      // Test if the URL is accessible
      const response = await fetch(blobUrl, { method: "HEAD" })

      if (response.ok) {
        setTestResult({
          success: true,
          message: `URL is accessible (Status: ${response.status})`,
        })
        setShowPreview(true)
      } else {
        setTestResult({
          success: false,
          message: `URL returned status: ${response.status} ${response.statusText}`,
        })
        setShowPreview(false)
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error accessing URL: ${error instanceof Error ? error.message : String(error)}`,
      })
      setShowPreview(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blob URL Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Blob URL to test"
            value={blobUrl}
            onChange={(e) => setBlobUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={testBlobUrl}>Test URL</Button>
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{testResult.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {showPreview && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Preview:</h3>
            <FilePreview url={blobUrl} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

