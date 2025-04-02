"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Paperclip, AlertTriangle, Camera } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadFileToBlobAction } from "@/lib/blob-actions"
import { FilePreview } from "@/components/file-preview"

interface SimplifiedFileUploadProps {
  onFileUploaded: (url: string) => void
  folder?: string
  accept?: string
  maxSizeMB?: number
  label?: string
  className?: string
  initialUrl?: string
  activeTab?: string
  isReceipt?: boolean // Add this prop to enable receipt-specific features
}

export function SimplifiedFileUpload({
  onFileUploaded,
  folder = "receipts",
  accept = "image/*,application/pdf",
  maxSizeMB = 5,
  label = "Upload Receipt",
  className = "",
  initialUrl,
  activeTab = "expenses",
  isReceipt = true, // Default to true since most uploads will be receipts
}: SimplifiedFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [showReceiptPreview, setShowReceiptPreview] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Initialize with the initial URL if provided
  useEffect(() => {
    if (initialUrl) {
      console.log("SimplifiedFileUpload: Using initial URL:", initialUrl)
      setUploadedUrl(initialUrl)
      setShowReceiptPreview(true) // Show preview by default when initial URL is provided
      // We don't call onFileUploaded here to avoid unexpected side effects
    }
  }, [initialUrl])

  // Reset preview visibility when tab changes
  useEffect(() => {
    if (activeTab !== "expenses") {
      setShowReceiptPreview(false)
    }
  }, [activeTab])

  // Hide success message after 10 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessMessage])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("File selected:", file.name, file.type, file.size)
      setSelectedFile(file)
      // Auto-upload when file is selected
      handleUpload(file)
    }
  }

  const handleUpload = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    setProgress(10)
    setError(null)

    try {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
      }

      // Create FormData and append the file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)

      console.log("Starting upload to Blob storage...")
      setProgress(30)

      // Upload using server action
      const result = await uploadFileToBlobAction(formData)

      setProgress(100)

      if (result.success && result.url) {
        console.log("Upload successful, URL:", result.url)
        setUploadedUrl(result.url)
        setShowSuccessMessage(true) // Show success message when new file is uploaded

        // Call the callback with the URL
        onFileUploaded(result.url)
      } else {
        console.error("Upload failed:", result.error)
        throw new Error(result.error || "Failed to upload file")
      }
    } catch (err) {
      console.error("Error in upload process:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const debugUrl = () => {
    console.log("Current uploadedUrl:", uploadedUrl)
    console.log("Initial URL:", initialUrl)
    if (uploadedUrl) {
      // Try to fetch the URL to check if it's accessible
      fetch(uploadedUrl, { method: "HEAD" })
        .then((response) => {
          console.log("URL fetch status:", response.status, response.ok)
        })
        .catch((err) => {
          console.error("Error checking URL:", err)
        })
    }
  }

  // Only show receipt-related UI when on the expenses tab
  const isExpensesTab = activeTab === "expenses"

  // Add this function to handle camera capture on mobile
  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment")
      fileInputRef.current.setAttribute("accept", "image/*")
      fileInputRef.current.click()
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Only show upload buttons if no file is uploaded */}
      {!uploadedUrl && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileSelect}
            className="flex-1"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                <span className="ml-2">Uploading...</span>
              </>
            ) : (
              <>
                <Paperclip className="mr-2 h-4 w-4" />
                {label}
              </>
            )}
          </Button>
          {isReceipt && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerFileSelect}
              disabled={isUploading}
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-2 py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {uploadedUrl && showSuccessMessage && (
        <div className="text-xs text-green-600 flex items-center justify-between">
          <span className="truncate">Receipt uploaded successfully</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 ml-1 text-xs"
            onClick={() => setShowReceiptPreview(!showReceiptPreview)}
          >
            {showReceiptPreview ? "Hide Receipt" : "View Receipt"}
          </Button>
        </div>
      )}

      {/* Show receipt preview when uploadedUrl exists and showReceiptPreview is true */}
      {uploadedUrl && showReceiptPreview && (
        <div className="mt-2">
          <FilePreview url={uploadedUrl} showRemoveButton={false} />
        </div>
      )}
    </div>
  )
}

