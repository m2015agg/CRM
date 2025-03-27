"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import type { Database } from "@/lib/database.types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Paperclip } from "lucide-react"
import { FilePreview } from "@/components/file-preview"
import { Button } from "@/components/ui/button"

type CallNote = Database["public"]["Tables"]["call_notes"]["Row"] & {
  users: {
    full_name: string
    email: string
  }
}

// Define the bucket name as a constant to ensure consistency
const ATTACHMENTS_BUCKET = "attachments"

// Get a reference to the Supabase client
const supabase = getSupabaseClient()

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [callNotes, setCallNotes] = useState<CallNote[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAttachments, setExpandedAttachments] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Check if user is admin, if not redirect
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      console.log("User role:", user.role)
      if (user.role !== "admin") {
        console.log("User is not admin, redirecting to dashboard")
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchCallNotes = async () => {
      if (isLoading || !user || user.role !== "admin") return

      try {
        console.log("Fetching call notes for admin")
        setIsLoadingNotes(true)

        const { data, error } = await supabase
          .from("call_notes")
          .select(`
            *,
            users:submitter_id(full_name, email)
          `)
          .order("call_date", { ascending: false })

        if (error) {
          console.error("Error fetching call notes:", error)
          setError(`Failed to fetch call notes: ${error.message}`)
          return
        }

        console.log("Call notes fetched:", data?.length || 0)
        setCallNotes(data as CallNote[])
      } catch (err) {
        console.error("Unexpected error fetching call notes:", err)
        setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setIsLoadingNotes(false)
      }
    }

    fetchCallNotes()
  }, [user, isLoading])

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

  // Group notes by submitter
  const submitterMap = new Map<string, { name: string; notes: CallNote[] }>()

  callNotes.forEach((note) => {
    const submitterId = note.submitter_id
    if (!submitterMap.has(submitterId)) {
      submitterMap.set(submitterId, {
        name: note.users?.full_name || "Unknown User",
        notes: [],
      })
    }
    submitterMap.get(submitterId)?.notes.push(note)
  })

  const submitters = Array.from(submitterMap.entries())

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">View all call notes submitted by your team.</p>
      </div>

      {submitters.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No call notes found.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={submitters[0][0]}>
          <TabsList className="mb-4">
            {submitters.map(([id, { name }]) => (
              <TabsTrigger key={id} value={id}>
                {name}
              </TabsTrigger>
            ))}
          </TabsList>

          {submitters.map(([id, { notes }]) => (
            <TabsContent key={id} value={id} className="space-y-4">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <CardTitle>{note.client_name}</CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(note.call_date), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{note.notes}</p>
                  </CardContent>
                  {note.attachments && note.attachments.length > 0 && (
                    <CardFooter className="flex flex-col items-start">
                      <Button variant="ghost" size="sm" className="mb-2" onClick={() => toggleAttachments(note.id)}>
                        <Paperclip className="mr-2 h-4 w-4" />
                        {note.attachments.length} Attachment{note.attachments.length !== 1 ? "s" : ""}
                      </Button>

                      {expandedAttachments[note.id] && (
                        <div className="w-full space-y-4">
                          <h4 className="text-sm font-medium">Attachments</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {note.attachments.map((url, index) => (
                              <FilePreview
                                key={index}
                                url={url}
                                bucket={ATTACHMENTS_BUCKET}
                                showDelete={false}
                                className="max-w-full"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

