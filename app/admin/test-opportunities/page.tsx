"use client"

import { SimpleOpportunitiesList } from "@/components/simple-opportunities-list"
import { SupabaseDebug } from "@/components/supabase-debug"

export default function TestOpportunitiesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">All Opportunities (Test)</h1>
      <SupabaseDebug />
      <SimpleOpportunitiesList />
    </div>
  )
}

