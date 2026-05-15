CREATE TABLE public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read playlists" ON public.playlists FOR SELECT USING (true);
CREATE POLICY "public write playlists" ON public.playlists FOR ALL USING (true) WITH CHECK (true);