-- DuoNoSmkg: jornada sem fumar. Módulo PESSOAL e SENSÍVEL.
-- Regra: cada pessoa lê e grava só os próprios registros. Sem exceção, nem para admin.
-- Toda escrita sensível passa por funções que usam auth.uid(); o "dia" é sempre hub_hoje().

-- ---------- tabelas ----------

create table public.dnsmk_jornada (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  inicio_sequencia  date not null,            -- primeiro dia sem fumar da sequência atual
  dias_anteriores   integer not null default 0 check (dias_anteriores >= 0),  -- soma das sequências encerradas
  melhor_anterior   integer not null default 0 check (melhor_anterior >= 0),
  criado_em         timestamptz not null default now()
);

create table public.dnsmk_checkins (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  dia        date not null,
  humor      smallint not null check (humor between 1 and 5),
  fissura    smallint not null check (fissura between 0 and 10),
  sono       text not null check (sono in ('ruim', 'ok', 'bom')),
  ansiedade  text not null check (ansiedade in ('baixa', 'media', 'alta')),
  gatilhos   text[] not null default '{}'
             check (gatilhos <@ array['estresse', 'tedio', 'social', 'solidao', 'insonia', 'habito', 'outro']),
  ajudou     text check (char_length(ajudou) <= 280),
  criado_em  timestamptz not null default now(),
  unique (user_id, dia)
);

create table public.dnsmk_recaidas (
  id                   bigint generated always as identity primary key,
  user_id              uuid not null references auth.users (id) on delete cascade,
  dia                  date not null,
  nota                 text check (char_length(nota) <= 500),
  sequencia_encerrada  integer not null check (sequencia_encerrada >= 0),
  criado_em            timestamptz not null default now()
);

-- Catálogo das lições: só o id, a unidade e o dia da jornada em que libera.
-- Os textos ficam no front-end (src/modulos/dnsmk/conteudo/textosSaude.ts) para revisão profissional.
create table public.dnsmk_licoes_catalogo (
  id       text primary key,
  unidade  smallint not null check (unidade between 1 and 9),
  dia      integer not null check (dia >= 1)
);

create table public.dnsmk_licoes (
  user_id       uuid not null references auth.users (id) on delete cascade,
  licao_id      text not null references public.dnsmk_licoes_catalogo (id),
  concluida_em  timestamptz not null default now(),
  origem        text not null default 'app' check (origem in ('app', 'inicial')),
  primary key (user_id, licao_id)
);

create table public.dnsmk_conquistas (
  user_id         uuid not null references auth.users (id) on delete cascade,
  marco           integer not null check (marco > 0),
  conquistado_em  date not null,
  primary key (user_id, marco)
);

create table public.dnsmk_config (
  user_id        uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  som            boolean not null default false,
  vibracao       boolean not null default true,
  gasto_semanal  numeric(10, 2) check (gasto_semanal >= 0 and gasto_semanal <= 100000)
);

insert into public.dnsmk_licoes_catalogo (id, unidade, dia) values
  ('u1-1', 1, 1), ('u1-2', 1, 2), ('u1-3', 1, 3),
  ('u2-1', 2, 4), ('u2-2', 2, 5), ('u2-3', 2, 6), ('u2-4', 2, 7),
  ('u3-1', 3, 8), ('u3-2', 3, 10), ('u3-3', 3, 12), ('u3-4', 3, 14),
  ('u4-1', 4, 15), ('u4-2', 4, 18), ('u4-3', 4, 21), ('u4-4', 4, 24), ('u4-5', 4, 28),
  ('u5-1', 5, 29), ('u5-2', 5, 35), ('u5-3', 5, 42), ('u5-4', 5, 49), ('u5-5', 5, 56),
  ('u6-1', 6, 61), ('u6-2', 6, 65), ('u6-3', 6, 69), ('u6-4', 6, 73), ('u6-5', 6, 77), ('u6-6', 6, 81), ('u6-7', 6, 86),
  ('u7-1', 7, 91), ('u7-2', 7, 105), ('u7-3', 7, 120), ('u7-4', 7, 135), ('u7-5', 7, 150), ('u7-6', 7, 165), ('u7-7', 7, 180),
  ('u8-1', 8, 181), ('u8-2', 8, 210), ('u8-3', 8, 240), ('u8-4', 8, 270), ('u8-5', 8, 300), ('u8-6', 8, 335),
  ('u9-1', 9, 365), ('u9-2', 9, 400), ('u9-3', 9, 450), ('u9-4', 9, 500);

