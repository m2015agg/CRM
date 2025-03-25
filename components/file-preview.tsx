"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, FileText, File, Download } from "lucide-react"
import { deleteFile } from "@/lib/storage-utils"

interface FilePreviewProps {
  url: string
  bucket: string
  onDelete?: () => void
  showDelete?: boolean
}

export function FilePreview({ url, bucket, onDelete, showDelete = true }: FilePreviewProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileName = url.split("/").pop() || "file"
  const fileExt = fileName.split(".").pop()?.toLowerCase() || ""

  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExt)
  const isPdf = fileExt === "pdf"

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    setError(null)

    try {
      const success = await deleteFile(url, bucket)
      if (success) {
        onDelete()
      } else {
        setError("Failed to delete file")
      }
    } catch (err) {
      console.error("Error deleting file:", err)

      // Provide a more specific error message
      if (err instanceof Error) {
        if (err.message.includes("Bucket")) {
          setError(`Storage bucket issue: ${err.message}`)
        } else {
          setError(`Delete error: ${err.message}`)
        }
      } else {
        setError("An unexpected error occurred during deletion")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative flex items-center gap-2 rounded-md border p-2">
      {isImage ? (
        <div className="h-10 w-10 overflow-hidden rounded">
          <img src={url || "/placeholder.svg"} alt={fileName} className="h-full w-full object-cover" />
        </div>
      ) : isPdf ? (
        <FileText className="h-10 w-10 text-blue-500" />
      ) : (
        <File className="h-10 w-10 text-gray-500" />
      )}

      <div className="flex-1 truncate">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <div className="flex gap-1">
        <Button type="button" variant="ghost" size="icon" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer" download>
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </a>
        </Button>

        {showDelete && (
          <Button type="button" variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        )}
      </div>
    </div>
  )
}

