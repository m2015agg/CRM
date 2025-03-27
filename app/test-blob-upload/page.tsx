"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadFileToBlobAction } from "@/lib/blob-actions"

export default function TestBlobUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1].split(".")[0]}: ${message}`])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      addLog(`File selected: ${selectedFile.name} (${selectedFile.size} bytes)`)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      addLog("No file selected")
      return
    }

    setIsUploading(true)
    setError(null)
    addLog(`Starting upload of ${file.name}`)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "test")
      addLog("FormData created with file and folder")

      // Upload using server action
      addLog("Calling uploadFileToBlobAction...")
      const result = await uploadFileToBlobAction(formData)
      addLog(`Server action returned: ${JSON.stringify(result)}`)

      if (result.success && result.url) {
        setUploadedUrl(result.url)
        addLog(`Upload successful! URL: ${result.url}`)
      } else {
        throw new Error(result.error || "Failed to upload file")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      addLog(`Error: ${errorMessage}`)
      console.error("Upload error:", err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Simple Blob Upload Test</h1>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Direct Blob Upload Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input type="file" onChange={handleFileChange} className="max-w-xs" />
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? "Uploading..." : "Upload to Blob"}
            </Button>
          </div>

          {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">{error}</div>}

          {uploadedUrl && (
            <div className="space-y-2">
              <h3 className="font-medium">Uploaded File:</h3>
              <div className="p-4 bg-green-50 border border-green-200 rounded-md break-all">
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {uploadedUrl}
                </a>
              </div>
              {uploadedUrl.endsWith(".jpg") ||
              uploadedUrl.endsWith(".jpeg") ||
              uploadedUrl.endsWith(".png") ||
              uploadedUrl.endsWith(".gif") ? (
                <div className="mt-4">
                  <img
                    src={uploadedUrl || "/placeholder.svg"}
                    alt="Uploaded file"
                    className="max-w-full h-auto max-h-64 rounded-md"
                  />
                </div>
              ) : null}
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-medium mb-2">Debug Logs:</h3>
            <div className="bg-gray-100 p-4 rounded-md h-64 overflow-y-auto font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className="pb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

