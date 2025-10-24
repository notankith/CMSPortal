import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient()
    const { data, error } = await supabase.from("editors").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching editors:", error)
    return NextResponse.json({ error: "Failed to fetch editors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, type } = await request.json()

    if (!name || !type || !["video", "graphic"].includes(type)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    // Generate unique secret link
    const secretLink = `${type}-${Math.random().toString(36).substring(2, 15)}`

    const supabase = await createServiceRoleClient()
    const { data, error } = await supabase
      .from("editors")
      .insert({
        name,
        type,
        secret_link: secretLink,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating editor:", error)
    return NextResponse.json({ error: "Failed to create editor" }, { status: 500 })
  }
}
