export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      opportunities: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          status: string
          value: number | null
          owner_id: string
          client_name: string | null
          expected_close_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          status: string
          value?: number | null
          owner_id: string
          client_name?: string | null
          expected_close_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          status?: string
          value?: number | null
          owner_id?: string
          client_name?: string | null
          expected_close_date?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          full_name?: string | null
          created_at?: string
        }
      }
      call_notes: {
        Row: {
          id: string
          created_at: string
          submitter_id: string
          client_name: string
          call_date: string
          notes: string
          attachments: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          submitter_id: string
          client_name: string
          call_date: string
          notes: string
          attachments?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          submitter_id?: string
          client_name?: string
          call_date?: string
          notes?: string
          attachments?: string[] | null
        }
      }
    }
  }
}

