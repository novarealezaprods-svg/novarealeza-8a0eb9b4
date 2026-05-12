CREATE TABLE IF NOT EXISTS public.generos (
  key text PRIMARY KEY,
  capa_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read generos" ON public.generos;
CREATE POLICY "public read generos" ON public.generos FOR SELECT USING (true);

DROP POLICY IF EXISTS "public write generos" ON public.generos;
CREATE POLICY "public write generos" ON public.generos FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.generos (key) VALUES ('TRAP'), ('FUNK'), ('DRILL'), ('BOOMBAP')
ON CONFLICT (key) DO NOTHING;