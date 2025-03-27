"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SimplifiedFileUpload } from "@/components/simplified-file-upload"

export function BlobUploadTest() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const handleFileUploaded = (url: string) => {
    console.log("File uploaded in test component:", url)
    setUploadedUrl(url)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Blob Upload Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SimplifiedFileUpload onFileUploaded={handleFileUploaded} folder="test-uploads" label="Upload Test File" />

        {uploadedUrl && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Uploaded File URL:</p>
            <div className="p-2 bg-gray-100 rounded-md overflow-x-auto">
              <code className="text-xs break-all">{uploadedUrl}</code>
            </div>
            {uploadedUrl.endsWith(".jpg") ||
            uploadedUrl.endsWith(".jpeg") ||
            uploadedUrl.endsWith(".png") ||
            uploadedUrl.endsWith(".gif") ? (
              <div className="mt-2">
                <p className="text-sm font-medium">Preview:</p>
                <img
                  src={uploadedUrl || "/placeholder.svg"}
                  alt="Uploaded file"
                  className="mt-2 max-w-full h-auto rounded-md border"
                  onError={() => console.error("Image failed to load")}
                />
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

