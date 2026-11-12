-- TheusVision Ideias: banco de ideias com link de referência (Instagram, YouTube, site), propósito,
-- data para executar e etapas do plano de ação. Módulo PESSOAL, RLS por dono.

create table public.ideias (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo        text not null check (char_length(btrim(titulo)) between 1 and 140),
  link          text check (char_length(link) <= 600 and (link is null or link ~* '^https?://')),
  proposito     text check (char_length(proposito) <= 1000),
  notas         text check (char_length(notas) <= 4000),
  area          text check (area in ('conteudo', 'negocio', 'pessoal', 'projeto', 'outro')),
  status        text not null default 'ideia' check (status in ('ideia', 'planejando', 'executando', 'feita', 'arquivada')),
  executar_em   date,
  favorita      boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (id, user_id)
);
create index ideias_usuario on public.ideias (user_id, status, atualizado_em desc);

create table public.ideias_etapas (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid(),
  ideia_id  uuid not null,
  ordem     smallint not null default 0,
  texto     text not null check (char_length(btrim(texto)) between 1 and 200),
  feita     boolean not null default false,
  foreign key (ideia_id, user_id) references public.ideias (id, user_id) on delete cascade
);
create index ideias_etapas_ideia on public.ideias_etapas (ideia_id, ordem);

-- Toda mudança numa etapa "mexe" na ideia (ela sobe na lista).
create function public.ideias__tocar()
returns trigger language plpgsql set search_path = '' as $$
begin
  update public.ideias set atualizado_em = now() where id = coalesce(new.ideia_id, old.ideia_id);
  return null;
end
$$;
create trigger ideias_etapas_tocar after insert or update or delete on public.ideias_etapas
  for each row execute function public.ideias__tocar();

alter table public.ideias enable row level security;
alter table public.ideias_etapas enable row level security;
revoke all on public.ideias, public.ideias_etapas from public, anon, authenticated;
grant select on public.ideias, public.ideias_etapas to authenticated;
grant insert (titulo, link, proposito, notas, area, status, executar_em, favorita),
      update (titulo, link, proposito, notas, area, status, executar_em, favorita, atualizado_em), delete
  on public.ideias to authenticated;
grant insert (ideia_id, ordem, texto, feita), update (ordem, texto, feita), delete on public.ideias_etapas to authenticated;

do $$
declare t text;
begin
  foreach t in array array['ideias', 'ideias_etapas'] loop
    execute format('create policy %I on public.%I for select to authenticated
      using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_ler', t);
    execute format('create policy %I on public.%I for insert to authenticated
      with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_criar', t);
    execute format('create policy %I on public.%I for update to authenticated
      using (user_id = (select auth.uid()) and (select public.hub_autorizado()))
      with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_alterar', t);
    execute format('create policy %I on public.%I for delete to authenticated
      using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_apagar', t);
  end loop;
end
$$;
revoke all on function public.ideias__tocar() from public, anon, authenticated;
