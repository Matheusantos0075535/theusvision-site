-- Leitura: vários livros ao mesmo tempo, com ofensiva diária. Módulo PESSOAL.
-- Regra: RLS por user_id = auth.uid() em todas as tabelas, sem exceção (nem admin).
-- Tabelas filhas usam FK composta (livro_id, user_id) para garantir que o livro é do mesmo dono.

-- ---------- tabelas ----------

create table public.leit_config (
  user_id                uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  meta_paginas           integer default 10 check (meta_paginas between 1 and 500),
  meta_minutos           integer default 10 check (meta_minutos between 1 and 600),
  meta_anual_livros      integer not null default 12 check (meta_anual_livros between 1 and 365),
  som                    boolean not null default false,
  vibracao               boolean not null default true,
  congelamento_usado_em  date,
  check (meta_paginas is not null or meta_minutos is not null)
);

create table public.leit_livros (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo         text not null check (char_length(btrim(titulo)) between 1 and 200),
  autor          text check (char_length(autor) <= 120),
  capa_path      text check (char_length(capa_path) <= 300),
  total_paginas  integer not null check (total_paginas between 1 and 20000),
  pagina_atual   integer not null default 0,
  estado         text not null default 'quero_ler' check (estado in ('quero_ler', 'lendo', 'concluido', 'pausado')),
  iniciado_em    date,
  concluido_em   date,
  nota_final     smallint check (nota_final between 1 and 5),
  resumo_final   text check (char_length(resumo_final) <= 500),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  check (pagina_atual between 0 and total_paginas),
  unique (id, user_id)
);

create table public.leit_capitulos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid(),
  livro_id        uuid not null,
  ordem           smallint not null check (ordem between 1 and 500),
  nome            text not null check (char_length(btrim(nome)) between 1 and 120),
  pagina_inicial  integer not null check (pagina_inicial >= 1),
  foreign key (livro_id, user_id) references public.leit_livros (id, user_id) on delete cascade,
  unique (id, user_id)
);

create table public.leit_sessoes (
  id            uuid primary key,  -- gerado no aparelho: chave de idempotência
  user_id       uuid not null,
  livro_id      uuid not null,
  dia           date not null,
  pagina_inicio integer not null,
  pagina_fim    integer,
  paginas       integer not null default 0 check (paginas >= 0),
  minutos       integer check (minutos between 0 and 1440),
  foco          smallint check (foco between 1 and 5),
  aprendizado   text check (char_length(aprendizado) <= 500),
  criado_em     timestamptz not null default now(),
  foreign key (livro_id, user_id) references public.leit_livros (id, user_id) on delete restrict
);
create index leit_sessoes_usuario_dia on public.leit_sessoes (user_id, dia);

-- Um dia por usuário: soma do dia e se a meta foi cumprida (congelada no dia, nunca volta a falso).
create table public.leit_dias (
  user_id    uuid not null references auth.users (id) on delete cascade,
  dia        date not null,
  paginas    integer not null default 0,
  minutos    integer not null default 0,
  cumprido   boolean not null default false,
  congelado  boolean not null default false,
  primary key (user_id, dia)
);

create table public.leit_trechos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid(),
  livro_id   uuid not null,
  pagina     integer check (pagina >= 1),
  citacao    text not null check (char_length(btrim(citacao)) between 1 and 500),
  criado_em  timestamptz not null default now(),
  foreign key (livro_id, user_id) references public.leit_livros (id, user_id) on delete cascade
);

create table public.leit_fixacao (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid(),
  livro_id     uuid not null,
  capitulo_id  uuid references public.leit_capitulos (id) on delete set null,
  parte        smallint check (parte between 1 and 10),
  rotulo       text not null check (char_length(rotulo) <= 140),
  resposta     text not null check (char_length(btrim(resposta)) between 1 and 500),
  criado_em    timestamptz not null default now(),
  foreign key (livro_id, user_id) references public.leit_livros (id, user_id) on delete cascade
);

create table public.leit_conquistas (
  user_id         uuid not null references auth.users (id) on delete cascade,
  tipo            text not null check (tipo in ('ofensiva', 'paginas')),
  marco           integer not null,
  conquistado_em  date not null,
  primary key (user_id, tipo, marco)
);

-- ---------- datas automáticas do livro ----------

create function public.leit__datas_livro()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  if new.estado = 'lendo' and new.iniciado_em is null then
    new.iniciado_em := public.hub_hoje();
  end if;
  if new.estado = 'concluido' then
    new.pagina_atual := new.total_paginas;
    new.iniciado_em := coalesce(new.iniciado_em, public.hub_hoje());
    new.concluido_em := coalesce(new.concluido_em, public.hub_hoje());
  else
    new.concluido_em := null;
  end if;
  return new;
