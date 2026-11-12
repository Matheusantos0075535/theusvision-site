-- Treino: perfil, fichas editáveis (rotação), sessões com séries (carga e repetições), agenda do calendário.
-- Módulo PESSOAL. RLS por user_id = auth.uid() + hub_autorizado() em todas as tabelas.
-- Os exercícios vêm de um catálogo no front-end (src/modulos/treino/catalogo.ts); aqui só o identificador.

-- ---------- tabelas ----------

create table public.treino_perfil (
  user_id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  peso_kg          numeric(5, 1) check (peso_kg between 30 and 300),
  altura_cm        smallint check (altura_cm between 120 and 230),
  dias_semana      smallint not null default 5 check (dias_semana between 1 and 7),
  folgas           smallint[] not null default '{0,1}' check (folgas <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  descanso_seg     smallint not null default 90 check (descanso_seg between 15 and 600),
  duracao_max_min  smallint not null default 90 check (duracao_max_min between 15 and 240),
  atualizado_em    timestamptz not null default now()
);

create table public.treino_fichas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome       text not null check (char_length(btrim(nome)) between 1 and 60),
  foco       text check (char_length(foco) <= 160),
  ordem      smallint not null default 0,
  ativa      boolean not null default true,
  criado_em  timestamptz not null default now(),
  unique (id, user_id)
);

create table public.treino_ficha_itens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid(),
  ficha_id      uuid not null,
  ordem         smallint not null default 0,
  exercicio     text not null check (char_length(exercicio) between 1 and 60),
  series        smallint not null default 3 check (series between 1 and 10),
  reps_min      smallint not null default 8 check (reps_min between 1 and 100),
  reps_max      smallint not null default 12 check (reps_max between 1 and 100),
  descanso_seg  smallint check (descanso_seg between 15 and 600),
  nota          text check (char_length(nota) <= 200),
  check (reps_max >= reps_min),
  foreign key (ficha_id, user_id) references public.treino_fichas (id, user_id) on delete cascade
);
create index treino_ficha_itens_ficha on public.treino_ficha_itens (ficha_id, ordem);

create table public.treino_sessoes (
  id            uuid primary key,  -- gerado no aparelho: chave de idempotência
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia           date not null default public.hub_hoje(),
  ficha_id      uuid references public.treino_fichas (id) on delete set null,
  nome          text not null check (char_length(btrim(nome)) between 1 and 60),
  iniciado_em   timestamptz not null default now(),
  concluido_em  timestamptz,
  sem_registro  boolean not null default false,  -- "treinei" sem anotar as séries
  notas         text check (char_length(notas) <= 500),
  unique (id, user_id)
);
create index treino_sessoes_usuario_dia on public.treino_sessoes (user_id, dia);

create table public.treino_series (
  id         uuid primary key,  -- gerado no aparelho
  user_id    uuid not null default auth.uid(),
  sessao_id  uuid not null,
  exercicio  text not null check (char_length(exercicio) between 1 and 60),
  ordem      smallint not null default 0,
  serie      smallint not null check (serie between 1 and 20),
  carga_kg   numeric(6, 2) check (carga_kg between 0 and 1000),
  reps       smallint check (reps between 0 and 200),
  feita      boolean not null default true,
  criado_em  timestamptz not null default now(),
  foreign key (sessao_id, user_id) references public.treino_sessoes (id, user_id) on delete cascade
);
create index treino_series_usuario_exercicio on public.treino_series (user_id, exercicio, criado_em);

-- Planejamento manual do calendário: ficha escolhida ou descanso (ficha_id nulo).
create table public.treino_agenda (
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia       date not null,
  ficha_id  uuid references public.treino_fichas (id) on delete cascade,
  primary key (user_id, dia)
);

-- Treino não pode ser registrado no futuro.
create function public.treino__sem_futuro()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.dia > public.hub_hoje() then
    raise exception 'TV: Não dá para registrar treino em dia que ainda não chegou.' using errcode = '22023';
  end if;
  return new;
end
$$;
create trigger treino_sessoes_sem_futuro before insert or update of dia on public.treino_sessoes
  for each row execute function public.treino__sem_futuro();

