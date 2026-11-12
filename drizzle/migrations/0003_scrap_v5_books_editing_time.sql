ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS book jsonb DEFAULT NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS editing_seconds double precision NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.documents.book IS 'Author-mode metadata; books remain pages and reuse document access policies.';
COMMENT ON COLUMN public.documents.editing_seconds IS 'Accumulated active editor time in seconds.';