"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Plus, Edit, Trash2, Paperclip } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Database } from "@/lib/database.types"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { FilePreview } from "@/components/file-preview"

type CallNote = Database["public"]["Tables"]["call_notes"]["Row"]

// Define the bucket name as a constant to ensure consistency
const ATTACHMENTS_BUCKET = "attachments"

// Get a reference to the Supabase client
const supabase = getSupabaseClient()

export default function SubmitterDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [callNotes, setCallNotes] = useState<CallNote[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAttachments, setExpandedAttachments] = useState<Record<string, boolean>>({})

  useEffect(() => {
    //  setExpandedAttachments] = useState<Record<string, boolean>>({})
  }, [])

  useEffect(() => {
    // Check if user is submitter, if not redirect
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      console.log("User role:", user.role)
      if (user.role !== "submitter") {
        console.log("User is not submitter, redirecting to dashboard")
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchCallNotes = async () => {
      if (isLoading || !user || user.role !== "submitter") return

      try {
        console.log("Fetching call notes for submitter")
        setIsLoadingNotes(true)

        const { data, error } = await supabase
          .from("call_notes")
          .select("*")
          .eq("submitter_id", user.id)
          .order("call_date", { ascending: false })

        if (error) {
          console.error("Error fetching call notes:", error)
          setError(`Failed to fetch call notes: ${error.message}`)
          return
        }

        console.log("Call notes fetched:", data?.length || 0)
        setCallNotes(data)
      } catch (err) {
        console.error("Unexpected error fetching call notes:", err)
        setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setIsLoadingNotes(false)
      }
    }

    fetchCallNotes()
  }, [user, isLoading])

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return
    }

    try {
      const { error } = await supabase.from("call_notes").delete().eq("id", id)

      if (error) {
        console.error("Error deleting note:", error)
        setError(`Failed to delete note: ${error.message}`)
        return
      }

      setCallNotes(callNotes.filter((note) => note.id !== id))
    } catch (err) {
      console.error("Unexpected error deleting note:", err)
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const toggleAttachments = (noteId: string) => {
    setExpandedAttachments((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }))
  }

  if (isLoading || isLoadingNotes) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Call Notes</h2>
          <p className="text-muted-foreground">Manage your call notes and add new ones.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/submitter/new">
            <Plus className="mr-2 h-4 w-4" />
            Add New Note
          </Link>
        </Button>
      </div>

      {callNotes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">You haven't added any call notes yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {callNotes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{note.client_name}</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/submitter/edit/${note.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                <CardDescription>{formatDistanceToNow(new Date(note.call_date), { addSuffix: true })}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-muted-foreground">{note.notes}</p>
              </CardContent>
              {note.attachments && note.attachments.length > 0 && (
                <CardFooter className="flex flex-col items-start pt-0">
                  <Button variant="ghost" size="sm" className="mb-2 px-0" onClick={() => toggleAttachments(note.id)}>
                    <Paperclip className="mr-2 h-4 w-4" />
                    {note.attachments.length} Attachment{note.attachments.length !== 1 ? "s" : ""}
                  </Button>

                  {expandedAttachments[note.id] && (
                    <div className="w-full space-y-2">
                      {note.attachments.map((url, index) => (
                        <FilePreview key={index} url={url} bucket={ATTACHMENTS_BUCKET} />
                      ))}
                    </div>
                  )}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

