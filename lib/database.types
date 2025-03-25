export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: "admin" | "submitter"
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: "admin" | "submitter"
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: "admin" | "submitter"
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      call_notes: {
        Row: {
          id: string
          submitter_id: string
          client_name: string
          call_date: string
          notes: string
          attachments: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          submitter_id: string
          client_name: string
          call_date?: string
          notes: string
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          submitter_id?: string
          client_name?: string
          call_date?: string
          notes?: string
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
  storage: {
    Buckets: {
      [_ in never]: never
    }
    Objects: {
      [_ in never]: never
    }
  }
}

