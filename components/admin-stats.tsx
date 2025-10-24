"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DailyStats {
  date: string
  day: string
  uploads: number
  displayUploads: number
}

interface StatsData {
  totalContents: number
  reelsReceived: number
  postsReceived: number
  dailyStats: DailyStats[]
  maxDisplay: number
}

export function AdminStats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/admin/stats")
        if (!response.ok) throw new Error("Failed to fetch stats")
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) return <p className="text-gray-600">Loading stats...</p>

  if (error || !stats) return <p className="text-red-600">{error || "Failed to load stats"}</p>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reels Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.reelsReceived}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Posts Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.postsReceived}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Uploads</CardTitle>
            <CardDescription>Upload activity over the last 7 days (archived items kept in counts)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, stats.maxDisplay]} />
                <Tooltip formatter={(value: any, name: any, props: any) => {
                  // show actual uploads value from payload (not the capped display)
                  if (props && props.payload && typeof props.payload.uploads === 'number') {
                    return [props.payload.uploads, 'uploads']
                  }
                  return [value, name]
                }} />
                <Bar dataKey="displayUploads" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
