-- Create editors table to store editor information
CREATE TABLE IF NOT EXISTS public.editors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'graphic')),
  secret_link TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploads table to store upload metadata
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  editor_id UUID NOT NULL REFERENCES public.editors(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  caption TEXT,
  media_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for editors table
-- Add INSERT and DELETE policies for admin operations
CREATE POLICY "editors_select_all" ON public.editors FOR SELECT USING (true);
CREATE POLICY "editors_insert_all" ON public.editors FOR INSERT WITH CHECK (true);
CREATE POLICY "editors_delete_all" ON public.editors FOR DELETE USING (true);

-- Create policies for uploads table (anyone can insert, select by editor)
CREATE POLICY "uploads_insert_all" ON public.uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "uploads_select_all" ON public.uploads FOR SELECT USING (true);
CREATE POLICY "uploads_delete_by_editor" ON public.uploads FOR DELETE USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_uploads_editor_id ON public.uploads(editor_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON public.uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_editors_secret_link ON public.editors(secret_link);
