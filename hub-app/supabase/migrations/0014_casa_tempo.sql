-- Rotina da casa: tempo que cada tarefa leva (o timer usa esse tempo) e tarefas do mês
-- colocadas na rotina de hoje. Seguro rodar mais de uma vez.

alter table public.casa_tarefas add column if not exists minutos smallint;
alter table public.casa_tarefas drop constraint if exists casa_tarefas_minutos_check;
alter table public.casa_tarefas add constraint casa_tarefas_minutos_check check (minutos is null or minutos between 1 and 480);
grant insert (minutos), update (minutos) on public.casa_tarefas to authenticated;

-- Tarefas do mês que você colocou na rotina de um dia específico.
create table if not exists public.casa_extras (
  user_id    uuid not null default auth.uid(),
  tarefa_id  uuid not null,
  dia        date not null default public.hub_hoje(),
  primary key (user_id, tarefa_id, dia),
  foreign key (tarefa_id, user_id) references public.casa_tarefas (id, user_id) on delete cascade
);
alter table public.casa_extras enable row level security;
revoke all on public.casa_extras from public, anon, authenticated;
grant select on public.casa_extras to authenticated;
grant insert (tarefa_id, dia), delete on public.casa_extras to authenticated;
drop policy if exists casa_extras_ler on public.casa_extras;
drop policy if exists casa_extras_criar on public.casa_extras;
drop policy if exists casa_extras_apagar on public.casa_extras;
create policy casa_extras_ler on public.casa_extras for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy casa_extras_criar on public.casa_extras for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.hub_autorizado()));
create policy casa_extras_apagar on public.casa_extras for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));

-- Tempos que você passou (só preenche onde ainda está em branco).
update public.casa_tarefas set minutos = 5  where minutos is null and nome ilike 'arrumar a cama%';
update public.casa_tarefas set minutos = 10 where minutos is null and (nome ilike 'guardar%roupa%' or nome ilike 'recolher roupas%');
update public.casa_tarefas set minutos = 10 where minutos is null and nome ilike 'arrumar as mesas%';
update public.casa_tarefas set minutos = 10 where minutos is null and nome ilike 'organizar a lou%';
update public.casa_tarefas set minutos = 20 where minutos is null and nome ilike 'lavar lou%';
update public.casa_tarefas set minutos = 45 where minutos is null and nome ilike 'limpar geladeira%';
