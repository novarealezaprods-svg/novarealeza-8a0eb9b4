
-- Settings (chave/valor) para video e checkout
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Beats
CREATE TABLE public.beats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  key TEXT,
  bpm TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Imagens de prova social
CREATE TABLE public.proof_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_images ENABLE ROW LEVEL SECURITY;

-- Acesso público de leitura/escrita (admin público, sem login)
CREATE POLICY "public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "public write settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read beats" ON public.beats FOR SELECT USING (true);
CREATE POLICY "public write beats" ON public.beats FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "public read images" ON public.proof_images FOR SELECT USING (true);
CREATE POLICY "public write images" ON public.proof_images FOR ALL USING (true) WITH CHECK (true);