end
$$;

create trigger leit_livros_datas before insert or update on public.leit_livros
  for each row execute function public.leit__datas_livro();

-- ---------- RLS ----------

alter table public.leit_config enable row level security;
alter table public.leit_livros enable row level security;
alter table public.leit_capitulos enable row level security;
alter table public.leit_sessoes enable row level security;
alter table public.leit_dias enable row level security;
alter table public.leit_trechos enable row level security;
alter table public.leit_fixacao enable row level security;
alter table public.leit_conquistas enable row level security;

revoke all on public.leit_config, public.leit_livros, public.leit_capitulos, public.leit_sessoes, public.leit_dias,
  public.leit_trechos, public.leit_fixacao, public.leit_conquistas from public, anon, authenticated;

grant select on public.leit_config, public.leit_livros, public.leit_capitulos, public.leit_sessoes, public.leit_dias,
  public.leit_trechos, public.leit_fixacao, public.leit_conquistas to authenticated;

-- Config: tudo menos o controle do congelamento.
grant insert (user_id, meta_paginas, meta_minutos, meta_anual_livros, som, vibracao),
      update (meta_paginas, meta_minutos, meta_anual_livros, som, vibracao) on public.leit_config to authenticated;
-- Livros: o progresso (página atual) só muda pelas sessões.
grant insert (titulo, autor, capa_path, total_paginas, estado),
      update (titulo, autor, capa_path, total_paginas, estado, nota_final, resumo_final),
      delete on public.leit_livros to authenticated;
grant insert (livro_id, ordem, nome, pagina_inicial), update (ordem, nome, pagina_inicial), delete
  on public.leit_capitulos to authenticated;
grant insert (livro_id, pagina, citacao), update (pagina, citacao), delete on public.leit_trechos to authenticated;
grant insert (livro_id, capitulo_id, parte, rotulo, resposta), update (resposta), delete on public.leit_fixacao to authenticated;

