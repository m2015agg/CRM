"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { FilePreview } from "@/components/file-preview"
import { Paperclip, AlertTriangle, X, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadFileToBlobAction, deleteFileFromBlobAction } from "@/lib/blob-actions"

interface EnhancedFileUploadProps {
  onFileUploaded: (url: string) => void
  folder?: string
  accept?: string
  maxSizeMB?: number
  label?: string
  description?: string
  showPreview?: boolean
  className?: string
  initialUrl?: string
}

export function EnhancedFileUpload({
  onFileUploaded,
  folder = "",
  accept = "*",
  maxSizeMB = 10,
  label = "Upload File",
  description,
  showPreview = true,
  className = "",
  initialUrl,
}: EnhancedFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialUrl || null)
  const callbackCalled = useRef(false)

  // If initialUrl is provided, call onFileUploaded with it
  useEffect(() => {
    if (initialUrl && !callbackCalled.current) {
      console.log("Initial URL provided, calling onFileUploaded:", initialUrl)
      onFileUploaded(initialUrl)
      callbackCalled.current = true
    }
  }, [initialUrl, onFileUploaded])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setProgress(0)
    setError(null)
    callbackCalled.current = false

    try {
      // Check file size
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 300)

      // Create FormData and append the file
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("folder", folder)

      // Upload using server action
      const result = await uploadFileToBlobAction(formData)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success && result.url) {
        setUploadedUrl(result.url)

        // Call the callback with the URL - this is critical
        console.log("File uploaded successfully, calling onFileUploaded with URL:", result.url)
        onFileUploaded(result.url)
        callbackCalled.current = true
      } else {
        throw new Error(result.error || "Failed to upload file")
      }
    } catch (err) {
      console.error("Error uploading file:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemove = async () => {
    if (uploadedUrl) {
      try {
        const result = await deleteFileFromBlobAction(uploadedUrl)

        if (result.success) {
          setSelectedFile(null)
          setUploadedUrl(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
          // Call the callback with empty string to indicate removal
          onFileUploaded("")
          callbackCalled.current = true
        } else {
          setError(result.error || "Failed to remove file")
        }
      } catch (error) {
        console.error("Error deleting file:", error)
        setError("Failed to remove file")
      }
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {!selectedFile && !uploadedUrl && (
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Paperclip className="mr-2 h-4 w-4" />
            {label}
          </Button>
          <Input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}

      {selectedFile && !uploadedUrl && (
        <div className="rounded-md border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">({Math.round(selectedFile.size / 1024)} KB)</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0" disabled={isUploading}>
              <X className="h-4 w-4" />
              <span className="sr-only">Cancel</span>
            </Button>
          </div>

          {isUploading ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">Uploading... {progress}%</p>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleUpload} className="gap-1">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadedUrl && showPreview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Uploaded File</h4>
            <Button variant="ghost" size="sm" onClick={handleRemove} className="h-8 p-0 px-2">
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
          <FilePreview url={uploadedUrl} showRemoveButton onRemove={handleRemove} />
        </div>
      )}
    </div>
  )
}

