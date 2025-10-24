import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient()

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Fetch today's uploads
    const { data: todayUploads, error: fetchError } = await supabase
      .from("uploads")
      .select("*")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())

    if (fetchError) throw fetchError

    if (todayUploads && todayUploads.length > 0) {
      const logsData = todayUploads.map((upload) => ({
        editor_id: upload.editor_id,
        file_name: upload.file_name,
        caption: upload.caption,
        media_url: upload.media_url,
        created_at: upload.created_at,
        archive_reason: "daily_reset",
      }))

      const { error: insertError } = await supabase.from("logs").insert(logsData)

      if (insertError) throw insertError
    }

    // Delete records from database
    const { error: deleteError } = await supabase
      .from("uploads")
      .delete()
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString())

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      archivedCount: todayUploads?.length || 0,
    })
  } catch (error) {
    console.error("Reset daily error:", error)
    return NextResponse.json({ error: "Failed to reset daily uploads" }, { status: 500 })
  }
}
