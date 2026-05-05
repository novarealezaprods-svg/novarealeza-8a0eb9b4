-- Create public bucket for beat audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('beats', 'beats', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
CREATE POLICY "Public read beats audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'beats');

-- Public write (admin panel uses anon key, gated by app password)
CREATE POLICY "Public upload beats audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'beats');

CREATE POLICY "Public update beats audio"
ON storage.objects FOR UPDATE
USING (bucket_id = 'beats');

CREATE POLICY "Public delete beats audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'beats');