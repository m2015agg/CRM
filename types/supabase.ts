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
          avatar_url: string | null
        }
        Insert: {
          id: string
          email: string
          role: string
          full_name?: string | null
          created_at?: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: string
          full_name?: string | null
          created_at?: string
          avatar_url?: string | null
        }
      }
      daily_reports: {
        Row: {
          id: string
          created_at: string
          submitter_id: string
          report_date: string
          mileage: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          submitter_id: string
          report_date: string
          mileage: number
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          submitter_id?: string
          report_date?: string
          mileage?: number
          notes?: string | null
        }
      }
      call_notes: {
        Row: {
          id: string
          created_at: string
          submitter_id: string
          daily_reports_uuid: string
          client_name: string
          call_date: string
          notes: string
          attachments: string[] | null
          contact_name: string | null
          location_type: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          submitter_id: string
          daily_reports_uuid: string
          client_name: string
          call_date: string
          notes: string
          attachments?: string[] | null
          contact_name?: string | null
          location_type?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          submitter_id?: string
          daily_reports_uuid?: string
          client_name?: string
          call_date?: string
          notes?: string
          attachments?: string[] | null
          contact_name?: string | null
          location_type?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          created_at: string
          submitter_id: string
          daily_reports_uuid: string
          amount: number
          expense_type: string
          expense_date: string
          description: string | null
          client_name: string | null
          location: string | null
          receipt_url: string | null
          discussion_notes: string | null
          associated_call: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          submitter_id: string
          daily_reports_uuid: string
          amount: number
          expense_type: string
          expense_date: string
          description?: string | null
          client_name?: string | null
          location?: string | null
          receipt_url?: string | null
          discussion_notes?: string | null
          associated_call?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          submitter_id?: string
          daily_reports_uuid?: string
          amount?: number
          expense_type?: string
          expense_date?: string
          description?: string | null
          client_name?: string | null
          location?: string | null
          receipt_url?: string | null
          discussion_notes?: string | null
          associated_call?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}
