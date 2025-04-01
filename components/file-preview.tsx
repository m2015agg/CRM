"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash2, Download, FileText, Image as ImageIcon, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilePreviewProps {
  url: string
  bucket: string
  showDelete?: boolean
  onDelete?: () => void
  className?: string
}

export function FilePreview({ url, bucket, showDelete = true, onDelete, className }: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseClient()

  if (!supabase) {
    console.error("Supabase client not initialized")
    return null
  }

  const getFileType = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase()
    if (!extension) return "file"

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image"
    if (["pdf", "doc", "docx", "txt"].includes(extension)) return "document"
    return "file"
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-8 w-8" />
      case "document":
        return <FileText className="h-8 w-8" />
      default:
        return <File className="h-8 w-8" />
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    try {
      const { error } = await supabase.storage.from(bucket).remove([url])
      if (error) throw error
      onDelete()
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(url)
      if (error) throw error

      const blob = new Blob([data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = url.split("/").pop() || "file"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading file:", error)
    }
  }

  const fileType = getFileType(url)
  const isImage = fileType === "image"

  return (
    <div className={cn("relative group rounded-lg border p-4", className)}>
      {isImage ? (
        <div className="aspect-square relative">
          <img
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${url}`}
            alt="Preview"
            className="object-cover rounded-lg"
            onLoad={() => setIsLoading(false)}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center aspect-square">
          {getFileIcon(fileType)}
          <p className="mt-2 text-sm text-center truncate max-w-full">{url.split("/").pop()}</p>
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          {showDelete && (
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

