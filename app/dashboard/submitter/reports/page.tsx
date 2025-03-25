"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Plus } from "lucide-react"
import { BackButton } from "@/components/back-button"
import Link from "next/link"

export default function ReportsPage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4">
        <BackButton href="/dashboard/submitter" label="Back to Dashboard" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Call Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Record your daily customer calls, expenses, and mileage in one place.
            </p>
            <Button asChild>
              <Link href="/dashboard/submitter/reports/daily">
                <Plus className="mr-2 h-4 w-4" />
                New Daily Report
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">View and export your weekly call report and expense summaries.</p>
            <Button asChild variant="outline">
              <Link href="/dashboard/submitter/reports/weekly">
                <Calendar className="mr-2 h-4 w-4" />
                View Weekly Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">Your recent call reports will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

