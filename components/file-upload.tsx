"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, AlertTriangle, ExternalLink } from "lucide-react"
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

    try {
      const url = await uploadFile(file, bucket, folder)
      if (url) {
        onFileUpload(url)
      } else {
        setError("Failed to upload file")
      }
    } catch (err) {
      console.error("Error uploading file:", err)

      // Provide a more specific error message
      if (err instanceof Error) {
        if (err.message.includes("Bucket") || err.message.includes("bucket")) {
          setError(`Storage bucket issue: ${err.message}`)
          setIsBucketMissing(true)
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
          <Paperclip className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Attach File"}
        </Button>
        <Input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
      </div>
      {error && (
        <div className="text-sm text-destructive space-y-1">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
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