-- ---------- RLS: só o próprio usuário, e só se estiver autorizado no Hub ----------

alter table public.dnsmk_jornada enable row level security;
alter table public.dnsmk_checkins enable row level security;
alter table public.dnsmk_recaidas enable row level security;
alter table public.dnsmk_licoes_catalogo enable row level security;
alter table public.dnsmk_licoes enable row level security;
alter table public.dnsmk_conquistas enable row level security;
alter table public.dnsmk_config enable row level security;

revoke all on public.dnsmk_jornada, public.dnsmk_checkins, public.dnsmk_recaidas, public.dnsmk_licoes_catalogo,
  public.dnsmk_licoes, public.dnsmk_conquistas, public.dnsmk_config from public, anon, authenticated;

-- Leitura direta: só os próprios registros. Escrita só pelas funções abaixo (exceto config).
grant select on public.dnsmk_jornada, public.dnsmk_checkins, public.dnsmk_recaidas, public.dnsmk_licoes_catalogo,
  public.dnsmk_licoes, public.dnsmk_conquistas, public.dnsmk_config to authenticated;
grant insert, update on public.dnsmk_config to authenticated;

create policy dnsmk_jornada_propria on public.dnsmk_jornada for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy dnsmk_checkins_proprios on public.dnsmk_checkins for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy dnsmk_recaidas_proprias on public.dnsmk_recaidas for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy dnsmk_licoes_proprias on public.dnsmk_licoes for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy dnsmk_conquistas_proprias on public.dnsmk_conquistas for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy dnsmk_catalogo_autorizados on public.dnsmk_licoes_catalogo for select to authenticated
  using ((select public.hub_autorizado()));

create policy dnsmk_config_ler on public.dnsmk_config for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy dnsmk_config_criar on public.dnsmk_config for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy dnsmk_config_alterar on public.dnsmk_config for update to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()))
  with check (user_id = (select auth.uid()) and (select public.hub_autorizado()));

-- ---------- metas ----------

create function public.dnsmk_proxima_meta(p_dias integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    (select m from unnest(array[7, 14, 21, 30, 45, 60, 72, 80, 90, 100, 120, 150, 180, 270, 365]) m
      where m > p_dias order by m limit 1),
    365 + 90 * (floor((p_dias - 365) / 90.0)::integer + 1)
  )
$$;