do $$
declare t text;
begin
  foreach t in array array['leit_config', 'leit_livros', 'leit_capitulos', 'leit_sessoes', 'leit_dias',
                           'leit_trechos', 'leit_fixacao', 'leit_conquistas'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_ler', t);
  end loop;
  foreach t in array array['leit_config', 'leit_livros', 'leit_capitulos', 'leit_trechos', 'leit_fixacao'] loop
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_criar', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))
         with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_alterar', t);
  end loop;
  foreach t in array array['leit_livros', 'leit_capitulos', 'leit_trechos', 'leit_fixacao'] loop
    execute format(
      'create policy %I on public.%I for delete to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_apagar', t);
  end loop;
end
$$;

-- ---------- capas: bucket privado, uma pasta por usuário ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('leit-capas', 'leit-capas', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy leit_capas_ler on storage.objects for select to authenticated
  using (bucket_id = 'leit-capas' and (storage.foldername(name))[1] = (select auth.uid())::text
         and (select public.hub_autorizado()));
create policy leit_capas_criar on storage.objects for insert to authenticated
  with check (bucket_id = 'leit-capas' and (storage.foldername(name))[1] = (select auth.uid())::text
              and (select public.hub_autorizado()));
create policy leit_capas_alterar on storage.objects for update to authenticated
  using (bucket_id = 'leit-capas' and (storage.foldername(name))[1] = (select auth.uid())::text
         and (select public.hub_autorizado()));
create policy leit_capas_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'leit-capas' and (storage.foldername(name))[1] = (select auth.uid())::text
         and (select public.hub_autorizado()));

-- ---------- marcos ----------

create function public.leit_marcos(p_tipo text)
returns integer[]
language sql
immutable
set search_path = ''
as $$
  select case p_tipo
    when 'ofensiva' then array[7, 14, 21, 30, 60, 100, 200, 365, 500, 730, 1000]
    else array[100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]
  end
$$;

-- ---------- ofensiva (calculada a partir de leit_dias) ----------

create function public.leit__ofensiva(p_uid uuid)
returns table (atual integer, melhor integer, total integer, hoje_cumprido boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with h as (select public.hub_hoje() as hoje),
  validos as (
    select dia, cumprido,
           dia - (row_number() over (order by dia))::integer as grupo
    from public.leit_dias
    where user_id = p_uid and (cumprido or congelado)
  ),
  ilhas as (
    select grupo, max(dia) as fim, count(*) filter (where cumprido)::integer as dias
    from validos group by grupo
  )
  select
    coalesce((select i.dias from ilhas i, h where i.fim >= h.hoje - 1 order by i.fim desc limit 1), 0),
    coalesce((select max(dias) from ilhas), 0),
    (select count(*)::integer from public.leit_dias where user_id = p_uid and cumprido),
    exists (select 1 from public.leit_dias d, h where d.user_id = p_uid and d.dia = h.hoje and d.cumprido)
$$;

create function public.leit__estado(p_uid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_hoje    date := public.hub_hoje();
  o         record;
  c         public.leit_config;
  d_hoje    public.leit_dias;
  v_livro   jsonb;
  v_marcos  integer[] := public.leit_marcos('ofensiva');
  v_prox    integer;
  v_ant     integer;
  v_cong_ok boolean;
  v_pode    boolean;
begin
  select * into o from public.leit__ofensiva(p_uid);
  select * into c from public.leit_config where user_id = p_uid;
  select * into d_hoje from public.leit_dias where user_id = p_uid and dia = v_hoje;

  select coalesce(max(m), 0) into v_ant from unnest(v_marcos) m where m <= o.atual;
  select min(m) into v_prox from unnest(v_marcos) m where m > o.atual;
  v_prox := coalesce(v_prox, o.atual + 365);

  -- Livro atual: o "lendo" com sessão mais recente; se nenhum, o "lendo" mais recente.
  select jsonb_build_object('id', l.id, 'titulo', l.titulo, 'pct',
           round(l.pagina_atual * 100.0 / l.total_paginas)::integer)
  into v_livro
  from public.leit_livros l
  left join lateral (select max(s.criado_em) as ultima from public.leit_sessoes s where s.livro_id = l.id) s on true
  where l.user_id = p_uid and l.estado = 'lendo'
  order by s.ultima desc nulls last, l.atualizado_em desc
  limit 1;

  -- Proteção de 1 dia: disponível uma vez a cada 30 dias.
  v_cong_ok := c.congelamento_usado_em is null or c.congelamento_usado_em < v_hoje - 30;
  v_pode := v_cong_ok
    and not exists (select 1 from public.leit_dias where user_id = p_uid and dia = v_hoje - 1 and (cumprido or congelado))
    and exists (select 1 from public.leit_dias where user_id = p_uid and dia = v_hoje - 2 and (cumprido or congelado));

  return jsonb_build_object(
    'hoje', v_hoje,
    'ofensiva', o.atual,
    'melhor', o.melhor,
    'total_dias', o.total,
    'hoje_cumprido', o.hoje_cumprido,
    'hoje_paginas', coalesce(d_hoje.paginas, 0),
    'hoje_minutos', coalesce(d_hoje.minutos, 0),
    'meta_paginas', case when c.user_id is null then 10 else c.meta_paginas end,
    'meta_minutos', case when c.user_id is null then 10 else c.meta_minutos end,
    'meta_anual', coalesce(c.meta_anual_livros, 12),
    'proxima_meta', v_prox,
    'meta_anterior', v_ant,
    'livro_atual', v_livro,
    'congelamento_disponivel', v_cong_ok,
    'pode_congelar', v_pode,
    'paginas_total', (select coalesce(sum(paginas), 0) from public.leit_sessoes where user_id = p_uid),
    'livros_ano', (select count(*) from public.leit_livros where user_id = p_uid and estado = 'concluido'
                     and extract(year from concluido_em) = extract(year from v_hoje))
  );
end
$$;

create function public.leit_estado()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.leit__estado(public.hub_uid_autorizado())
$$;

-- ---------- sessão de leitura (idempotente pelo id gerado no aparelho) ----------

create function public.leit_registrar_sessao(
  p_id              uuid,
  p_livro           uuid,
  p_dia             date,
  p_pagina_fim      integer,
  p_minutos         integer,
  p_foco            smallint,
  p_aprendizado     text,
  p_trecho_pagina   integer,
  p_trecho_citacao  text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := public.hub_uid_autorizado();
  v_hoje       date := public.hub_hoje();
  v_dia        date := coalesce(p_dia, public.hub_hoje());
  l            public.leit_livros;
  c            public.leit_config;
  v_antes      record;
  v_depois     record;
  v_dia_antes  boolean;
  v_dia_agora  boolean;
  v_paginas    integer := 0;
  v_pag_antes  integer;
  v_pag_nova   integer;
  v_concluiu   boolean := false;
  v_selo       integer;
  v_selo_pag   integer;
  v_caps       jsonb;
  v_cap_atual  text;
  v_marcos     integer[] := public.leit_marcos('ofensiva');
  v_ant        integer;
  v_prox       integer;
begin
  if p_id is null then
    raise exception 'TV: Sessão sem identificador.';
  end if;
  if exists (select 1 from public.leit_sessoes where id = p_id) then
    if not exists (select 1 from public.leit_sessoes where id = p_id and user_id = v_uid) then
      raise exception 'TV: Sessão inválida.';
    end if;
    return jsonb_build_object('novo', false, 'estado', public.leit__estado(v_uid));
  end if;
  if v_dia > v_hoje or v_dia < v_hoje - 2 then
    raise exception 'TV: Dá para registrar hoje ou até 2 dias atrás.';
  end if;

  select * into l from public.leit_livros where id = p_livro and user_id = v_uid for update;
  if not found then
    raise exception 'TV: Livro não encontrado.';
  end if;
  if l.estado = 'concluido' then
    raise exception 'TV: Esse livro já foi concluído.';
  end if;
  if p_pagina_fim is null and coalesce(p_minutos, 0) <= 0 then
    raise exception 'TV: Informe até que página chegou ou quantos minutos leu.';
  end if;
  if p_pagina_fim is not null and (p_pagina_fim < 0 or p_pagina_fim > l.total_paginas) then
    raise exception 'TV: A página precisa estar entre 0 e %.', l.total_paginas;
  end if;
  if p_pagina_fim is not null and p_pagina_fim < l.pagina_atual and coalesce(p_minutos, 0) <= 0 then
    raise exception 'TV: Você já estava na página %. Informe uma página maior ou os minutos lidos.', l.pagina_atual;
  end if;

  select * into c from public.leit_config where user_id = v_uid;
  if not found then
    c.meta_paginas := 10;
    c.meta_minutos := 10;
  end if;

  select * into v_antes from public.leit__ofensiva(v_uid);
  v_dia_antes := coalesce((select cumprido from public.leit_dias where user_id = v_uid and dia = v_dia), false);

  v_pag_antes := l.pagina_atual;
  v_pag_nova := greatest(l.pagina_atual, coalesce(p_pagina_fim, l.pagina_atual));
  v_paginas := v_pag_nova - v_pag_antes;

  insert into public.leit_sessoes (id, user_id, livro_id, dia, pagina_inicio, pagina_fim, paginas, minutos, foco, aprendizado)
  values (p_id, v_uid, l.id, v_dia, v_pag_antes, p_pagina_fim, v_paginas, nullif(p_minutos, 0), p_foco,
          left(nullif(btrim(p_aprendizado), ''), 500));

  update public.leit_livros
  set pagina_atual = v_pag_nova,
      estado = case when v_pag_nova >= total_paginas then 'concluido' else 'lendo' end,
      concluido_em = case when v_pag_nova >= total_paginas then v_dia else null end
  where id = l.id;
  v_concluiu := v_pag_nova >= l.total_paginas;

  if nullif(btrim(p_trecho_citacao), '') is not null then
    insert into public.leit_trechos (user_id, livro_id, pagina, citacao)
    values (v_uid, l.id, p_trecho_pagina, left(btrim(p_trecho_citacao), 500));
  end if;

  insert into public.leit_dias (user_id, dia, paginas, minutos)
  values (v_uid, v_dia, v_paginas, coalesce(nullif(p_minutos, 0), 0))
  on conflict (user_id, dia) do update
    set paginas = public.leit_dias.paginas + excluded.paginas,
        minutos = public.leit_dias.minutos + excluded.minutos;
  update public.leit_dias
  set cumprido = cumprido
      or (c.meta_paginas is not null and paginas >= c.meta_paginas)
      or (c.meta_minutos is not null and minutos >= c.meta_minutos)
  where user_id = v_uid and dia = v_dia;
  v_dia_agora := (select cumprido from public.leit_dias where user_id = v_uid and dia = v_dia);

  select * into v_depois from public.leit__ofensiva(v_uid);

  -- Selos: ofensiva (só quando o dia acaba de ser confirmado) e páginas no total.
  if v_dia_agora and not v_dia_antes then
    with novos as (
      insert into public.leit_conquistas (user_id, tipo, marco, conquistado_em)
      select v_uid, 'ofensiva', m, v_hoje from unnest(v_marcos) m where m <= v_depois.atual
      on conflict do nothing returning marco
    ) select max(marco) into v_selo from novos;
  end if;
  with novos as (
    insert into public.leit_conquistas (user_id, tipo, marco, conquistado_em)
    select v_uid, 'paginas', m, v_hoje from unnest(public.leit_marcos('paginas')) m
    where m <= (select coalesce(sum(paginas), 0) from public.leit_sessoes where user_id = v_uid)
    on conflict do nothing returning marco
  ) select max(marco) into v_selo_pag from novos;

  -- Capítulos (ou partes de 10%) concluídos nesta sessão, e o capítulo atual.
  if exists (select 1 from public.leit_capitulos where livro_id = l.id) then
    with caps as (
      select id, nome, pagina_inicial,
             coalesce(lead(pagina_inicial) over (order by pagina_inicial, ordem) - 1, l.total_paginas) as fim
      from public.leit_capitulos where livro_id = l.id
    )
    select coalesce(jsonb_agg(jsonb_build_object('capitulo_id', id, 'rotulo', nome) order by pagina_inicial), '[]'::jsonb)
    into v_caps from caps where fim > v_pag_antes and fim <= v_pag_nova;
    select nome into v_cap_atual from public.leit_capitulos
    where livro_id = l.id and pagina_inicial <= greatest(v_pag_nova, 1)
    order by pagina_inicial desc, ordem desc limit 1;
  else
    select coalesce(jsonb_agg(jsonb_build_object('parte', k, 'rotulo', 'Parte ' || k || ' de 10') order by k), '[]'::jsonb)
    into v_caps
    from generate_series(1, 10) k
    where ceil(l.total_paginas * k / 10.0) > v_pag_antes and ceil(l.total_paginas * k / 10.0) <= v_pag_nova;
    v_cap_atual := 'Parte ' || least(10, floor(v_pag_nova * 10.0 / l.total_paginas)::integer + 1) || ' de 10';
  end if;

  select coalesce(max(m), 0) into v_ant from unnest(v_marcos) m where m <= v_antes.atual;
  select min(m) into v_prox from unnest(v_marcos) m where m > v_antes.atual;

  return jsonb_build_object(
    'novo', true,
    'retroativo', v_dia < v_hoje,
    'dia_confirmado', v_dia_agora and not v_dia_antes,
    'antes', v_antes.atual,
    'depois', v_depois.atual,
    'meta_anterior', v_ant,
    'proxima_meta', coalesce(v_prox, v_antes.atual + 365),
    'eh_marco', v_dia_agora and not v_dia_antes and v_depois.atual = any (v_marcos),
    'selo_novo', v_selo,
    'selo_paginas', v_selo_pag,
    'livro', jsonb_build_object(
      'id', l.id, 'titulo', l.titulo, 'pagina_antes', v_pag_antes, 'pagina_atual', v_pag_nova,
      'total', l.total_paginas, 'concluido_agora', v_concluiu, 'capitulo_atual', v_cap_atual,
      'iniciado_em', coalesce(l.iniciado_em, v_dia)),
    'capitulos_concluidos', coalesce(v_caps, '[]'::jsonb),
    'estado', public.leit__estado(v_uid)
  );
end
$$;

-- ---------- proteção de um dia (transparente: o dia fica marcado e não conta no total) ----------

create function public.leit_congelar_ontem()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := public.hub_uid_autorizado();
  v_est  jsonb := public.leit__estado(public.hub_uid_autorizado());
  v_hoje date := public.hub_hoje();
begin
  if not (v_est ->> 'pode_congelar')::boolean then
    raise exception 'TV: A proteção não está disponível agora.';
  end if;
  insert into public.leit_dias (user_id, dia, congelado) values (v_uid, v_hoje - 1, true)
  on conflict (user_id, dia) do update set congelado = true;
  insert into public.leit_config (user_id, congelamento_usado_em) values (v_uid, v_hoje)
  on conflict (user_id) do update set congelamento_usado_em = v_hoje;
  return public.leit__estado(v_uid);
end
$$;

-- ---------- permissões das funções ----------

revoke all on function public.leit__datas_livro() from public, anon, authenticated;
revoke all on function public.leit__ofensiva(uuid) from public, anon, authenticated;
revoke all on function public.leit__estado(uuid) from public, anon, authenticated;
revoke all on function public.leit_estado() from public, anon;
revoke all on function public.leit_registrar_sessao(uuid, uuid, date, integer, integer, smallint, text, integer, text) from public, anon;
revoke all on function public.leit_congelar_ontem() from public, anon;
revoke all on function public.leit_marcos(text) from public, anon;

grant execute on function public.leit_estado() to authenticated;
grant execute on function public.leit_registrar_sessao(uuid, uuid, date, integer, integer, smallint, text, integer, text) to authenticated;
grant execute on function public.leit_congelar_ontem() to authenticated;
grant execute on function public.leit_marcos(text) to authenticated;
