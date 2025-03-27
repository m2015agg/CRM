"use client"

import type React from "react"

import { useState } from "react"

export default function DirectUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs((prev) => [...prev, message])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      addLog(`File selected: ${selectedFile.name} (${selectedFile.size} bytes)`)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      addLog("No file selected")
      return
    }

    setIsUploading(true)
    setError(null)
    addLog(`Starting upload of ${file.name}`)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append("file", file)
      addLog("FormData created with file")

      // Upload using the direct upload API
      addLog("Calling direct upload API...")
      const response = await fetch("/api/direct-upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()
      addLog(`API response: ${JSON.stringify(result)}`)

      if (result.success && result.url) {
        setUploadedUrl(result.url)
        addLog(`Upload successful! URL: ${result.url}`)
      } else {
        throw new Error(result.error || "Failed to upload file")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      addLog(`Error: ${errorMessage}`)
      console.error("Upload error:", err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Direct File Upload Test</h1>

      <div className="mb-4">
        <input type="file" onChange={handleFileChange} className="mb-4 block" />
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {isUploading ? "Uploading..." : "Upload File"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {uploadedUrl && (
        <div className="p-4 bg-green-100 border border-green-300 rounded mb-4">
          <p className="font-bold">Uploaded Successfully!</p>
          <p className="break-all mt-2">
            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              {uploadedUrl}
            </a>
          </p>
          {uploadedUrl.endsWith(".jpg") ||
          uploadedUrl.endsWith(".jpeg") ||
          uploadedUrl.endsWith(".png") ||
          uploadedUrl.endsWith(".gif") ? (
            <div className="mt-2">
              <img
                src={uploadedUrl || "/placeholder.svg"}
                alt="Uploaded file"
                className="max-w-full h-auto max-h-64 rounded"
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">Logs:</h2>
        <div className="bg-gray-100 p-4 rounded h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1 font-mono text-sm">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

