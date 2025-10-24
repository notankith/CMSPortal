import { NextRequest } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

function escapeCsv(value: any) {
  if (value === null || value === undefined) return ""
  const s = String(value)
  if (s.includes("\n") || s.includes(",") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"

    const supabase = await createServiceRoleClient()

    const { data: uploads, error } = await supabase
      .from("uploads")
      .select(
        `
        id,
        file_name,
        caption,
        media_url,
        created_at,
        editor_id,
        editors:editor_id (
          id,
          name,
          type
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (error) throw error

    // Filter client-side by editor type if requested (video = reels, graphic = photos)
    const rows = (uploads || []).filter((u: any) => {
      if (!u.editors) return type === "all"
      if (type === "all") return true
      return u.editors.type === type
    })

    // Build CSV: file_name, link, direct_download_link, description, schedule_time, type, created_at
    const header = [
      "file_name",
      "link",
      "direct_download_link",
      "description",
      "schedule_time",
      "type",
      "created_at",
    ]

    const csvLines = [header.join(",")]

    for (const r of rows) {
      const fileName = escapeCsv(r.file_name)
      const link = escapeCsv(r.media_url)
      const direct = escapeCsv(r.media_url)
      const desc = escapeCsv(r.caption)
      const schedule = escapeCsv("") // placeholder for future schedule time editing
      const typ = escapeCsv(r.editors?.type || "")
      const created = escapeCsv(r.created_at)

      csvLines.push([fileName, link, direct, desc, schedule, typ, created].join(","))
    }

    const csv = csvLines.join("\n")

    const filename = `uploads-report-${type}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error("Failed to generate uploads CSV:", err)
    return new Response("Failed to generate CSV", { status: 500 })
  }
}
