"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { format, parseISO, subDays } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Search, FileText, Eye, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function TeamCallLogsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [callNotes, setCallNotes] = useState<any[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "90days" | "custom">("30days")
  const [generatingSummaries, setGeneratingSummaries] = useState<Record<string, boolean>>({})

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
    const searchLower = searchQuery.toLowerCase()
    return (
      note.customer_name?.toLowerCase().includes(searchLower) ||
      note.contact_name?.toLowerCase().includes(searchLower) ||
      note.users?.full_name?.toLowerCase().includes(searchLower)
    )
  })

  const generateSummary = async (noteId: string) => {
    try {
      setGeneratingSummaries(prev => ({ ...prev, [noteId]: true }))

      const note = callNotes.find(n => n.id === noteId)
      if (!note) throw new Error('Note not found')

      // Call our API route
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteId,
          notes: note.notes
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const { summary } = await response.json()

      // Update the note with the summary
      const { error: updateError } = await supabase
        .from('call_notes')
        .update({ summary })
        .eq('id', noteId)

      if (updateError) throw updateError

      // Update the local state
      setCallNotes(prev => prev.map(note => 
        note.id === noteId ? { ...note, summary } : note
      ))

      toast({
        title: "Summary generated",
        description: "The call note has been summarized successfully.",
      })
    } catch (error) {
      console.error('Error generating summary:', error)
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGeneratingSummaries(prev => ({ ...prev, [noteId]: false }))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <h2 className="text-3xl font-bold tracking-tight">Team Call Logs</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Call Logs</CardTitle>
          <CardDescription>Search and filter call logs by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by customer name, contact name, or submitter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={dateRange === "7days" ? "default" : "outline"}
                  onClick={() => handleDateRangeChange("7days")}
                >
                  7 Days
                </Button>
                <Button
                  variant={dateRange === "30days" ? "default" : "outline"}
                  onClick={() => handleDateRangeChange("30days")}
                >
                  30 Days
                </Button>
                <Button
                  variant={dateRange === "90days" ? "default" : "outline"}
                  onClick={() => handleDateRangeChange("90days")}
                >
                  90 Days
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={dateRange === "custom" ? "default" : "outline"}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Custom Range
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={{ from: startDate, to: endDate }}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setStartDate(range.from)
                          setEndDate(range.to)
                          setDateRange("custom")
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
          <CardDescription>View and manage team call logs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingNotes ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCallNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>{format(parseISO(note.call_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{note.customer_name}</TableCell>
                    <TableCell>{note.contact_name || "-"}</TableCell>
                    <TableCell>{note.users?.full_name}</TableCell>
                    <TableCell>{note.location_type || "-"}</TableCell>
                    <TableCell>
                      {note.summary ? (
                        <div className="max-w-[300px] max-h-[100px] overflow-y-auto whitespace-pre-wrap">
                          {note.summary}
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={generatingSummaries[note.id]}
                          onClick={() => generateSummary(note.id)}
                        >
                          {generatingSummaries[note.id] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            'Generate'
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/admin/call-logs/${note.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

