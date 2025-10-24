import { put, del } from "@vercel/blob"

export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const blob = await put(path, file, {
      access: "public",
    })
    return blob.url
  } catch (error) {
    console.error("Error uploading file to Blob:", error)
    // Preserve the underlying error message to help debugging upstream.
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to upload file: ${msg}`)
  }
}

export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url)
  } catch (error) {
    console.error("Error deleting file from Blob:", error)
    throw new Error("Failed to delete file")
  }
}
