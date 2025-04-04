import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  console.error('OpenAI API key is missing')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  console.log('Summarize API called')
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing')
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    console.log('Request body:', body)
    
    // Handle both noteId and callNoteId for backward compatibility
    const callNoteId = body.callNoteId || body.noteId

    if (!callNoteId) {
      console.error('No callNoteId provided')
      return NextResponse.json(
        { error: 'Call note ID is required' },
        { status: 400 }
      )
    }

    console.log('Fetching call note:', callNoteId)
    // Get the call note from the database
    const { data: callNote, error: fetchError } = await supabase
      .from('call_notes')
      .select('*')
      .eq('id', callNoteId)
      .single()

    if (fetchError) {
      console.error('Error fetching call note:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch call note', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!callNote) {
      console.error('Call note not found:', callNoteId)
      return NextResponse.json(
        { error: 'Call note not found' },
        { status: 404 }
      )
    }

    console.log('Call note found, generating summary')
    // Generate summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes call notes professionally and concisely."
        },
        {
          role: "user",
          content: `Please summarize the following call notes:\n\n${callNote.notes}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    console.log('OpenAI response:', completion)
    const summary = completion.choices[0]?.message?.content

    if (!summary) {
      console.error('No summary generated from OpenAI')
      return NextResponse.json(
        { error: 'Failed to generate summary from OpenAI' },
        { status: 500 }
      )
    }

    console.log('Updating call note with summary')
    // Update the call note with the summary
    const { error: updateError } = await supabase
      .from('call_notes')
      .update({ summary })
      .eq('id', callNoteId)

    if (updateError) {
      console.error('Error updating call note:', updateError)
      return NextResponse.json(
        { error: 'Failed to update call note with summary', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('Summary generated and saved successfully')
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error in summarize API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 