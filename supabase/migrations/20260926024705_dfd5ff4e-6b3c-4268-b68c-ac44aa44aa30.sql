CREATE TABLE public.folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  color text NOT NULL DEFAULT 'graphite' CHECK (color IN ('graphite','marine','plum','amber','coral','emerald')),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;
GRANT ALL ON public.folders TO service_role;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own folders" ON public.folders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX folders_user_position_idx ON public.folders (user_id, position, created_at);
CREATE TRIGGER folders_touch BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.documents
  ADD COLUMN folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;
CREATE INDEX documents_folder_idx ON public.documents (folder_id, updated_at DESC);

ALTER TABLE public.user_settings
  ADD COLUMN card_previews boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.validate_page_folder()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.folder_id IS NOT NULL THEN
    IF NEW.kind <> 'page' THEN
      RAISE EXCEPTION 'Only pages can be placed in folders';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.folders f
      WHERE f.id = NEW.folder_id AND f.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Folder must belong to the document owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_page_folder() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_page_folder() TO service_role;
CREATE TRIGGER documents_validate_folder
  BEFORE INSERT OR UPDATE OF folder_id, kind, user_id ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.validate_page_folder();

CREATE OR REPLACE FUNCTION public.purge_expired_trash()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.documents
  WHERE deleted_at < now() - interval '30 days';
$$;
REVOKE ALL ON FUNCTION public.purge_expired_trash() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_trash() TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.schedule(
  'scrap-purge-expired-trash',
  '17 3 * * *',
  $$SELECT public.purge_expired_trash()$$
);