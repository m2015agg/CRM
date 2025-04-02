export interface Opportunity {
  id: string
  created_at: string
  updated_at: string | null
  name: string
  company_name: string
  contact_name: string
  description: string | null
  status: string
  value: number | null
  owner_id: string
  request_machine: string | null
  requested_attachments: string | null
  expected_close_date: string | null
  trade_in_description: string | null
}

export interface User {
  id: string
  email: string
  full_name?: string
  role: "admin" | "submitter"
}

interface CallNote {
  id: string;
  client_name: string;
  contact_name?: string;
  location_type?: string;
  notes: string;
  // ... other properties
}

interface Expense {
  id: string;
  expense_type: string;
  amount: number;
  description?: string;
  receipt_url?: string;
  // ... other properties
}

