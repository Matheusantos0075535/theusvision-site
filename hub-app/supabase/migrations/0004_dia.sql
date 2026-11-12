-- Meu dia: rotina da manhã e da noite (editável), essenciais do dia, 3 prioridades, despejo mental e encerramento do dia.
-- Módulo PESSOAL. RLS por user_id = auth.uid() + hub_autorizado() em todas as tabelas, sem exceção.
-- O "dia" é sempre o de Brasília (hub_hoje()); só dá para marcar hoje e ontem.

-- ---------- tabelas ----------

create table public.dia_itens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bloco      text not null check (bloco in ('manha', 'noite', 'essencial')),
  quando     text not null default 'todos' check (quando in ('todos', 'semana', 'fim_de_semana')),
  titulo     text not null check (char_length(btrim(titulo)) between 1 and 120),
  detalhe    text check (char_length(detalhe) <= 240),
  ordem      smallint not null default 0,
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now(),
  unique (id, user_id)
);
create index dia_itens_usuario on public.dia_itens (user_id, bloco, ordem);

create table public.dia_feitos (
  user_id  uuid not null default auth.uid(),
  dia      date not null default public.hub_hoje(),
  item_id  uuid not null,
  primary key (user_id, dia, item_id),
  foreign key (item_id, user_id) references public.dia_itens (id, user_id) on delete cascade
);

create table public.dia_prioridades (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia           date not null default public.hub_hoje(),
  ordem         smallint not null check (ordem between 1 and 3),
  titulo        text not null check (char_length(btrim(titulo)) between 1 and 160),
  primeira_acao text check (char_length(primeira_acao) <= 200),
  feita         boolean not null default false,
  unique (user_id, dia, ordem)
);

create table public.dia_despejo (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texto         text not null check (char_length(btrim(texto)) between 1 and 500),
  categoria     text check (categoria in ('pessoal', 'trabalho', 'saude', 'financas', 'casa')),
  proxima_acao  text check (char_length(proxima_acao) <= 200),
  prioridade    text check (prioridade in ('alta', 'media', 'baixa')),
  origem        text not null default 'manual' check (origem in ('manual', 'noite')),
  resolvido     boolean not null default false,
  criado_em     timestamptz not null default now()
);
create index dia_despejo_usuario on public.dia_despejo (user_id, resolvido, criado_em desc);

create table public.dia_encerramentos (
  user_id               uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia                   date not null default public.hub_hoje(),
  primeira_acao_amanha  text check (char_length(primeira_acao_amanha) <= 200),
  criado_em             timestamptz not null default now(),
  primary key (user_id, dia)
);

-- Só hoje e ontem (quem esqueceu de marcar ainda pode; o passado distante não se reescreve).
create function public.dia__limite_dia()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.dia > public.hub_hoje() or new.dia < public.hub_hoje() - 1 then
    raise exception 'TV: Só dá para registrar hoje ou ontem.' using errcode = '22023';
  end if;
  return new;
end
$$;
create trigger dia_feitos_limite before insert on public.dia_feitos for each row execute function public.dia__limite_dia();
create trigger dia_prioridades_limite before insert on public.dia_prioridades for each row execute function public.dia__limite_dia();
create trigger dia_encerramentos_limite before insert on public.dia_encerramentos for each row execute function public.dia__limite_dia();

-- ---------- RLS ----------

alter table public.dia_itens enable row level security;
alter table public.dia_feitos enable row level security;
alter table public.dia_prioridades enable row level security;
alter table public.dia_despejo enable row level security;
alter table public.dia_encerramentos enable row level security;

revoke all on public.dia_itens, public.dia_feitos, public.dia_prioridades, public.dia_despejo, public.dia_encerramentos
  from public, anon, authenticated;
grant select on public.dia_itens, public.dia_feitos, public.dia_prioridades, public.dia_despejo, public.dia_encerramentos
  to authenticated;
grant insert (bloco, quando, titulo, detalhe, ordem, ativo), update (bloco, quando, titulo, detalhe, ordem, ativo), delete
  on public.dia_itens to authenticated;
grant insert (item_id, dia), delete on public.dia_feitos to authenticated;
grant insert (dia, ordem, titulo, primeira_acao), update (titulo, primeira_acao, feita), delete on public.dia_prioridades to authenticated;
grant insert (texto, categoria, proxima_acao, prioridade, origem), update (texto, categoria, proxima_acao, prioridade, resolvido), delete
  on public.dia_despejo to authenticated;
