"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format, parseISO, subDays } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, FileText, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function TeamCallLogsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [callNotes, setCallNotes] = useState<any[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "90days" | "custom">("30days")

  useEffect(() => {
    // Check if user is admin, if not redirect
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      if (user.role !== "admin") {
        console.log("User is not admin, redirecting to dashboard")
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchCallNotes = async () => {
      if (isLoading || !user || user.role !== "admin") return

      try {
        setIsLoadingNotes(true)
        const supabase = getSupabaseClient()

        // Format dates for query
        const formattedStartDate = startDate.toISOString().split("T")[0]
        const formattedEndDate = endDate.toISOString().split("T")[0]

        // Fetch call notes with user details
        const { data, error } = await supabase
          .from("call_notes")
          .select(`
            *,
            users:submitter_id(full_name, email)
          `)
          .gte("call_date", formattedStartDate)
          .lte("call_date", formattedEndDate)
          .order("call_date", { ascending: false })

        if (error) throw error

        setCallNotes(data || [])
      } catch (err) {
        console.error("Error fetching call notes:", err)
      } finally {
        setIsLoadingNotes(false)
      }
    }

    fetchCallNotes()
  }, [user, isLoading, startDate, endDate])

  const handleDateRangeChange = (range: "7days" | "30days" | "90days" | "custom") => {
    setDateRange(range)
    const today = new Date()

    switch (range) {
      case "7days":
        setStartDate(subDays(today, 7))
        setEndDate(today)
        break
      case "30days":
        setStartDate(subDays(today, 30))
        setEndDate(today)
        break
      case "90days":
        setStartDate(subDays(today, 90))
        setEndDate(today)
        break
      // For custom, don't change dates automatically
    }
  }

  const filteredCallNotes = callNotes.filter((note) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      note.client_name.toLowerCase().includes(query) ||
      note.users?.full_name?.toLowerCase().includes(query) ||
      note.notes.toLowerCase().includes(query)
    )
  })

  if (isLoading || isLoadingNotes) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton href="/dashboard/admin" />
            <h1 className="text-2xl font-bold tracking-tight">Team Call Logs</h1>
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton href="/dashboard/admin" />
          <h1 className="text-2xl font-bold tracking-tight">Team Call Logs</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Call Notes</CardTitle>
          <CardDescription>View all call notes submitted by your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client, submitter, or content..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={dateRange === "7days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateRangeChange("7days")}
                >
                  7 Days
                </Button>
                <Button
                  variant={dateRange === "30days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateRangeChange("30days")}
                >
                  30 Days
                </Button>
                <Button
                  variant={dateRange === "90days" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateRangeChange("90days")}
                >
                  90 Days
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateRange === "custom" ? "default" : "outline"}
                      size="sm"
                      className="flex gap-1"
                      onClick={() => setDateRange("custom")}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      Custom
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={{
                        from: startDate,
                        to: endDate,
                      }}
                      onSelect={(range) => {
                        if (range?.from) setStartDate(range.from)
                        if (range?.to) setEndDate(range.to)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Submitter</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCallNotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No call notes found for the selected criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCallNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">{format(parseISO(note.call_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>{note.client_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{note.users?.full_name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">{note.users?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="truncate max-w-[300px]">{note.notes}</p>
                          {note.attachments && note.attachments.length > 0 && (
                            <Badge variant="outline" className="mt-1">
                              <FileText className="h-3 w-3 mr-1" />
                              {note.attachments.length} attachment{note.attachments.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/admin/call-logs/${note.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

