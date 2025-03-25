"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, AlertTriangle, ExternalLink, ShieldAlert, Loader2 } from "lucide-react"
import { uploadFile } from "@/lib/storage-utils"
import Link from "next/link"

interface FileUploadProps {
  onFileUpload: (url: string) => void
  bucket: string
  folder: string
  accept?: string
  maxSize?: number // in MB
}

export function FileUpload({ onFileUpload, bucket, folder, accept = "*", maxSize = 5 }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBucketMissing, setIsBucketMissing] = useState(false)
  const [isRLSError, setIsRLSError] = useState(false)
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
    setIsBucketMissing(false)
    setIsRLSError(false)
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

      const url = await uploadFile(file, bucket, folder)

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
        if (
          err.message.includes("row-level security") ||
          err.message.includes("policy") ||
          err.message.includes("permission denied")
        ) {
          setError(`Permission denied: You don't have access to upload files to this bucket.`)
          setIsRLSError(true)
        } else if (err.message.includes("Bucket") || err.message.includes("bucket")) {
          setError(`Storage bucket issue: ${err.message}`)
          setIsBucketMissing(true)
        } else if (err.message.includes("permission") || err.message.includes("access")) {
          setError(`Permission error: ${err.message}. Please check your storage bucket permissions.`)
          setIsRLSError(true)
        } else if (err.message.includes("content type") || err.message.includes("Content-Type")) {
          setError(`File type error: ${err.message}. Try a different file format.`)
        } else {
          setError(`Upload error: ${err.message}`)
        }
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
          disabled={isUploading || isBucketMissing}
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

          {isRLSError && (
            <div className="ml-6 space-y-1 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Row Level Security (RLS) Policy Issue</p>
                  <p className="text-amber-700 mt-1">
                    This is a permission issue with the Supabase storage bucket. The administrator needs to update the
                    RLS policies to allow file uploads.
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <Link href="/admin/setup" className="text-blue-600 hover:underline inline-flex items-center">
                  View Setup Instructions
                </Link>
              </div>
            </div>
          )}

          {isBucketMissing && (
            <div className="ml-6 space-y-1">
              <p>The required storage bucket needs to be set up by an administrator.</p>
              <div className="flex gap-2">
                <Link href="/admin/setup" className="text-blue-600 hover:underline inline-flex items-center">
                  View Setup Instructions
                </Link>
                <span>|</span>
                <Link
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  Supabase Dashboard <ExternalLink className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

