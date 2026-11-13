-- A fazer (antigo Meu dia): mais de 3 prioridades por dia e "levar para hoje" o que ficou para trás.
-- Seguro rodar mais de uma vez.

alter table public.dia_prioridades drop constraint if exists dia_prioridades_ordem_check;
alter table public.dia_prioridades add constraint dia_prioridades_ordem_check check (ordem between 1 and 20);
alter table public.dia_prioridades add column if not exists levada boolean not null default false;
grant update (levada) on public.dia_prioridades to authenticated;
