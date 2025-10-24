import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServiceRoleClient()
    const { error } = await supabase.from("editors").delete().eq("id", params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete editor error:", error)
    return NextResponse.json({ error: "Failed to delete editor" }, { status: 500 })
  }
}
