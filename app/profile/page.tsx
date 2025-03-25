"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadFile } from "@/lib/storage-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BackButton } from "@/components/back-button"

// Define the bucket name as a constant to ensure consistency
const AVATARS_BUCKET = "avatars"

// Get a reference to the Supabase client
const supabase = getSupabaseClient()

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("users").select("full_name, avatar_url").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching user profile:", error)
          return
        }

        if (data) {
          setFullName(data.full_name || "")
          setAvatarUrl(data.avatar_url)
        }
      } catch (err) {
        console.error("Unexpected error fetching user profile:", err)
      }
    }

    fetchUserProfile()
  }, [user])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar image must be less than 2MB")
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("File must be an image")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const url = await uploadFile(file, AVATARS_BUCKET, `user-${user.id}`)
      if (url) {
        setAvatarUrl(url)
      } else {
        setError("Failed to upload avatar")
      }
    } catch (err) {
      console.error("Error uploading avatar:", err)
      if (err instanceof Error) {
        setError(`Upload error: ${err.message}`)
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to update your profile")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        setError(error.message)
        return
      }

      router.push("/dashboard")
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

  return (
    <div className="container mx-auto py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <BackButton href="/dashboard" label="Back to Dashboard" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || ""} alt={fullName} />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? "Uploading..." : "Change Avatar"}
                  </Button>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ""} disabled />
                <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={user?.role || ""} disabled />
                <p className="text-xs text-muted-foreground">Your role is assigned by administrators</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/dashboard")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

