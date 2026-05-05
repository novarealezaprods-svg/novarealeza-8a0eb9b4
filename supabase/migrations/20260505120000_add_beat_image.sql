ALTER TABLE public.beats ADD COLUMN IF NOT EXISTS image_url text;
INSERT INTO storage.buckets (id, name, public) VALUES ('beat-images', 'beat-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "public read beat-images" ON storage.objects FOR SELECT USING (bucket_id = 'beat-images');
CREATE POLICY "public write beat-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'beat-images');
CREATE POLICY "public update beat-images" ON storage.objects FOR UPDATE USING (bucket_id = 'beat-images');
