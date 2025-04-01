"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Phone } from "lucide-react"
import type { Database } from "@/types/supabase"

type CallReport = {
  id: string
  client_name: string
  call_date: string
  submitter: {
    full_name: string
  }
}

type CallNoteWithUser = Database["public"]["Tables"]["call_notes"]["Row"] & {
  users: {
    full_name: string
  }
}

export function RecentSales() {
  const [reports, setReports] = useState<CallReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCallReports = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) return

      try {
        const { data, error } = await supabase
          .from("call_notes")
          .select(`
            id,
            client_name,
            call_date,
            users:submitter_id (
              full_name
            )
          `)
          .order("call_date", { ascending: false })
          .limit(5)

        if (error) throw error

        const formattedReports = (data as unknown as CallNoteWithUser[]).map(note => ({
          id: note.id,
          client_name: note.client_name,
          call_date: note.call_date,
          submitter: {
            full_name: note.users.full_name
          }
        }))

        setReports(formattedReports)
      } catch (error) {
        console.error("Error fetching call reports:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCallReports()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {reports.map((report) => (
        <Link key={report.id} href={`/dashboard/admin/call-logs/${report.id}`}>
          <div className="flex items-center hover:bg-muted/50 p-2 rounded-lg transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{report.client_name}</p>
              <p className="text-sm text-muted-foreground">
                {report.submitter.full_name} • {formatDistanceToNow(new Date(report.call_date), { addSuffix: true })}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
} 