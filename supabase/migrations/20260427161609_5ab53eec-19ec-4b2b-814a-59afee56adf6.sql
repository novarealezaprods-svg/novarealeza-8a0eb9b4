drop policy if exists "Admins manage beats" on public.beats;
drop policy if exists "Admins manage proof images" on public.proof_images;
drop policy if exists "Admins manage site settings" on public.site_settings;

create policy "public write beats" on public.beats for all using (true) with check (true);
create policy "public write images" on public.proof_images for all using (true) with check (true);
create policy "public write settings" on public.site_settings for all using (true) with check (true);