"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SettingsPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalNotes, setTotalNotes] = useState(0)
  const [processedNotes, setProcessedNotes] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const processCallNotes = async () => {
    try {
      setIsProcessing(true)
      setError(null)
      setSuccess(false)
      setProgress(0)
      setProcessedNotes(0)

      // Get total count of notes without summaries
      const { count, error: countError } = await supabase
        .from('call_notes')
        .select('*', { count: 'exact', head: true })
        .is('summary', null)

      if (countError) throw countError
      if (!count) {
        setSuccess(true)
        return
      }

      setTotalNotes(count)

      // Process in batches of 50 (to stay well under the 500 RPM limit)
      const batchSize = 50
      const totalBatches = Math.ceil(count / batchSize)
      
      for (let batch = 0; batch < totalBatches; batch++) {
        // Get notes for this batch
        const { data: notes, error: fetchError } = await supabase
          .from('call_notes')
          .select('id, notes')
          .is('summary', null)
          .range(batch * batchSize, (batch + 1) * batchSize - 1)

        if (fetchError) throw fetchError
        if (!notes?.length) continue

        // Process each note in the batch
        for (const note of notes) {
          try {
            // Call OpenAI API to summarize the notes
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a helpful assistant that summarizes call notes concisely. Focus on key points, decisions, and action items.'
                  },
                  {
                    role: 'user',
                    content: `Please summarize the following call notes in a clear and concise manner:\n\n${note.notes}`
                  }
                ],
                temperature: 0.7,
                max_tokens: 150
              }),
            })

            if (!response.ok) {
              throw new Error(`OpenAI API error: ${response.statusText}`)
            }

            const data = await response.json()
            const summary = data.choices[0].message.content.trim()

            // Update the note with the summary
            const { error: updateError } = await supabase
              .from('call_notes')
              .update({ summary })
              .eq('id', note.id)

            if (updateError) throw updateError

            setProcessedNotes(prev => prev + 1)
            setProgress((processedNotes + 1) / count * 100)
          } catch (err) {
            console.error(`Error processing note ${note.id}:`, err)
            // Continue with next note even if one fails
          }
        }

        // Add a small delay between batches to stay under rate limits
        if (batch < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      setSuccess(true)
    } catch (err) {
      console.error('Error in processCallNotes:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Call Notes Processing</CardTitle>
          <CardDescription>
            Generate AI summaries for all call notes that don't have one yet.
            This process will run in the background and may take some time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                All call notes have been processed successfully.
              </AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Processing call notes...</span>
                <span>{processedNotes} / {totalNotes}</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <Button 
            onClick={processCallNotes} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Process All Call Notes'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 