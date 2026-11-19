-- Diário: entradas (texto livre, humor, etiquetas, pendências) e anexos (imagem e PDF).
-- Privado: só o dono lê e grava. Arquivos num bucket privado, uma pasta por usuário.
-- Seguro rodar mais de uma vez.

create table if not exists public.diario_entradas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia            date not null default public.hub_hoje(),
  titulo         text check (char_length(titulo) <= 120),
  texto          text not null default '' check (char_length(texto) <= 30000),
  humor          smallint check (humor between 1 and 5),
  etiquetas      text[] not null default '{}' check (cardinality(etiquetas) <= 12 and char_length(array_to_string(etiquetas, ',')) <= 400),
  favorita       boolean not null default false,
  -- Pendências anotadas na entrada: [{ "id", "texto", "feita", "levada" }]
  tarefas        jsonb not null default '[]'::jsonb check (jsonb_typeof(tarefas) = 'array' and pg_column_size(tarefas) < 20000),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists diario_entradas_usuario_dia on public.diario_entradas (user_id, dia desc, criado_em desc);

create table if not exists public.diario_anexos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entrada_id  uuid not null,
  path        text not null check (char_length(path) <= 300),
  nome        text not null check (char_length(nome) <= 200),
  tipo        text not null check (tipo in ('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf')),
  tamanho     integer not null default 0 check (tamanho >= 0),
  criado_em   timestamptz not null default now(),
  foreign key (entrada_id, user_id) references public.diario_entradas (id, user_id) on delete cascade
);
create index if not exists diario_anexos_entrada on public.diario_anexos (entrada_id);

-- Não escreve em dia que ainda não chegou (pode escrever em dias passados).
create or replace function public.diario__sem_futuro()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.dia > public.hub_hoje() then
    raise exception 'TV: Não dá para escrever em um dia que ainda não chegou.' using errcode = '22023';
  end if;
  return new;
end
$$;
drop trigger if exists diario_sem_futuro on public.diario_entradas;
create trigger diario_sem_futuro before insert or update of dia on public.diario_entradas for each row execute function public.diario__sem_futuro();
revoke all on function public.diario__sem_futuro() from public, anon, authenticated;

alter table public.diario_entradas enable row level security;
alter table public.diario_anexos enable row level security;
revoke all on public.diario_entradas, public.diario_anexos from public, anon, authenticated;
grant select on public.diario_entradas, public.diario_anexos to authenticated;
grant insert (id, dia, titulo, texto, humor, etiquetas, favorita, tarefas),
      update (dia, titulo, texto, humor, etiquetas, favorita, tarefas, atualizado_em), delete on public.diario_entradas to authenticated;
grant insert (id, entrada_id, path, nome, tipo, tamanho), delete on public.diario_anexos to authenticated;

drop policy if exists diario_entradas_ler on public.diario_entradas;
drop policy if exists diario_entradas_criar on public.diario_entradas;
drop policy if exists diario_entradas_alterar on public.diario_entradas;
drop policy if exists diario_entradas_apagar on public.diario_entradas;
create policy diario_entradas_ler on public.diario_entradas for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy diario_entradas_criar on public.diario_entradas for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy diario_entradas_alterar on public.diario_entradas for update to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()))
  with check (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy diario_entradas_apagar on public.diario_entradas for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));

drop policy if exists diario_anexos_ler on public.diario_anexos;
drop policy if exists diario_anexos_criar on public.diario_anexos;
drop policy if exists diario_anexos_apagar on public.diario_anexos;
create policy diario_anexos_ler on public.diario_anexos for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
-- O arquivo precisa estar na pasta do próprio usuário.
create policy diario_anexos_criar on public.diario_anexos for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.hub_autorizado()) and split_part(path, '/', 1) = (select auth.uid())::text);
create policy diario_anexos_apagar on public.diario_anexos for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diario', 'diario', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists diario_arq_ler on storage.objects;
drop policy if exists diario_arq_criar on storage.objects;
drop policy if exists diario_arq_apagar on storage.objects;
create policy diario_arq_ler on storage.objects for select to authenticated
  using (bucket_id = 'diario' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.hub_autorizado()));
create policy diario_arq_criar on storage.objects for insert to authenticated
  with check (bucket_id = 'diario' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.hub_autorizado()));
create policy diario_arq_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'diario' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.hub_autorizado()));
