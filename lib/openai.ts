import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function summarizeCallNotes(callNoteId: string) {
  try {
    // Get the call note from the database
    const { data: callNote, error } = await supabase
      .from('call_notes')
      .select('*')
      .eq('id', callNoteId)
      .single()

    if (error) throw error

    // Create a prompt for the summary
    const prompt = `Please provide a concise summary of the following call notes. Focus on key points, decisions, and action items:

Customer: ${callNote.customer_name}
Contact: ${callNote.contact_name || 'N/A'}
Location: ${callNote.location_type || 'N/A'}
Notes: ${callNote.notes}

Please format the summary in a clear, professional manner.`

    // Generate the summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes call notes professionally and concisely."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const summary = completion.choices[0]?.message?.content || "Failed to generate summary"

    // Update the call note with the summary
    const { error: updateError } = await supabase
      .from('call_notes')
      .update({ summary })
      .eq('id', callNoteId)

    if (updateError) throw updateError

    return summary
  } catch (error) {
    console.error('Error generating summary:', error)
    throw error
  }
} 