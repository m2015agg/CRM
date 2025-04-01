"use client"

import { useState, useCallback } from "react"
import { uploadToBlob, deleteFromBlob } from "@/lib/blob-utils"

interface UseFileUploadOptions {
  folder?: string
  maxSizeMB?: number
  acceptedFileTypes?: string[]
}

interface FileUploadState {
  isUploading: boolean
  progress: number
  error: string | null
  uploadedUrl: string | null
}

export function useFileUpload({ folder = "", maxSizeMB = 10, acceptedFileTypes = [] }: UseFileUploadOptions) {
  const [state, setState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedUrl: null,
  })

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File size exceeds ${maxSizeMB}MB limit`
      }

      // Check file type if acceptedFileTypes is provided and not empty
      if (acceptedFileTypes.length > 0) {
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""
        const mimeType = file.type.toLowerCase()

        // Check if the file type is accepted
        const isAccepted = acceptedFileTypes.some((type) => {
          // Handle mime types (e.g., "image/jpeg")
          if (type.includes("/")) {
            return mimeType === type || mimeType.startsWith(type.replace("/*", "/"))
          }
          // Handle extensions (e.g., ".jpg")
          return `.${fileExtension}` === type || type === `.${fileExtension}`
        })

        if (!isAccepted) {
          return `File type not accepted. Allowed types: ${acceptedFileTypes.join(", ")}`
        }
      }

      return null
    },
    [maxSizeMB, acceptedFileTypes],
  )

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      setState({
        isUploading: true,
        progress: 0,
        error: null,
        uploadedUrl: null,
      })

      try {
        // Validate the file
        const validationError = validateFile(file)
        if (validationError) {
          setState((prev) => ({ ...prev, error: validationError, isUploading: false }))
          return null
        }

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setState((prev) => {
            // Increase progress up to 90% (the last 10% will be set after successful upload)
            if (prev.progress < 90) {
              return { ...prev, progress: prev.progress + 10 }
            }
            return prev
          })
        }, 300)

        // Upload the file to Vercel Blob
        const url = await uploadToBlob(file, folder)

        clearInterval(progressInterval)

        if (url) {
          setState({
            isUploading: false,
            progress: 100,
            error: null,
            uploadedUrl: url,
          })
          return url
        } else {
          throw new Error("Upload failed: No URL returned")
        }
      } catch (error) {
        console.error("Error uploading file:", error)
        setState({
          isUploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : "An unknown error occurred",
          uploadedUrl: null,
        })
        return null
      }
    },
    [folder, validateFile],
  )

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedUrl: null,
    })
  }, [])

  const remove = useCallback(
    async (url: string): Promise<boolean> => {
      try {
        const success = await deleteFromBlob(url)
        if (success && state.uploadedUrl === url) {
          reset()
        }
        return success
      } catch (error) {
        console.error("Error deleting file:", error)
        return false
      }
    },
    [state.uploadedUrl, reset],
  )

  return {
    ...state,
    upload,
    remove,
    reset,
  }
}

