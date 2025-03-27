"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, AlertTriangle, Loader2 } from "lucide-react"
import { uploadToBlob } from "@/lib/blob-utils"

interface FileUploadProps {
  onFileUpload: (url: string) => void
  folder: string
  accept?: string
  maxSize?: number // in MB
  bucket?: string // Keep for backward compatibility
}

export function FileUpload({ onFileUpload, folder, accept = "*", maxSize = 5 }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`)
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Log file details for debugging
      console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 300)

      // Upload to Vercel Blob
      const url = await uploadToBlob(file, folder)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (url) {
        onFileUpload(url)
      } else {
        setError("Failed to upload file")
      }
    } catch (err) {
      console.error("Error uploading file:", err)

      // Provide a more specific error message
      if (err instanceof Error) {
        setError(`Upload error: ${err.message}`)
      } else {
        setError("An unexpected error occurred during upload")
      }
    } finally {
      setIsUploading(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <Paperclip className="mr-2 h-4 w-4" />
              Attach File
            </>
          )}
        </Button>
        <Input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
      </div>
      {error && (
        <div className="text-sm text-destructive space-y-1">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

