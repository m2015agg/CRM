"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUpload } from "@/components/file-upload"
import { FilePreview } from "@/components/file-preview"
import Link from "next/link"
import { BackButton } from "@/components/back-button"

// Define the bucket name as a constant to ensure consistency
const ATTACHMENTS_BUCKET = "attachments"

export default function NewCallNotePage() {
  const [clientName, setClientName] = useState("")
  const [notes, setNotes] = useState("")
  const [attachments, setAttachments] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleAddAttachment = (url: string) => {
    setAttachments([...attachments, url])
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to submit a note")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.from("call_notes").insert({
        submitter_id: user.id,
        client_name: clientName,
        notes,
        attachments: attachments.length > 0 ? attachments : null,
        call_date: new Date().toISOString(),
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push("/dashboard/submitter")
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <BackButton href="/dashboard/submitter" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add New Call Note</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="client-name">Client Name</Label>
              <Input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Call Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={8} required />
            </div>
            <div className="space-y-2">
              <Label>Attachments</Label>
              <FileUpload
                onFileUpload={handleAddAttachment}
                folder={`user-${user?.id || "unknown"}`}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                maxSize={10}
              />
              {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((url, index) => (
                    <FilePreview
                      key={index}
                      url={url}
                      bucket={ATTACHMENTS_BUCKET}
                      onDelete={() => handleRemoveAttachment(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard/submitter">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Note"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

