ALTER TABLE public.beats
  ADD COLUMN IF NOT EXISTS genre text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;