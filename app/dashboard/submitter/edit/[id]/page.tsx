"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
import type { Database } from "@/lib/database.types"
import { BackButton } from "@/components/back-button"

type CallNote = Database["public"]["Tables"]["call_notes"]["Row"]

// Define the bucket name as a constant to ensure consistency
const ATTACHMENTS_BUCKET = "attachments"

export default function EditCallNotePage({
  params,
}: {
  params: { id: string }
}) {
  const [callNote, setCallNote] = useState<CallNote | null>(null)
  const [clientName, setClientName] = useState("")
  const [notes, setNotes] = useState("")
  const [attachments, setAttachments] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchCallNote = async () => {
      if (!user) return

      setIsLoading(true)

      const { data, error } = await supabase
        .from("call_notes")
        .select("*")
        .eq("id", params.id)
        .eq("submitter_id", user.id)
        .single()

      if (error) {
        console.error("Error fetching call note:", error)
        setError("Note not found or you do not have permission to edit it")
        router.push("/dashboard/submitter")
      } else {
        setCallNote(data)
        setClientName(data.client_name)
        setNotes(data.notes)
        setAttachments(data.attachments || [])
      }

      setIsLoading(false)
    }

    if (user) {
      fetchCallNote()
    }
  }, [user, params.id, supabase, router])

  const handleAddAttachment = (url: string) => {
    setAttachments([...attachments, url])
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !callNote) {
      setError("You must be logged in to edit a note")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("call_notes")
        .update({
          client_name: clientName,
          notes,
          attachments: attachments.length > 0 ? attachments : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)
        .eq("submitter_id", user.id)

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

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <BackButton href="/dashboard/submitter" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Call Note</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
                bucket={ATTACHMENTS_BUCKET}
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