create function public.dnsmk_meta_anterior(p_dias integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when p_dias >= 365 then 365 + 90 * floor((p_dias - 365) / 90.0)::integer
    else coalesce(
      (select m from unnest(array[7, 14, 21, 30, 45, 60, 72, 80, 90, 100, 120, 150, 180, 270]) m
        where m <= p_dias order by m desc limit 1), 0)
  end
$$;

create function public.dnsmk_marcos_ate(p_dias integer)
returns setof integer
language sql
immutable
set search_path = ''
as $$
  select m from unnest(array[7, 14, 21, 30, 45, 60, 72, 80, 90, 100, 120, 150, 180, 270, 365]) m where m <= p_dias
  union all
  select g from generate_series(455, greatest(p_dias, 0), 90) g
$$;

create function public.dnsmk_eh_marco(p_dias integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_dias > 0 and public.dnsmk_meta_anterior(p_dias) = p_dias
$$;

-- ---------- estado (calculado, nunca gravado como número fixo) ----------

create function public.dnsmk__estado(p_uid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hoje         date := public.hub_hoje();
  j              public.dnsmk_jornada;
  v_checkin_hoje boolean;
  v_atual        integer;
  v_dia_jornada  integer;
  v_pendentes    date[];
  v_apoio        boolean := false;
  v_ultimos      record;
  v_licao        record;
begin
  select * into j from public.dnsmk_jornada where user_id = p_uid;
  if not found then
    return jsonb_build_object('tem_jornada', false, 'hoje', v_hoje);
  end if;

  v_checkin_hoje := exists (select 1 from public.dnsmk_checkins where user_id = p_uid and dia = v_hoje);
  v_atual := greatest(0, (v_hoje - j.inicio_sequencia) + case when v_checkin_hoje then 1 else 0 end);
  v_dia_jornada := greatest(1, v_hoje - j.inicio_sequencia + 1);

  select coalesce(array_agg(d::date order by d desc), '{}') into v_pendentes
  from generate_series(v_hoje - 2, v_hoje - 1, interval '1 day') d
  where d::date >= j.inicio_sequencia
    and not exists (select 1 from public.dnsmk_checkins c where c.user_id = p_uid and c.dia = d::date);

  -- Apoio com carinho: humor 1 ou 2 nos 3 check-ins mais recentes, em dias seguidos e recentes.
  select count(*) as n, bool_and(humor <= 2) as baixos, max(dia) as ultimo, min(dia) as primeiro into v_ultimos
  from (select humor, dia from public.dnsmk_checkins where user_id = p_uid order by dia desc limit 3) t;
  v_apoio := v_ultimos.n = 3 and v_ultimos.baixos and v_ultimos.ultimo - v_ultimos.primeiro = 2
             and v_ultimos.ultimo >= v_hoje - 1;

  -- Próxima lição: a primeira liberada e não feita; se todas feitas, a próxima a liberar.
  select c.id, c.unidade, c.dia, (c.dia <= v_dia_jornada) as liberada into v_licao
  from public.dnsmk_licoes_catalogo c
  where not exists (select 1 from public.dnsmk_licoes l where l.user_id = p_uid and l.licao_id = c.id)
  order by (c.dia <= v_dia_jornada) desc, c.dia
  limit 1;

  return jsonb_build_object(
    'tem_jornada', true,
    'hoje', v_hoje,
    'inicio_sequencia', j.inicio_sequencia,
    'dia_da_jornada', v_dia_jornada,
    'sequencia_atual', v_atual,
    'checkin_hoje', v_checkin_hoje,
    'melhor', greatest(j.melhor_anterior, v_atual),
    'total', j.dias_anteriores + v_atual,
    'proxima_meta', public.dnsmk_proxima_meta(v_atual),
    'meta_anterior', public.dnsmk_meta_anterior(v_atual),
    'pendentes', to_jsonb(v_pendentes),
    'apoio_humor', coalesce(v_apoio, false),
    'recaida_hoje', exists (select 1 from public.dnsmk_recaidas where user_id = p_uid and dia = v_hoje),
    'proxima_licao', case when v_licao.id is null then null else jsonb_build_object(
      'id', v_licao.id, 'unidade', v_licao.unidade, 'dia', v_licao.dia, 'liberada', v_licao.liberada) end
  );
end
$$;

create function public.dnsmk_estado()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.dnsmk__estado(public.hub_uid_autorizado())
$$;

-- ---------- início da jornada (uma vez) ----------

create function public.dnsmk_iniciar(p_inicio date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := public.hub_uid_autorizado();
  v_hoje  date := public.hub_hoje();
  v_dias  integer;
begin
  if p_inicio is null or p_inicio > v_hoje then
    raise exception 'TV: A data de início não pode ser no futuro.';
  end if;
  if p_inicio < v_hoje - 3650 then
    raise exception 'TV: Escolha uma data dos últimos 10 anos.';
  end if;
  if exists (select 1 from public.dnsmk_jornada where user_id = v_uid) then
    raise exception 'TV: Sua jornada já foi iniciada.';
  end if;

  insert into public.dnsmk_jornada (user_id, inicio_sequencia) values (v_uid, p_inicio);
  v_dias := v_hoje - p_inicio;  -- dias completos antes de hoje

  -- Marcos e lições dos dias já vividos entram como conquistados.
  insert into public.dnsmk_conquistas (user_id, marco, conquistado_em)
  select v_uid, m, p_inicio + m - 1 from public.dnsmk_marcos_ate(v_dias) m;

  insert into public.dnsmk_licoes (user_id, licao_id, concluida_em, origem)
  select v_uid, c.id, (p_inicio + c.dia - 1)::timestamptz, 'inicial'
  from public.dnsmk_licoes_catalogo c
  where c.dia <= v_dias;

  return public.dnsmk__estado(v_uid);
end
$$;

-- ---------- check-in (idempotente: um por dia, nunca premia duas vezes) ----------

create function public.dnsmk_checkin(
  p_dia        date,
  p_humor      smallint,
  p_fissura    smallint,
  p_sono       text,
  p_ansiedade  text,
  p_gatilhos   text[],
  p_ajudou     text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := public.hub_uid_autorizado();
  v_hoje    date := public.hub_hoje();
  v_dia     date := coalesce(p_dia, public.hub_hoje());
  j         public.dnsmk_jornada;
  v_antes   jsonb;
  v_depois  jsonb;
  v_id      bigint;
  v_atual   integer;
  v_selo    integer;
begin
  select * into j from public.dnsmk_jornada where user_id = v_uid for update;
  if not found then
    raise exception 'TV: Comece sua jornada antes do primeiro check-in.';
  end if;
  if v_dia > v_hoje or v_dia < v_hoje - 2 then
    raise exception 'TV: Dá para registrar hoje ou até 2 dias atrás.';
  end if;
  if v_dia < j.inicio_sequencia then
    raise exception 'TV: Esse dia fica antes do início da sua sequência atual.';
  end if;

  v_antes := public.dnsmk__estado(v_uid);

  insert into public.dnsmk_checkins (user_id, dia, humor, fissura, sono, ansiedade, gatilhos, ajudou)
  values (v_uid, v_dia, p_humor, p_fissura, p_sono, p_ansiedade, coalesce(p_gatilhos, '{}'),
          nullif(btrim(p_ajudou), ''))
  on conflict (user_id, dia) do nothing
  returning id into v_id;

  v_depois := public.dnsmk__estado(v_uid);
  v_atual := (v_depois ->> 'sequencia_atual')::integer;

  if v_id is not null then
    with novos as (
      insert into public.dnsmk_conquistas (user_id, marco, conquistado_em)
      select v_uid, m, v_hoje from public.dnsmk_marcos_ate(v_atual) m
      on conflict do nothing
      returning marco
    )
    select max(marco) into v_selo from novos;
  end if;

  return jsonb_build_object(
    'novo', v_id is not null,
    'retroativo', v_dia < v_hoje,
    'antes', (v_antes ->> 'sequencia_atual')::integer,
    'depois', v_atual,
    'eh_marco', v_id is not null and v_dia = v_hoje and public.dnsmk_eh_marco(v_atual),
    'selo_novo', v_selo,
    'estado', v_depois
  );
end
$$;

-- ---------- recaída: encerra a sequência sem apagar nada ----------

create function public.dnsmk_recaida(p_nota text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := public.hub_uid_autorizado();
  v_hoje       date := public.hub_hoje();
  j            public.dnsmk_jornada;
  v_encerrada  integer;
begin
  select * into j from public.dnsmk_jornada where user_id = v_uid for update;
  if not found then
    raise exception 'TV: Você ainda não tem uma jornada iniciada.';
  end if;

  -- Já registrou recaída hoje: não conta duas vezes, só guarda a nota se vier.
  if j.inicio_sequencia > v_hoje then
    if nullif(btrim(p_nota), '') is not null then
      update public.dnsmk_recaidas set nota = left(btrim(p_nota), 500)
      where id = (select max(id) from public.dnsmk_recaidas where user_id = v_uid and dia = v_hoje);
    end if;
    return jsonb_build_object('dias_da_sequencia', 0, 'estado', public.dnsmk__estado(v_uid));
  end if;

  -- Encerra com o número que a pessoa estava vendo (inclui hoje se o check-in de hoje já foi feito),
  -- para que melhor sequência e total nunca diminuam.
  v_encerrada := (public.dnsmk__estado(v_uid) ->> 'sequencia_atual')::integer;

  insert into public.dnsmk_recaidas (user_id, dia, nota, sequencia_encerrada)
  values (v_uid, v_hoje, left(nullif(btrim(p_nota), ''), 500), v_encerrada);

  update public.dnsmk_jornada
  set dias_anteriores  = dias_anteriores + v_encerrada,
      melhor_anterior  = greatest(melhor_anterior, v_encerrada),
      inicio_sequencia = v_hoje + 1   -- amanhã é o dia 1 da nova sequência
  where user_id = v_uid;

  return jsonb_build_object('dias_da_sequencia', v_encerrada, 'estado', public.dnsmk__estado(v_uid));
end
$$;

-- ---------- lições ----------

create function public.dnsmk_concluir_licao(p_licao text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := public.hub_uid_autorizado();
  v_est   jsonb;
  v_dia   integer;
  v_linhas integer;
begin
  v_est := public.dnsmk__estado(v_uid);
  if not (v_est ->> 'tem_jornada')::boolean then
    raise exception 'TV: Comece sua jornada para liberar as lições.';
  end if;
  select dia into v_dia from public.dnsmk_licoes_catalogo where id = p_licao;
  if not found then
    raise exception 'TV: Lição não encontrada.';
  end if;
  if v_dia > (v_est ->> 'dia_da_jornada')::integer
     and not exists (select 1 from public.dnsmk_licoes where user_id = v_uid and licao_id = p_licao) then
    raise exception 'TV: Essa lição ainda não foi liberada.';
  end if;

  insert into public.dnsmk_licoes (user_id, licao_id) values (v_uid, p_licao)
  on conflict do nothing;
  get diagnostics v_linhas = row_count;

  return jsonb_build_object('novo', v_linhas > 0, 'estado', public.dnsmk__estado(v_uid));
end
$$;

-- ---------- permissões das funções ----------

revoke all on function public.dnsmk__estado(uuid) from public, anon, authenticated;
revoke all on function public.dnsmk_estado() from public, anon;
revoke all on function public.dnsmk_iniciar(date) from public, anon;
revoke all on function public.dnsmk_checkin(date, smallint, smallint, text, text, text[], text) from public, anon;
revoke all on function public.dnsmk_recaida(text) from public, anon;
revoke all on function public.dnsmk_concluir_licao(text) from public, anon;

grant execute on function public.dnsmk_estado() to authenticated;
grant execute on function public.dnsmk_iniciar(date) to authenticated;
grant execute on function public.dnsmk_checkin(date, smallint, smallint, text, text, text[], text) to authenticated;
grant execute on function public.dnsmk_recaida(text) to authenticated;
grant execute on function public.dnsmk_concluir_licao(text) to authenticated;
grant execute on function public.dnsmk_proxima_meta(integer) to authenticated;
grant execute on function public.dnsmk_meta_anterior(integer) to authenticated;
grant execute on function public.dnsmk_eh_marco(integer) to authenticated;
grant execute on function public.dnsmk_marcos_ate(integer) to authenticated;
