-- Rotina da casa: uma tarefa semanal pode repetir em vários dias da semana (ex.: lixo na terça, quinta e sábado).
-- Seguro rodar mais de uma vez.

alter table public.casa_tarefas add column if not exists dias smallint[];
alter table public.casa_tarefas drop constraint if exists casa_tarefas_dias_check;
alter table public.casa_tarefas add constraint casa_tarefas_dias_check
  check (dias is null or (cardinality(dias) between 1 and 7 and dias <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]));

-- Tarefas semanais que já existiam levam o dia que tinham.
update public.casa_tarefas set dias = array[dia]::smallint[] where freq = 'semanal' and dias is null and dia is not null;

grant insert (dias), update (dias) on public.casa_tarefas to authenticated;

-- Junta tarefas semanais repetidas com o mesmo nome (ex.: "Tirar o lixo" criada uma vez por dia):
-- fica a mais antiga, com a soma dos dias e do histórico de marcações.
do $$
declare g record; v_dias smallint[];
begin
  for g in
    select user_id, (array_agg(id order by criado_em, id))[1] as mantem, array_agg(id order by criado_em, id) as ids
    from public.casa_tarefas
    where freq = 'semanal'
    group by user_id, lower(btrim(nome))
    having count(*) > 1
  loop
    select array_agg(distinct d order by d)::smallint[] into v_dias
    from public.casa_tarefas t, unnest(coalesce(t.dias, array[t.dia]::smallint[])) d
    where t.id = any (g.ids) and d is not null;
    insert into public.casa_feitas (user_id, tarefa_id, dia)
      select f.user_id, g.mantem, f.dia from public.casa_feitas f where f.tarefa_id = any (g.ids) and f.tarefa_id <> g.mantem
      on conflict do nothing;
    update public.casa_tarefas set dias = v_dias, dia = v_dias[1] where id = g.mantem;
    delete from public.casa_tarefas where id = any (g.ids) and id <> g.mantem;
  end loop;
end
$$;
