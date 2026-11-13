-- Finanças: entradas e gastos (com forma de pagamento), contas fixas do mês, freio de compra,
-- dívidas, metas e dias em que você guardou dinheiro. Módulo PESSOAL, RLS por dono.
-- Seguro rodar mais de uma vez.

create table if not exists public.fin_categorias (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome       text not null check (char_length(btrim(nome)) between 1 and 60),
  limite     numeric(12, 2) not null default 0 check (limite >= 0),
  ordem      smallint not null default 0,
  unique (id, user_id)
);

create table if not exists public.fin_lancamentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo          text not null check (tipo in ('entrada', 'gasto')),
  valor         numeric(12, 2) not null check (valor > 0 and valor < 10000000),
  dia           date not null default public.hub_hoje(),
  categoria_id  uuid,
  descricao     text check (char_length(descricao) <= 200),
  pagamento     text check (pagamento in ('pix', 'credito', 'debito')),
  impulso       boolean not null default false,
  criado_em     timestamptz not null default now(),
  foreign key (categoria_id, user_id) references public.fin_categorias (id, user_id) on delete set null (categoria_id)
);
create index if not exists fin_lancamentos_usuario_dia on public.fin_lancamentos (user_id, dia desc);

create table if not exists public.fin_fixas (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome              text not null check (char_length(btrim(nome)) between 1 and 80),
  valor             numeric(12, 2) not null check (valor > 0 and valor < 10000000),
  dia_vencimento    smallint check (dia_vencimento between 1 and 31),
  tipo              text not null default 'assinatura' check (tipo in ('assinatura', 'parcela', 'conta')),
  pagamento         text check (pagamento in ('pix', 'credito', 'debito')),
  parcelas_total    smallint check (parcelas_total between 1 and 360),
  primeira_parcela  text check (primeira_parcela ~ '^\d{4}-\d{2}$'),
  ativa             boolean not null default true,
  criado_em         timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.fin_fixas_pagas (
  user_id  uuid not null default auth.uid(),
  fixa_id  uuid not null,
  mes      text not null check (mes ~ '^\d{4}-\d{2}$'),
  primary key (user_id, fixa_id, mes),
  foreign key (fixa_id, user_id) references public.fin_fixas (id, user_id) on delete cascade
);

create table if not exists public.fin_desejos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome        text not null check (char_length(btrim(nome)) between 1 and 120),
  valor       numeric(12, 2) not null check (valor > 0),
  criado_em   timestamptz not null default now(),
  decisao     text check (decisao in ('comprei', 'desisti'))
);

create table if not exists public.fin_dividas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome       text not null check (char_length(btrim(nome)) between 1 and 80),
  original   numeric(12, 2) not null check (original > 0),
  saldo      numeric(12, 2) not null check (saldo >= 0),
  parcela    numeric(12, 2) not null default 0 check (parcela >= 0),
  criado_em  timestamptz not null default now()
);

create table if not exists public.fin_metas (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome     text not null check (char_length(btrim(nome)) between 1 and 80),
  alvo     numeric(12, 2) not null check (alvo > 0),
  ordem    smallint not null default 0,
  unique (id, user_id)
);

create table if not exists public.fin_aportes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  meta_id    uuid not null,
  valor      numeric(12, 2) not null check (valor > 0),
  dia        date not null default public.hub_hoje(),
  criado_em  timestamptz not null default now(),
  foreign key (meta_id, user_id) references public.fin_metas (id, user_id) on delete cascade
);

-- Nada no futuro (lançamentos e aportes).
create or replace function public.fin__sem_futuro()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.dia > public.hub_hoje() then
    raise exception 'TV: Não dá para lançar em dia que ainda não chegou.' using errcode = '22023';
  end if;
  return new;
end
$$;
drop trigger if exists fin_lancamentos_sem_futuro on public.fin_lancamentos;
create trigger fin_lancamentos_sem_futuro before insert or update of dia on public.fin_lancamentos for each row execute function public.fin__sem_futuro();
drop trigger if exists fin_aportes_sem_futuro on public.fin_aportes;
create trigger fin_aportes_sem_futuro before insert or update of dia on public.fin_aportes for each row execute function public.fin__sem_futuro();

