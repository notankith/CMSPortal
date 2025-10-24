import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServiceRoleClient()

    // Fetch all editors
    const { data: editors, error: editorsError } = await supabase.from("editors").select("*")
    if (editorsError) throw editorsError

    // Fetch all uploads and archived logs
    const { data: uploads, error: uploadsError } = await supabase.from("uploads").select("*")
    if (uploadsError) throw uploadsError

    const { data: logs, error: logsError } = await supabase.from("logs").select("*")
    if (logsError) throw logsError

    // Map editor id -> type (video | graphic)
    const editorTypeById: Record<string, string> = {}
    editors?.forEach((e: any) => {
      if (e && e.id) editorTypeById[e.id] = e.type
    })

    // Calculate total contents (both current uploads and archived logs)
    const totalContents = (uploads?.length || 0) + (logs?.length || 0)

    // Count reels (video) and posts (graphic)
    let reelsCount = 0
    let postsCount = 0
    const countByType = (item: any) => {
      const type = item && item.editor_id ? editorTypeById[item.editor_id] : undefined
      if (type === "video") reelsCount++
      else postsCount++
    }

    uploads?.forEach((u: any) => countByType(u))
    logs?.forEach((l: any) => countByType(l))

    // Calculate daily stats for last 7 days based on created_at from both uploads and logs
    const dailyStats: { [key: string]: { date: string; count: number } } = {}
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      dailyStats[dateStr] = { date: dateStr, count: 0 }
    }

    const addIfInRange = (createdAt: string | null | undefined) => {
      if (!createdAt) return
      const dateStr = new Date(createdAt).toISOString().split("T")[0]
      if (dateStr in dailyStats) {
        dailyStats[dateStr].count++
      }
    }

    uploads?.forEach((u) => addIfInRange(u.created_at))
    logs?.forEach((l) => addIfInRange(l.created_at))

    const MAX_DISPLAY = 15 // cap shown value for chart clarity

    const dailyStatsArray = Object.values(dailyStats).map(({ date, count }) => {
      const dt = new Date(date)
      const dayName = dt.toLocaleDateString("en-US", { weekday: "short" }) // Mon, Tue, etc.
      return {
        date,
        day: dayName,
        uploads: count,
        displayUploads: Math.min(count, MAX_DISPLAY),
      }
    })

    return NextResponse.json({
      totalContents,
      reelsReceived: reelsCount,
      postsReceived: postsCount,
      dailyStats: dailyStatsArray,
      maxDisplay: MAX_DISPLAY,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