grant insert (dia, primeira_acao_amanha), update (primeira_acao_amanha) on public.dia_encerramentos to authenticated;

do $$
declare t text;
begin
  foreach t in array array['dia_itens', 'dia_feitos', 'dia_prioridades', 'dia_despejo', 'dia_encerramentos'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_ler', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_criar', t);
  end loop;
  foreach t in array array['dia_itens', 'dia_prioridades', 'dia_despejo', 'dia_encerramentos'] loop
    execute format(
      'create policy %I on public.%I for update to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))
         with check (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_alterar', t);
  end loop;
  foreach t in array array['dia_itens', 'dia_feitos', 'dia_prioridades', 'dia_despejo'] loop
    execute format(
      'create policy %I on public.%I for delete to authenticated
         using (user_id = (select auth.uid()) and (select public.hub_autorizado()))', t || '_apagar', t);
  end loop;
end
$$;

-- ---------- abertura do módulo: semeia a rotina padrão (uma vez) e devolve o dia ----------

create function public.dia_iniciar()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.hub_uid_autorizado();
  v_hoje date := public.hub_hoje();
begin
  if not exists (select 1 from public.dia_itens where user_id = v_uid) then
    insert into public.dia_itens (user_id, bloco, quando, titulo, detalhe, ordem) values
      -- manhã, dias úteis
      (v_uid, 'manha', 'semana', 'Acordar e hidratar', '500 ml de água e luz natural nos primeiros 15 minutos.', 1),
      (v_uid, 'manha', 'semana', 'Treino e higiene mental', 'Exercício programado, sem gastar decisão. Tomar a medicação.', 2),
      (v_uid, 'manha', 'semana', 'Revisão do dia', 'Olhar as 3 prioridades antes de abrir e-mails e mensagens.', 3),
      -- manhã, fim de semana
      (v_uid, 'manha', 'fim_de_semana', 'Despertar sem pressa', 'Acordar sem alarme de trabalho. Água logo ao levantar.', 1),
      (v_uid, 'manha', 'fim_de_semana', 'Tomar a medicação', null, 2),
      (v_uid, 'manha', 'fim_de_semana', 'Café em família', 'Presença, sem celular na mesa.', 3),
      (v_uid, 'manha', 'fim_de_semana', 'Atividade ao ar livre', 'Caminhada, parque ou treino leve.', 4),
      -- noite, dias úteis
      (v_uid, 'noite', 'semana', 'Esvaziar a mente', 'Anotar no Despejo mental qualquer pendência solta.', 1),
      (v_uid, 'noite', 'semana', 'Desconectar das telas', 'Desligar o trabalho e baixar as luzes 1 hora antes de deitar.', 2),
      (v_uid, 'noite', 'semana', 'Preparar o dia seguinte', 'Roupa de treino separada e ambiente de trabalho organizado.', 3),
      -- noite, fim de semana
      (v_uid, 'noite', 'fim_de_semana', 'Esvaziar a mente', 'Anotar no Despejo mental o que ficou solto.', 1),
      (v_uid, 'noite', 'fim_de_semana', 'Desconectar das telas', 'Lazer, leitura e descanso. Sem trabalho.', 2),
      -- essenciais do dia
      (v_uid, 'essencial', 'semana', 'Treinar e tomar a medicação da manhã', null, 1),
      (v_uid, 'essencial', 'semana', 'Bloco de foco nas 3 prioridades', 'Protegido de distrações, com fim claro.', 2),
      (v_uid, 'essencial', 'todos', 'Beber pelo menos 2 litros de água', null, 3),
      (v_uid, 'essencial', 'todos', 'Rotina da noite: desconectar e esvaziar a mente', null, 4),
      (v_uid, 'essencial', 'fim_de_semana', 'Mexer o corpo e ficar presente com a família', null, 1);
  end if;
  return jsonb_build_object(
    'hoje', v_hoje,
    'dow', extract(dow from v_hoje)::int,
    'encerrado', exists (select 1 from public.dia_encerramentos where user_id = v_uid and dia = v_hoje)
  );
end
$$;

revoke all on function public.dia_iniciar() from public, anon;
revoke all on function public.dia__limite_dia() from public, anon, authenticated;
grant execute on function public.dia_iniciar() to authenticated;