-- ---------- RLS ----------
alter table public.fin_categorias enable row level security;
alter table public.fin_lancamentos enable row level security;
alter table public.fin_fixas enable row level security;
alter table public.fin_fixas_pagas enable row level security;
alter table public.fin_desejos enable row level security;
alter table public.fin_dividas enable row level security;
alter table public.fin_metas enable row level security;
alter table public.fin_aportes enable row level security;

revoke all on public.fin_categorias, public.fin_lancamentos, public.fin_fixas, public.fin_fixas_pagas, public.fin_desejos,
  public.fin_dividas, public.fin_metas, public.fin_aportes from public, anon, authenticated;
grant select on public.fin_categorias, public.fin_lancamentos, public.fin_fixas, public.fin_fixas_pagas, public.fin_desejos,
  public.fin_dividas, public.fin_metas, public.fin_aportes to authenticated;
grant insert (nome, limite, ordem), update (nome, limite, ordem), delete on public.fin_categorias to authenticated;
grant insert (tipo, valor, dia, categoria_id, descricao, pagamento, impulso),
      update (tipo, valor, dia, categoria_id, descricao, pagamento, impulso), delete on public.fin_lancamentos to authenticated;
grant insert (nome, valor, dia_vencimento, tipo, pagamento, parcelas_total, primeira_parcela, ativa),
      update (nome, valor, dia_vencimento, tipo, pagamento, parcelas_total, primeira_parcela, ativa), delete on public.fin_fixas to authenticated;
grant insert (fixa_id, mes), delete on public.fin_fixas_pagas to authenticated;
grant insert (nome, valor), update (nome, valor, decisao), delete on public.fin_desejos to authenticated;
grant insert (nome, original, saldo, parcela), update (nome, original, saldo, parcela), delete on public.fin_dividas to authenticated;
grant insert (nome, alvo, ordem), update (nome, alvo, ordem), delete on public.fin_metas to authenticated;
grant insert (meta_id, valor, dia), delete on public.fin_aportes to authenticated;

do $$
declare t text;
begin
  foreach t in array array['fin_categorias', 'fin_lancamentos', 'fin_fixas', 'fin_fixas_pagas', 'fin_desejos', 'fin_dividas', 'fin_metas', 'fin_aportes'] loop
    execute format('drop policy if exists %I on public.%I', t || '_ler', t);
    execute format('drop policy if exists %I on public.%I', t || '_criar', t);
    execute format('drop policy if exists %I on public.%I', t || '_alterar', t);
    execute format('drop policy if exists %I on public.%I', t || '_apagar', t);
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

-- Abertura: categorias e metas padrão (uma vez), sem valores.
create or replace function public.fin_iniciar()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.hub_uid_autorizado();
begin
  if not exists (select 1 from public.fin_categorias where user_id = v_uid) then
    insert into public.fin_categorias (user_id, nome, ordem) values
      (v_uid, 'Casa e contas', 1), (v_uid, 'Mercado', 2), (v_uid, 'Transporte', 3),
      (v_uid, 'Lazer e saídas', 4), (v_uid, 'Compras pessoais', 5), (v_uid, 'Saúde e academia', 6), (v_uid, 'Outros', 7);
  end if;
  if not exists (select 1 from public.fin_metas where user_id = v_uid) then
    insert into public.fin_metas (user_id, nome, alvo, ordem) values
      (v_uid, 'Reserva de emergência', 12000, 1), (v_uid, 'Investimentos', 5000, 2);
  end if;
  return jsonb_build_object('hoje', public.hub_hoje());
end
$$;
revoke all on function public.fin_iniciar() from public, anon;
revoke all on function public.fin__sem_futuro() from public, anon, authenticated;
grant execute on function public.fin_iniciar() to authenticated;
