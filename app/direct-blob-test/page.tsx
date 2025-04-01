"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function DirectBlobTestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      console.log("File selected:", selectedFile.name, selectedFile.type, selectedFile.size)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("file", file)

      // Use fetch directly instead of a server action
      const response = await fetch("/api/upload-blob", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.url) {
        setUploadedUrl(result.url)
        console.log("Upload successful, URL:", result.url)
      } else {
        throw new Error(result.error || "Failed to upload file")
      }
    } catch (err) {
      console.error("Error in upload process:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Direct API Blob Upload Test</h1>

      <div className="w-full max-w-md mx-auto space-y-4 p-6 border rounded-lg">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Select File</label>
          <input type="file" onChange={handleFileChange} className="w-full" />
        </div>

        <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
          {isUploading ? "Uploading..." : "Upload File"}
        </Button>

        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>}

        {uploadedUrl && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Uploaded File:</h3>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md break-all text-sm">
              <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {uploadedUrl}
              </a>
            </div>
            {uploadedUrl.endsWith(".jpg") ||
            uploadedUrl.endsWith(".jpeg") ||
            uploadedUrl.endsWith(".png") ||
            uploadedUrl.endsWith(".gif") ? (
              <div className="mt-2">
                <img
                  src={uploadedUrl || "/placeholder.svg"}
                  alt="Uploaded file"
                  className="max-w-full h-auto rounded-md border"
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

