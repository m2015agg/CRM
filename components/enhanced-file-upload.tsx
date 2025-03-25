"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useFileUpload } from "@/hooks/use-file-upload"
import { FilePreview } from "@/components/file-preview"
import { Paperclip, AlertTriangle, X, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EnhancedFileUploadProps {
  onFileUploaded: (url: string) => void
  bucket: string
  folder?: string
  accept?: string
  maxSizeMB?: number
  label?: string
  description?: string
  showPreview?: boolean
  className?: string
}

export function EnhancedFileUpload({
  onFileUploaded,
  bucket,
  folder = "",
  accept = "*",
  maxSizeMB = 10,
  label = "Upload File",
  description,
  showPreview = true,
  className = "",
}: EnhancedFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Parse accepted file types for validation
  const acceptedTypes = accept.split(",").map((type) => type.trim())

  const { isUploading, progress, error, uploadedUrl, upload, remove, reset } = useFileUpload({
    bucket,
    folder,
    maxSizeMB,
    acceptedFileTypes: acceptedTypes,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const url = await upload(selectedFile)
    if (url) {
      onFileUploaded(url)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemove = async () => {
    if (uploadedUrl) {
      const success = await remove(uploadedUrl)
      if (success) {
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
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

