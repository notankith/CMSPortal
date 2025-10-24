"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"

interface UploadFormProps {
  editorId: string
  editorName: string
  editorType: "video" | "graphic"
  onUploadSuccess: () => void
}

export function UploadForm({ editorId, editorName, editorType, onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles[0]) {
      setFile(droppedFiles[0])
      setError(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    if (!caption.trim()) {
      setError("Please add a description before uploading")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("editorId", editorId)
      formData.append("caption", caption)

      // Use XMLHttpRequest to get upload progress events
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/upload")

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100)
            setProgress(pct)
          }
        }

        xhr.onload = () => {
          const status = xhr.status
          const ok = status >= 200 && status < 300
          if (ok) {
            resolve()
            return
          }

          // Non-2xx: try to extract JSON error message or fall back to responseText/statusText
          let serverMsg = ""
          try {
            const json = JSON.parse(xhr.responseText || "{}")
            serverMsg = json.error || JSON.stringify(json)
          } catch (e) {
            serverMsg = (xhr.responseText && xhr.responseText.trim()) || xhr.statusText || "Upload failed"
          }

          const errMsg = `Upload failed (${status}): ${serverMsg}`
          // Surface the precise error immediately in the UI for the user to act on
          setError(errMsg)
          console.error("Upload error response:", status, xhr.responseText)
          reject(new Error(errMsg))
        }

        xhr.onerror = () => {
          const msg = "Network error while uploading. Check your connection and try again."
          setError(msg)
          console.error("XHR network error during upload")
          reject(new Error(msg))
        }

        xhr.onabort = () => {
          const msg = "Upload aborted by the client"
          setError(msg)
          console.warn("XHR upload aborted by user")
          reject(new Error(msg))
        }

        xhr.send(formData)
      })

      // success path
      setFile(null)
      setCaption("")
      setSuccess(true)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      setTimeout(() => setSuccess(false), 3000)
      onUploadSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file")
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Upload {editorType === "video" ? "Video" : "Graphic"}</CardTitle>
        <CardDescription className="text-slate-400">
          Upload your {editorType === "video" ? "video" : "graphic"} file and add a description
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-500/10"
                : "border-slate-600 hover:border-slate-500 bg-slate-700/50"
            }`}
          >
            <Upload className="mx-auto h-12 w-12 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-200 mb-1">Drag and drop your file here</p>
            <p className="text-xs text-slate-400 mb-4">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept={editorType === "video" ? "video/*" : "image/*"}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              Browse Files
            </Button>
          </div>

          {file && (
            <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <p className="text-sm font-medium text-slate-200">Selected file:</p>
              <p className="text-sm text-slate-300 truncate">{file.name}</p>
              <p className="text-xs text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          {/* Upload progress bar */}
          {(isLoading || progress > 0) && (
            <div>
              <div className="w-full bg-slate-700 rounded h-2 overflow-hidden mt-2">
                <div className="bg-blue-500 h-2 transition-width" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">{progress}% uploaded</p>
            </div>
          )}

          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-slate-200 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <Textarea
              id="caption"
              placeholder="Add a description for this upload..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              disabled={isLoading}
              className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
              required
              aria-required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <p className="text-sm text-green-400">Upload successful!</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading || !file || !caption.trim()}
          >
            {isLoading ? "Uploading..." : "Upload File"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
