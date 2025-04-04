"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RecentSales() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          Coming Soon
        </div>
      </CardContent>
    </Card>
  )
} 