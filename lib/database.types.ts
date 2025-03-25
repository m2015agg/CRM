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
      daily_reports: {
        Row: {
          id: string
          submitter_id: string
          report_date: string
          mileage: number | null
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          submitter_id: string
          report_date: string
          mileage?: number | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          submitter_id?: string
          report_date?: string
          mileage?: number | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          submitter_id: string
          expense_date: string
          expense_type: "lodging" | "breakfast" | "lunch" | "dinner" | "telephone" | "tips" | "entertainment" | "other"
          amount: number
          description: string | null
          client_name: string | null
          location: string | null
          discussion_notes: string | null
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          submitter_id: string
          expense_date: string
          expense_type: "lodging" | "breakfast" | "lunch" | "dinner" | "telephone" | "tips" | "entertainment" | "other"
          amount: number
          description?: string | null
          client_name?: string | null
          location?: string | null
          discussion_notes?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          submitter_id?: string
          expense_date?: string
          expense_type?: "lodging" | "breakfast" | "lunch" | "dinner" | "telephone" | "tips" | "entertainment" | "other"
          amount?: number
          description?: string | null
          client_name?: string | null
          location?: string | null
          discussion_notes?: string | null
          receipt_url?: string | null
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