-- ---------- RLS ----------

alter table public.treino_perfil enable row level security;
alter table public.treino_fichas enable row level security;
alter table public.treino_ficha_itens enable row level security;
alter table public.treino_sessoes enable row level security;
alter table public.treino_series enable row level security;
alter table public.treino_agenda enable row level security;

revoke all on public.treino_perfil, public.treino_fichas, public.treino_ficha_itens, public.treino_sessoes,
  public.treino_series, public.treino_agenda from public, anon, authenticated;
grant select on public.treino_perfil, public.treino_fichas, public.treino_ficha_itens, public.treino_sessoes,
  public.treino_series, public.treino_agenda to authenticated;

grant insert (peso_kg, altura_cm, dias_semana, folgas, descanso_seg, duracao_max_min),
      update (peso_kg, altura_cm, dias_semana, folgas, descanso_seg, duracao_max_min, atualizado_em) on public.treino_perfil to authenticated;
grant insert (nome, foco, ordem, ativa), update (nome, foco, ordem, ativa), delete on public.treino_fichas to authenticated;
grant insert (ficha_id, ordem, exercicio, series, reps_min, reps_max, descanso_seg, nota),
      update (ordem, exercicio, series, reps_min, reps_max, descanso_seg, nota), delete on public.treino_ficha_itens to authenticated;
grant insert (id, dia, ficha_id, nome, iniciado_em, concluido_em, sem_registro, notas),
      update (ficha_id, nome, concluido_em, notas), delete on public.treino_sessoes to authenticated;
grant insert (id, sessao_id, exercicio, ordem, serie, carga_kg, reps, feita),
      update (exercicio, ordem, carga_kg, reps, feita), delete on public.treino_series to authenticated;
grant insert (dia, ficha_id), update (ficha_id), delete on public.treino_agenda to authenticated;

