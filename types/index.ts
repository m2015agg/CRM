export interface Opportunity {
  id: string
  created_at: string
  updated_at: string
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  status: string
  value: number
  notes: string
  owner_id: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  role: "admin" | "submitter"
}

