"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, X, AlertTriangle } from "lucide-react"
import { deleteFromBlob } from "@/lib/blob-utils"

interface FilePreviewProps {
  url: string
  onRemove?: () => void
  showRemoveButton?: boolean
  showDelete?: boolean
  className?: string
  bucket?: string // Keep for backward compatibility
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

  // Use a simpler approach without destructuring
  useEffect(() => {
    if (!url) {
      setError("No URL provided")
      setLoading(false)
      return
    }

    // Check if it's an image by extension
    const isImageFile = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.toLowerCase())
    setIsImage(isImageFile)

    // For non-images, just finish loading
    if (!isImageFile) {
      setLoading(false)
      return
    }

    // For images, preload to check if they're accessible
    const img = new Image()

    img.onload = () => {
      setLoading(false)
    }

    img.onerror = () => {
      console.error("Failed to load image:", url)
      setError("Failed to load image")
      setIsImage(false)
      setLoading(false)
    }

    img.src = url

    // No cleanup needed
  }, [url])

  const handleDownload = () => {
    if (url) {
      window.open(url, "_blank")
    }
  }

  const handleDelete = () => {
    if (!onRemove) return

    // Try to delete the file from Vercel Blob
    deleteFromBlob(url).catch((err) => {
      console.error("Error deleting file:", err)
    })

    // Call onRemove regardless of deletion success
    onRemove()
  }

  // Handle loading state
  if (loading) {
    return (
      <Card className={`relative flex items-center justify-center p-4 h-40 ${className}`}>
        <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
      </Card>
    )
  }

  // Handle error state
  if (error) {
    return (
      <Card className={`relative flex flex-col items-center justify-center p-4 h-40 ${className}`}>
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-sm text-center text-muted-foreground">{error}</p>
      </Card>
    )
  }

  // Render the file preview
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {isImage ? (
        <div className="relative aspect-video">
          {/* Use a regular img tag instead of Next.js Image to avoid any potential issues */}
          <img
            src={url || "/placeholder.svg"}
            alt="File preview"
            className="w-full h-full object-cover"
            onError={() => {
              console.error("Image failed to load:", url)
              setIsImage(false)
              setError("Failed to load image")
            }}
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