do $$
declare t text;
begin
  foreach t in array array['treino_perfil', 'treino_fichas', 'treino_ficha_itens', 'treino_series'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_ler', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_criar', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))
         with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_alterar', t);
  end loop;
  foreach t in array array['treino_fichas', 'treino_ficha_itens', 'treino_series'] loop
    execute format(
      'create policy %I on public.%I for delete to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_apagar', t);
  end loop;
  -- Sessões e agenda: a ficha apontada também precisa ser sua.
  foreach t in array array['treino_sessoes', 'treino_agenda'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_ler', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (user_id = (select auth.uid()) and (select public.hub_autorizado())
           and (ficha_id is null or exists (select 1 from public.treino_fichas f where f.id = ficha_id and f.user_id = (select auth.uid()))))',
      t || '_criar', t);
    execute format(
      'create policy %I on public.%I for update to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))
         with check (user_id = (select auth.uid()) and (select public.hub_autorizado())
           and (ficha_id is null or exists (select 1 from public.treino_fichas f where f.id = ficha_id and f.user_id = (select auth.uid()))))',
      t || '_alterar', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_apagar', t);
  end loop;
end
$$;

-- ---------- abertura do módulo: cria perfil e as 5 fichas padrão (uma vez) ----------
-- Divisão de 5 dias para hipertrofia, na ordem da rotação: Braços, Pernas, Costas, Peito, Ombros e abdômen.

create function public.treino__item(p_uid uuid, p_ficha uuid, p_ordem int, p_ex text, p_series int, p_min int, p_max int)
returns void language sql set search_path = '' as $$
  insert into public.treino_ficha_itens (user_id, ficha_id, ordem, exercicio, series, reps_min, reps_max)
  values (p_uid, p_ficha, p_ordem, p_ex, p_series, p_min, p_max);
$$;

create function public.treino_iniciar()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.hub_uid_autorizado();
  v_hoje date := public.hub_hoje();
  f uuid;
begin
  insert into public.treino_perfil (user_id) values (v_uid) on conflict (user_id) do nothing;

  if not exists (select 1 from public.treino_fichas where user_id = v_uid) then
    insert into public.treino_fichas (user_id, nome, foco, ordem)
      values (v_uid, 'Braços', 'Bíceps e tríceps', 1) returning id into f;
    perform public.treino__item(v_uid, f, 1, 'rosca-w', 4, 8, 12);
    perform public.treino__item(v_uid, f, 2, 'rosca-inclinada', 3, 10, 12);
    perform public.treino__item(v_uid, f, 3, 'rosca-martelo', 3, 10, 12);
    perform public.treino__item(v_uid, f, 4, 'triceps-corda', 4, 10, 12);
    perform public.treino__item(v_uid, f, 5, 'triceps-frances-polia', 3, 10, 12);
    perform public.treino__item(v_uid, f, 6, 'triceps-maquina', 3, 10, 12);

    insert into public.treino_fichas (user_id, nome, foco, ordem)
      values (v_uid, 'Pernas', 'Quadríceps, posteriores, glúteos e panturrilha', 2) returning id into f;
    perform public.treino__item(v_uid, f, 1, 'hack', 4, 8, 10);
    perform public.treino__item(v_uid, f, 2, 'leg-press', 4, 10, 12);
    perform public.treino__item(v_uid, f, 3, 'extensora', 3, 12, 15);
    perform public.treino__item(v_uid, f, 4, 'flexora-deitada', 4, 10, 12);
    perform public.treino__item(v_uid, f, 5, 'stiff', 3, 8, 12);
    perform public.treino__item(v_uid, f, 6, 'panturrilha-pe', 4, 12, 15);

    insert into public.treino_fichas (user_id, nome, foco, ordem)
      values (v_uid, 'Costas', 'Largura, espessura, parte alta e lombar', 3) returning id into f;
    perform public.treino__item(v_uid, f, 1, 'puxada-frente', 4, 8, 12);
    perform public.treino__item(v_uid, f, 2, 'remada-curvada', 4, 8, 10);
    perform public.treino__item(v_uid, f, 3, 'remada-maquina', 3, 10, 12);
    perform public.treino__item(v_uid, f, 4, 'pullover-polia', 3, 12, 15);
    perform public.treino__item(v_uid, f, 5, 'crucifixo-inverso-maquina', 3, 12, 15);
    perform public.treino__item(v_uid, f, 6, 'hiperextensao', 3, 12, 15);

    insert into public.treino_fichas (user_id, nome, foco, ordem)
      values (v_uid, 'Peito', 'Peitoral inteiro: parte alta, média e baixa', 4) returning id into f;
    perform public.treino__item(v_uid, f, 1, 'supino-reto', 4, 6, 10);
    perform public.treino__item(v_uid, f, 2, 'supino-inclinado-halter', 4, 8, 12);
    perform public.treino__item(v_uid, f, 3, 'supino-maquina', 3, 10, 12);
    perform public.treino__item(v_uid, f, 4, 'voador', 3, 12, 15);
    perform public.treino__item(v_uid, f, 5, 'crossover', 3, 12, 15);

    insert into public.treino_fichas (user_id, nome, foco, ordem)
      values (v_uid, 'Ombros e abdômen', 'Deltoides, trapézio e abdômen', 5) returning id into f;
    perform public.treino__item(v_uid, f, 1, 'desenvolvimento-maquina', 4, 8, 12);
    perform public.treino__item(v_uid, f, 2, 'elevacao-lateral', 4, 12, 15);
    perform public.treino__item(v_uid, f, 3, 'elevacao-lateral-polia', 3, 12, 15);
    perform public.treino__item(v_uid, f, 4, 'face-pull', 3, 12, 15);
    perform public.treino__item(v_uid, f, 5, 'encolhimento', 3, 10, 12);
    perform public.treino__item(v_uid, f, 6, 'abdominal-polia', 3, 12, 15);
    perform public.treino__item(v_uid, f, 7, 'elevacao-pernas', 3, 10, 15);
  end if;

  return jsonb_build_object('hoje', v_hoje, 'dow', extract(dow from v_hoje)::int);
end
$$;

revoke all on function public.treino_iniciar() from public, anon;
revoke all on function public.treino__item(uuid, uuid, int, text, int, int, int) from public, anon, authenticated;
revoke all on function public.treino__sem_futuro() from public, anon, authenticated;
grant execute on function public.treino_iniciar() to authenticated;
