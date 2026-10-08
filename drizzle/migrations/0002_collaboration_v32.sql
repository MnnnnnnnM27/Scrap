ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS username text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS collab_color text NOT NULL DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS show_cursors boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_names boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_whats_new boolean NOT NULL DEFAULT true;

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS collab_token uuid UNIQUE;

CREATE TABLE public.document_collaborators (
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (document_id, user_id)
);
GRANT SELECT, DELETE ON public.document_collaborators TO authenticated;
GRANT ALL ON public.document_collaborators TO service_role;
ALTER TABLE public.document_collaborators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_doc_collaborator(_doc uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.document_collaborators WHERE document_id = _doc AND user_id = _uid)
$$;

CREATE OR REPLACE FUNCTION public.is_doc_owner(_doc uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.documents WHERE id = _doc AND user_id = _uid)
$$;

CREATE POLICY "see collaborators of my docs" ON public.document_collaborators FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_doc_owner(document_id, auth.uid()) OR public.is_doc_collaborator(document_id, auth.uid()));
CREATE POLICY "leave or remove" ON public.document_collaborators FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_doc_owner(document_id, auth.uid()));

CREATE POLICY "collaborators read" ON public.documents FOR SELECT TO authenticated
  USING (public.is_doc_collaborator(id, auth.uid()));
CREATE POLICY "collaborators edit" ON public.documents FOR UPDATE TO authenticated
  USING (public.is_doc_collaborator(id, auth.uid()))
  WITH CHECK (public.is_doc_collaborator(id, auth.uid()));

CREATE OR REPLACE FUNCTION public.join_collab(_token uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id, user_id, kind INTO d FROM public.documents WHERE collab_token = _token AND deleted_at IS NULL;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF d.user_id <> auth.uid() THEN
    INSERT INTO public.document_collaborators (document_id, user_id) VALUES (d.id, auth.uid()) ON CONFLICT DO NOTHING;
  END IF;
  RETURN d.id;
END $$;

CREATE OR REPLACE FUNCTION public.doc_people(_docs uuid[])
RETURNS TABLE (document_id uuid, user_id uuid, username text, color text, is_owner boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH allowed AS (
    SELECT d.id, d.user_id FROM public.documents d
    WHERE d.id = ANY(_docs) AND (d.user_id = auth.uid() OR public.is_doc_collaborator(d.id, auth.uid()))
  ), people AS (
    SELECT a.id AS document_id, a.user_id, true AS is_owner FROM allowed a
    UNION
    SELECT c.document_id, c.user_id, false FROM public.document_collaborators c JOIN allowed a ON a.id = c.document_id
  )
  SELECT p.document_id, p.user_id, COALESCE(s.username, ''), COALESCE(s.collab_color, '#3b82f6'), p.is_owner
  FROM people p LEFT JOIN public.user_settings s ON s.user_id = p.user_id
  WHERE EXISTS (SELECT 1 FROM public.document_collaborators c WHERE c.document_id = p.document_id)
$$;

REVOKE EXECUTE ON FUNCTION public.join_collab(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.doc_people(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.join_collab(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.doc_people(uuid[]) TO authenticated;