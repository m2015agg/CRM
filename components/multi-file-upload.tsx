"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EnhancedFileUpload } from "@/components/enhanced-file-upload"
import { FilePreview } from "@/components/file-preview"
import { Plus } from "lucide-react"
import { deleteFile } from "@/lib/storage-utils"

interface MultiFileUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  bucket: string
  folder?: string
  accept?: string
  maxSizeMB?: number
  maxFiles?: number
  label?: string
  description?: string
  className?: string
}

export function MultiFileUpload({
  value = [],
  onChange,
  bucket,
  folder = "",
  accept = "*",
  maxSizeMB = 10,
  maxFiles = 10,
  label = "Add Files",
  description,
  className = "",
}: MultiFileUploadProps) {
  const [showUploader, setShowUploader] = useState(false)

  const handleFileUploaded = (url: string) => {
    onChange([...value, url])
    setShowUploader(false)
  }

  const handleRemoveFile = async (index: number) => {
    const url = value[index]
    try {
      await deleteFile(url)
    } catch (error) {
      console.error("Error deleting file:", error)
      // Continue with removal from state even if deletion fails
    }

    const newUrls = [...value]
    newUrls.splice(index, 1)
    onChange(newUrls)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {value.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({value.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {value.map((url, index) => (
              <FilePreview key={index} url={url} showRemoveButton onRemove={() => handleRemoveFile(index)} />
            ))}
          </div>
        </div>
      )}

      {showUploader ? (
        <EnhancedFileUpload
          onFileUploaded={handleFileUploaded}
          bucket={bucket}
          folder={folder}
          accept={accept}
          maxSizeMB={maxSizeMB}
          label={label}
          description={description}
          showPreview={true}
        />
      ) : (
        value.length < maxFiles && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowUploader(true)} className="mt-2">
            <Plus className="mr-2 h-4 w-4" />
            {value.length === 0 ? label : "Add Another File"}
          </Button>
        )
      )}

      {value.length === 0 && !showUploader && description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {value.length >= maxFiles && (
        <p className="text-sm text-amber-600">Maximum number of files ({maxFiles}) reached</p>
      )}
    </div>
  )
}

