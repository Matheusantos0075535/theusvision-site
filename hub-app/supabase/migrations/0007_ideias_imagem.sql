-- Imagem da ideia: coluna com o caminho do arquivo + bucket privado (uma pasta por usuário).
-- Seguro rodar mais de uma vez.

alter table public.ideias add column if not exists imagem_path text check (char_length(imagem_path) <= 300);

grant insert (imagem_path), update (imagem_path) on public.ideias to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ideias-imagens', 'ideias-imagens', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists ideias_img_ler on storage.objects;
drop policy if exists ideias_img_criar on storage.objects;
drop policy if exists ideias_img_alterar on storage.objects;
drop policy if exists ideias_img_apagar on storage.objects;

create policy ideias_img_ler on storage.objects for select to authenticated
  using (bucket_id = 'ideias-imagens' and (storage.foldername(name))[1] = (select auth.uid())::text
         and (select public.hub_autorizado()));
create policy ideias_img_criar on storage.objects for insert to authenticated
  with check (bucket_id = 'ideias-imagens' and (storage.foldername(name))[1] = (select auth.uid())::text
              and (select public.hub_autorizado()));
create policy ideias_img_alterar on storage.objects for update to authenticated
  using (bucket_id = 'ideias-imagens' and (storage.foldername(name))[1] = (select auth.uid())::text
         and (select public.hub_autorizado()));
create policy ideias_img_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'ideias-imagens' and (storage.foldername(name))[1] = (select auth.uid())::text
         and (select public.hub_autorizado()));
