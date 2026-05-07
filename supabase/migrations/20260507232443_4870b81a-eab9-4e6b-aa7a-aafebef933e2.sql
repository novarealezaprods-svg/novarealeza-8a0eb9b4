insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 524288000, array['video/mp4','video/quicktime','video/webm'])
on conflict (id) do update set public = true, file_size_limit = 524288000, allowed_mime_types = array['video/mp4','video/quicktime','video/webm'];

create policy "Public read videos" on storage.objects for select using (bucket_id = 'videos');
create policy "Anyone upload videos" on storage.objects for insert with check (bucket_id = 'videos');
create policy "Anyone update videos" on storage.objects for update using (bucket_id = 'videos');
create policy "Anyone delete videos" on storage.objects for delete using (bucket_id = 'videos');