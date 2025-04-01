"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { getSupabaseClient } from "@/lib/supabase/client"

type OpportunityType = {
  type: string
  count: number
}

export function Overview() {
  const [data, setData] = useState<OpportunityType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOpportunities = async () => {
      const supabase = getSupabaseClient()
      if (!supabase) return

      try {
        const { data: opportunities, error } = await supabase
          .from("opportunities")
          .select("status")

        if (error) throw error

        // Count opportunities by status
        const statusCounts = opportunities.reduce((acc: Record<string, number>, opp) => {
          acc[opp.status] = (acc[opp.status] || 0) + 1
          return acc
        }, {})

        // Convert to array format for chart
        const chartData = Object.entries(statusCounts).map(([type, count]) => ({
          type,
          count,
        }))

        setData(chartData)
      } catch (error) {
        console.error("Error fetching opportunities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOpportunities()
  }, [])

  if (isLoading) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="type"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Bar
          dataKey="count"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
} 