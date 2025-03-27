"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert, Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function StorageRLSGuide() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const attachmentsBucketPolicy = `
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments' AND auth.uid() = owner);

-- Allow users to access their own files
CREATE POLICY "Allow individual access"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner);

-- Allow users to update their own files
CREATE POLICY "Allow individual updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner);

-- Allow users to delete their own files
CREATE POLICY "Allow individual deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments' AND auth.uid() = owner);
`.trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" />
          Storage RLS Policy Setup Guide
        </CardTitle>
        <CardDescription>How to configure Row Level Security (RLS) policies for your storage buckets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTitle className="text-amber-800">Storage Permission Issue</AlertTitle>
          <AlertDescription className="text-amber-700">
            Users are encountering permission errors when trying to upload files. This is due to missing or incorrect
            Row Level Security (RLS) policies on your Supabase storage buckets.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">How to Fix</h3>
          <ol className="list-decimal list-inside space-y-3 ml-2">
            <li>Go to your Supabase dashboard</li>
            <li>Navigate to Storage in the left sidebar</li>
            <li>
              Select the <strong>attachments</strong> bucket
            </li>
            <li>Click on the "Policies" tab</li>
            <li>Create the following policies using the SQL editor</li>
          </ol>
        </div>

        <div className="relative">
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">{attachmentsBucketPolicy}</pre>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => copyToClipboard(attachmentsBucketPolicy, "policy")}
          >
            {copied === "policy" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-2 mt-4">
          <h3 className="text-lg font-medium">Explanation</h3>
          <p className="text-sm text-muted-foreground">These policies allow authenticated users to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-muted-foreground">
            <li>Upload files to the attachments bucket (INSERT)</li>
            <li>View their own files (SELECT)</li>
            <li>Update their own files (UPDATE)</li>
            <li>Delete their own files (DELETE)</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-2">
            The <code>auth.uid() = owner</code> condition ensures users can only access their own files.
          </p>
        </div>

        <div className="mt-4">
          <Button asChild className="gap-2">
            <a
              href="https://supabase.com/docs/guides/storage/security/access-control"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              Learn More About Storage RLS
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

