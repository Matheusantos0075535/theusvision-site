-- Rotina da casa no banco: tarefas recorrentes, o que foi feito em cada dia, lista de compras
-- e os dias de missão. Módulo PESSOAL, RLS por dono. Seguro rodar mais de uma vez.

create table if not exists public.casa_estado (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  criado_em  timestamptz not null default now()
);

create table if not exists public.casa_tarefas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome       text not null check (char_length(btrim(nome)) between 1 and 80),
  freq       text not null check (freq in ('diaria', 'semanal', 'mensal')),
  dia        smallint check (dia between 0 and 6),
  ordem      smallint not null default 0,
  criado_em  timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.casa_feitas (
  user_id    uuid not null default auth.uid(),
  tarefa_id  uuid not null,
  dia        date not null default public.hub_hoje(),
  primary key (user_id, tarefa_id, dia),
  foreign key (tarefa_id, user_id) references public.casa_tarefas (id, user_id) on delete cascade
);

create table if not exists public.casa_compras (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome       text not null check (char_length(btrim(nome)) between 1 and 120),
  comprado   boolean not null default false,
  criado_em  timestamptz not null default now()
);

create table if not exists public.casa_missoes (
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia      date not null default public.hub_hoje(),
  primary key (user_id, dia)
);

create or replace function public.casa__sem_futuro()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.dia > public.hub_hoje() then
    raise exception 'TV: Não dá para marcar um dia que ainda não chegou.' using errcode = '22023';
  end if;
  return new;
end
$$;
drop trigger if exists casa_feitas_sem_futuro on public.casa_feitas;
create trigger casa_feitas_sem_futuro before insert on public.casa_feitas for each row execute function public.casa__sem_futuro();
drop trigger if exists casa_missoes_sem_futuro on public.casa_missoes;
create trigger casa_missoes_sem_futuro before insert on public.casa_missoes for each row execute function public.casa__sem_futuro();

alter table public.casa_estado enable row level security;
alter table public.casa_tarefas enable row level security;
alter table public.casa_feitas enable row level security;
alter table public.casa_compras enable row level security;
alter table public.casa_missoes enable row level security;

revoke all on public.casa_estado, public.casa_tarefas, public.casa_feitas, public.casa_compras, public.casa_missoes from public, anon, authenticated;
grant select on public.casa_estado, public.casa_tarefas, public.casa_feitas, public.casa_compras, public.casa_missoes to authenticated;
grant insert (id, nome, freq, dia, ordem), update (nome, freq, dia, ordem), delete on public.casa_tarefas to authenticated;
grant insert (tarefa_id, dia), delete on public.casa_feitas to authenticated;
grant insert (id, nome, comprado), update (nome, comprado), delete on public.casa_compras to authenticated;
grant insert (dia) on public.casa_missoes to authenticated;

do $$
declare t text;
begin
  foreach t in array array['casa_estado', 'casa_tarefas', 'casa_feitas', 'casa_compras', 'casa_missoes'] loop
    execute format('drop policy if exists %I on public.%I', t || '_ler', t);
    execute format('drop policy if exists %I on public.%I', t || '_criar', t);
    execute format('drop policy if exists %I on public.%I', t || '_alterar', t);
    execute format('drop policy if exists %I on public.%I', t || '_apagar', t);
    execute format('create policy %I on public.%I for select to authenticated
      using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_ler', t);
  end loop;
  foreach t in array array['casa_tarefas', 'casa_feitas', 'casa_compras', 'casa_missoes'] loop
    execute format('create policy %I on public.%I for insert to authenticated
      with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_criar', t);
  end loop;
  foreach t in array array['casa_tarefas', 'casa_compras'] loop
    execute format('create policy %I on public.%I for update to authenticated
      using (user_id = (select auth.uid()) and (select public.hub_autorizado()))
      with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_alterar', t);
  end loop;
  foreach t in array array['casa_tarefas', 'casa_feitas', 'casa_compras'] loop
    execute format('create policy %I on public.%I for delete to authenticated
      using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_apagar', t);
  end loop;
end
$$;

-- Primeira abertura: marca que a casa já foi iniciada e (se pedido) cria a rotina padrão.
-- Se você já tinha organizado a rotina no protótipo, o app passa p_semear = false e importa a sua.
create or replace function public.casa_iniciar(p_semear boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.hub_uid_autorizado();
  v_n integer;
begin
  insert into public.casa_estado (user_id) values (v_uid) on conflict do nothing;
  get diagnostics v_n = row_count;
  if v_n = 1 and coalesce(p_semear, true) then
    insert into public.casa_tarefas (user_id, nome, freq, dia, ordem) values
      (v_uid, 'Arrumar a cama', 'diaria', null, 1),
      (v_uid, 'Louça do dia', 'diaria', null, 2),
      (v_uid, 'Recolher roupas e objetos soltos', 'diaria', null, 3),
      (v_uid, 'Lavar roupa', 'semanal', 6, 4),
      (v_uid, 'Limpar banheiro', 'semanal', 6, 5),
      (v_uid, 'Trocar roupa de cama', 'semanal', 0, 6),
      (v_uid, 'Tirar o lixo reciclável', 'semanal', 3, 7),
      (v_uid, 'Limpar geladeira', 'mensal', null, 8);
  end if;
  return jsonb_build_object('novo', v_n = 1);
end
$$;
revoke all on function public.casa_iniciar(boolean) from public, anon;
revoke all on function public.casa__sem_futuro() from public, anon, authenticated;
grant execute on function public.casa_iniciar(boolean) to authenticated;
