import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadFile } from "@/lib/blob-storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const editorId = formData.get("editorId") as string | null
    const captionEntry = formData.get("caption")
    const caption = typeof captionEntry === "string" ? captionEntry.trim() : null

    // Enforce required fields including a non-empty description (caption)
    if (!file || !editorId || !caption) {
      return NextResponse.json({ error: "Missing required fields: file, editorId and a non-empty description are required" }, { status: 400 })
    }

    // Upload file to Blob storage
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const mediaUrl = await uploadFile(file, `uploads/${editorId}/${fileName}`)

    // Save metadata to Supabase
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("uploads")
      .insert({
        editor_id: editorId,
        file_name: file.name,
        caption: caption || null,
        media_url: mediaUrl,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
