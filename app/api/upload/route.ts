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
      return NextResponse.json(
        { error: "Missing required fields: file, editorId and a non-empty description are required" },
        { status: 400 },
      )
    }

    // Optional: enforce a max file size to avoid runaway uploads (250 MB default)
    const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 250 * 1024 * 1024)
    try {
      // Some runtimes expose `size` on the File-like object returned by formData
      // If not present, skip this check.
      // @ts-ignore
      const size = typeof file.size === "number" ? (file as any).size : undefined
      if (typeof size === "number" && size > MAX_BYTES) {
        return NextResponse.json({ error: `File too large. Maximum allowed size is ${Math.round(MAX_BYTES / 1024 / 1024)} MB.` }, { status: 413 })
      }
    } catch (e) {
      // Ignore size check errors and continue — we'll rely on the storage SDK to error if needed.
    }

    // Upload file to Blob storage (capture and return useful error messages)
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    let mediaUrl: string
    try {
      mediaUrl = await uploadFile(file, `uploads/${editorId}/${fileName}`)
    } catch (uploadErr) {
      console.error("Blob upload failed:", uploadErr)
      const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr)
      return NextResponse.json({ error: `Storage upload failed: ${msg}` }, { status: 502 })
    }

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
      console.error("Supabase insert error:", error)
      // Return database error message (trimmed) to client for debugging — keep generic in production.
      const msg = (error as any)?.message || String(error)
      return NextResponse.json({ error: `Database error: ${msg}` }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Upload error:", error)
    // Surface the underlying error message in dev to make debugging easier. In production you may want
    // to return a more generic message.
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Failed to upload file: ${msg}` }, { status: 500 })
  }
}
