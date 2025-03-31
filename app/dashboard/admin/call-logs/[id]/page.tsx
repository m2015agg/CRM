"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { format, parseISO } from "date-fns"
import { FilePreview } from "@/components/file-preview"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, User, Calendar, Building, MapPin } from "lucide-react"

export default function CallLogDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [callNote, setCallNote] = useState<any>(null)
  const [submitter, setSubmitter] = useState<any>(null)
  const [isLoadingNote, setIsLoadingNote] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is admin, if not redirect
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      if (user.role !== "admin") {
        console.log("User is not admin, redirecting to dashboard")
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchCallNote = async () => {
      if (isLoading || !user || user.role !== "admin") return

      try {
        setIsLoadingNote(true)
        const supabase = getSupabaseClient()

        // Fetch call note with user details
        const { data, error } = await supabase
          .from("call_notes")
          .select(`
            *,
            users:submitter_id(full_name, email, avatar_url)
          `)
          .eq("id", params.id)
          .single()

        if (error) throw error

        setCallNote(data)
        setSubmitter(data.users)
      } catch (err) {
        console.error("Error fetching call note:", err)
        setError(err instanceof Error ? err.message : "Failed to load call note")
      } finally {
        setIsLoadingNote(false)
      }
    }

    fetchCallNote()
  }, [user, isLoading, params.id])

  if (isLoading || isLoadingNote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BackButton href="/dashboard/admin/call-logs" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !callNote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BackButton href="/dashboard/admin/call-logs" />
          <h1 className="text-2xl font-bold tracking-tight">Call Note Details</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Call note not found"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BackButton href="/dashboard/admin/call-logs" />
        <h1 className="text-2xl font-bold tracking-tight">Call Note Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{callNote.client_name}</CardTitle>
          <CardDescription>Call note from {format(parseISO(callNote.call_date), "MMMM d, yyyy")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Submitted by:</span>
                <span className="text-sm">{submitter?.full_name || "Unknown"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">{format(parseISO(callNote.call_date), "MMMM d, yyyy")}</span>
              </div>

              {callNote.contact_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Contact:</span>
                  <span className="text-sm">{callNote.contact_name}</span>
                </div>
              )}

              {callNote.location_type && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Location Type:</span>
                  <span className="text-sm">{callNote.location_type}</span>
                </div>
              )}

              {callNote.client_name && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Client:</span>
                  <span className="text-sm">{callNote.client_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Notes</h3>
            <div className="p-4 bg-muted/30 rounded-md">
              <p className="whitespace-pre-wrap">{callNote.notes}</p>
            </div>
          </div>

          {callNote.attachments && callNote.attachments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Attachments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {callNote.attachments.map((url: string, index: number) => (
                  <FilePreview key={index} url={url} showRemoveButton={false} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

