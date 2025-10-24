"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Trash2 } from "lucide-react"

interface Editor {
  id: string
  name: string
  type: "video" | "graphic"
  secret_link: string
  created_at: string
}

export function EditorsManagement() {
  const [editors, setEditors] = useState<Editor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEditorName, setNewEditorName] = useState("")
  const [newEditorType, setNewEditorType] = useState<"video" | "graphic">("video")
  const [isCreating, setIsCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchEditors()
  }, [])

  const fetchEditors = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/editors")
      if (!response.ok) throw new Error("Failed to fetch editors")
      const data = await response.json()
      setEditors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load editors")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEditor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEditorName.trim()) return

    try {
      setIsCreating(true)
      const response = await fetch("/api/editors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newEditorName, type: newEditorType }),
      })
      if (!response.ok) throw new Error("Failed to create editor")
      const newEditor = await response.json()
      setEditors([newEditor, ...editors])
      setNewEditorName("")
      setNewEditorType("video")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create editor")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteEditor = async (editorId: string) => {
    if (!confirm("Are you sure you want to delete this editor and all their uploads?")) return

    try {
      const response = await fetch(`/api/editors/${editorId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete editor")
      setEditors(editors.filter((e) => e.id !== editorId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete editor")
    }
  }

  const copyToClipboard = (text: string, editorId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/upload/${text}`)
    setCopiedId(editorId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Editor</CardTitle>
          <CardDescription>Add a new video editor or graphic designer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateEditor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="editor-name">Name</Label>
                <Input
                  id="editor-name"
                  placeholder="Editor name"
                  value={newEditorName}
                  onChange={(e) => setNewEditorName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div>
                <Label htmlFor="editor-type">Type</Label>
                <Select value={newEditorType} onValueChange={(value: any) => setNewEditorType(value)}>
                  <SelectTrigger id="editor-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Editor</SelectItem>
                    <SelectItem value="graphic">Graphic Designer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={isCreating || !newEditorName.trim()}>
                  {isCreating ? "Creating..." : "Create Editor"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editors</CardTitle>
          <CardDescription>{editors.length} editor(s) registered</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {isLoading ? (
            <p className="text-gray-600">Loading editors...</p>
          ) : editors.length === 0 ? (
            <p className="text-gray-600">No editors yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {editors.map((editor) => (
                <div key={editor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{editor.name}</p>
                    <p className="text-sm text-gray-600">
                      {editor.type === "video" ? "Video Editor" : "Graphic Designer"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{editor.secret_link}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(editor.secret_link, editor.id)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      {copiedId === editor.id ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEditor(editor.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
