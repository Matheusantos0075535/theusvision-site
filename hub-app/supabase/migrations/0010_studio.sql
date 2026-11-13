-- Creative Studio: quadros visuais (mood board, mapa mental, storyboard) por projeto.
-- O quadro inteiro fica num JSON (itens e ligações); imagens no bucket privado "studio".
-- Seguro rodar mais de uma vez.

create table if not exists public.studio_projetos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo         text not null check (char_length(btrim(titulo)) between 1 and 120),
  descricao      text check (char_length(descricao) <= 500),
  ideia_id       uuid references public.ideias (id) on delete set null,
  quadro         jsonb not null default '{"itens": [], "ligacoes": []}'::jsonb check (pg_column_size(quadro) < 3000000),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index if not exists studio_projetos_usuario on public.studio_projetos (user_id, atualizado_em desc);

alter table public.studio_projetos enable row level security;
revoke all on public.studio_projetos from public, anon, authenticated;
grant select on public.studio_projetos to authenticated;
grant insert (titulo, descricao, ideia_id, quadro), update (titulo, descricao, quadro, atualizado_em), delete
  on public.studio_projetos to authenticated;

drop policy if exists studio_ler on public.studio_projetos;
drop policy if exists studio_criar on public.studio_projetos;
drop policy if exists studio_alterar on public.studio_projetos;
drop policy if exists studio_apagar on public.studio_projetos;
create policy studio_ler on public.studio_projetos for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy studio_criar on public.studio_projetos for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.hub_autorizado())
    and (ideia_id is null or exists (select 1 from public.ideias i where i.id = ideia_id and i.user_id = (select auth.uid()))));
create policy studio_alterar on public.studio_projetos for update to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()))
  with check (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy studio_apagar on public.studio_projetos for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('studio', 'studio', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

drop policy if exists studio_img_ler on storage.objects;
drop policy if exists studio_img_criar on storage.objects;
drop policy if exists studio_img_alterar on storage.objects;
drop policy if exists studio_img_apagar on storage.objects;
create policy studio_img_ler on storage.objects for select to authenticated
  using (bucket_id = 'studio' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.hub_autorizado()));
create policy studio_img_criar on storage.objects for insert to authenticated
  with check (bucket_id = 'studio' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.hub_autorizado()));
create policy studio_img_alterar on storage.objects for update to authenticated
  using (bucket_id = 'studio' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.hub_autorizado()));
create policy studio_img_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'studio' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.hub_autorizado()));
