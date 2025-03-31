"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, BarChart3, Users, ClipboardList, Settings, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalSubmitters: 0,
    totalOpportunities: 0,
    totalCallNotes: 0,
    recentCallNotes: 0,
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is admin, if not redirect
    if (!isLoading) {
      if (!user) {
        console.log("No user found, redirecting to login")
        router.push("/login")
        return
      }

      console.log("User role:", user.role)
      if (user.role !== "admin") {
        console.log("User is not admin, redirecting to dashboard")
        router.push("/dashboard")
        return
      }
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchStats = async () => {
      if (isLoading || !user || user.role !== "admin") return

      try {
        setIsLoadingStats(true)
        const supabase = getSupabaseClient()

        // Get count of submitters
        const { count: submitterCount, error: submitterError } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "submitter")

        if (submitterError) throw submitterError

        // Get count of opportunities
        const { count: opportunityCount, error: opportunityError } = await supabase
          .from("opportunities")
          .select("*", { count: "exact", head: true })

        if (opportunityError) throw opportunityError

        // Get count of all call notes
        const { count: callNoteCount, error: callNoteError } = await supabase
          .from("call_notes")
          .select("*", { count: "exact", head: true })

        if (callNoteError) throw callNoteError

        // Get count of recent call notes (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const formattedDate = sevenDaysAgo.toISOString().split("T")[0]

        const { count: recentCallNoteCount, error: recentCallNoteError } = await supabase
          .from("call_notes")
          .select("*", { count: "exact", head: true })
          .gte("call_date", formattedDate)

        if (recentCallNoteError) throw recentCallNoteError

        setStats({
          totalSubmitters: submitterCount || 0,
          totalOpportunities: opportunityCount || 0,
          totalCallNotes: callNoteCount || 0,
          recentCallNotes: recentCallNoteCount || 0,
        })
      } catch (err) {
        console.error("Error fetching admin stats:", err)
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchStats()
  }, [user, isLoading])

  if (isLoading || isLoadingStats) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.full_name || "Admin"}</h1>
        <p className="text-muted-foreground">
          Manage your team's activities, view reports, and access administrative tools.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmitters}</div>
            <p className="text-xs text-muted-foreground">Active submitters</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOpportunities}</div>
            <p className="text-xs text-muted-foreground">Total sales opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Call Notes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCallNotes}</div>
            <p className="text-xs text-muted-foreground">Total customer interactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentCallNotes}</div>
            <p className="text-xs text-muted-foreground">Call notes in the last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Team Opportunities
            </CardTitle>
            <CardDescription>View and manage sales opportunities across your team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track the status of all sales opportunities, monitor progress, and identify potential deals.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/admin/opportunities">
                View Opportunities
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Team Call Logs
            </CardTitle>
            <CardDescription>Review customer interactions and call notes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access detailed call logs, review customer interactions, and monitor team activity.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/admin/call-logs">
                View Call Logs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Administrator Console
            </CardTitle>
            <CardDescription>Manage users, settings, and system configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Add or remove users, configure system settings, and manage application preferences.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/admin/console">
                Open Console
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>The latest updates from your team</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calls">
            <TabsList>
              <TabsTrigger value="calls">Recent Calls</TabsTrigger>
              <TabsTrigger value="opportunities">New Opportunities</TabsTrigger>
            </TabsList>
            <TabsContent value="calls" className="space-y-4 mt-4">
              <p className="text-center text-muted-foreground py-8">Recent call activity will be displayed here.</p>
            </TabsContent>
            <TabsContent value="opportunities" className="space-y-4 mt-4">
              <p className="text-center text-muted-foreground py-8">New opportunities will be displayed here.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

