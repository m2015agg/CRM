"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, X, AlertTriangle } from "lucide-react"
import { parseStorageUrl, getFileUrl, deleteFile } from "@/lib/storage-utils"

interface FilePreviewProps {
  url: string
  bucket?: string
  onRemove?: () => void
  showRemoveButton?: boolean
  showDelete?: boolean
  className?: string
}

export function FilePreview({
  url,
  onRemove,
  showRemoveButton = false,
  showDelete = true,
  className = "",
}: FilePreviewProps) {
  const [isImage, setIsImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)

  useEffect(() => {
    const checkFileType = async () => {
      setLoading(true)
      setError(null)

      try {
        // Check if the URL is already a public URL
        if (url.startsWith("http") && !url.includes("storage/v1/object")) {
          setPublicUrl(url)
          // Try to determine if it's an image based on extension
          const isImageFile = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
          setIsImage(isImageFile)
          setLoading(false)
          return
        }

        // Parse the storage URL to get bucket and path
        const fileInfo = parseStorageUrl(url)

        if (!fileInfo) {
          throw new Error("Invalid file URL format")
        }

        // Get the public URL for the file
        const publicFileUrl = await getFileUrl(fileInfo.bucket, fileInfo.path)
        setPublicUrl(publicFileUrl)

        // Check if it's an image by extension
        const isImageFile = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileInfo.path.toLowerCase())
        setIsImage(isImageFile)
      } catch (err) {
        console.error("Error in FilePreview:", err)
        setError(err instanceof Error ? err.message : "Failed to load file")
      } finally {
        setLoading(false)
      }
    }

    checkFileType()
  }, [url])

  const handleDownload = () => {
    if (publicUrl) {
      window.open(publicUrl, "_blank")
    }
  }

  const handleDelete = async () => {
    if (onRemove) {
      try {
        // Try to delete the file from storage
        await deleteFile(url)
      } catch (error) {
        console.error("Error deleting file:", error)
        // Continue with removal from UI even if deletion fails
      }
      onRemove()
    }
  }

  if (loading) {
    return (
      <Card className={`relative flex items-center justify-center p-4 h-40 ${className}`}>
        <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`relative flex flex-col items-center justify-center p-4 h-40 ${className}`}>
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-sm text-center text-muted-foreground">{error}</p>
      </Card>
    )
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {isImage && publicUrl ? (
        <div className="relative aspect-video">
          <Image
            src={publicUrl || "/placeholder.svg"}
            alt="File preview"
            fill
            className="object-cover"
            onError={() => setIsImage(false)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 h-40">
          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-center text-muted-foreground">{url.split("/").pop() || "File"}</p>
        </div>
      )}

      <div className="absolute top-2 right-2 flex gap-1">
        {showRemoveButton && showDelete && onRemove && (
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full bg-red-500 hover:bg-red-600"
            onClick={handleDelete}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="icon"
          className="h-6 w-6 rounded-full bg-white hover:bg-gray-100"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
          <span className="sr-only">Download</span>
        </Button>
      </div>
    </Card>
  )
}

