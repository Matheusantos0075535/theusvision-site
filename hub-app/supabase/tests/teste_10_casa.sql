-- Rotina da casa: abertura uma vez só, privacidade entre usuários e regras de data.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare v_t uuid; v_r jsonb;
begin
  v_r := public.casa_iniciar(true);
  assert (v_r ->> 'novo') = 'true', 'FALHA: primeira abertura deveria ser nova';
  assert (select count(*) from public.casa_tarefas) = 8, 'FALHA: rotina padrão';
  v_r := public.casa_iniciar(true);
  assert (v_r ->> 'novo') = 'false', 'FALHA: segunda abertura não deve ser nova';
  assert (select count(*) from public.casa_tarefas) = 8, 'FALHA: duplicou a rotina';
  select id into v_t from public.casa_tarefas where nome = 'Louça do dia';
  insert into public.casa_feitas (tarefa_id) values (v_t);
  insert into public.casa_missoes (dia) values (public.hub_hoje());
  begin
    insert into public.casa_feitas (tarefa_id, dia) values (v_t, public.hub_hoje() + 1);
    raise exception 'FALHA: aceitou dia futuro';
  exception when sqlstate '22023' then null; end;
  insert into public.casa_compras (nome) values ('Detergente');
  update public.casa_compras set comprado = true where nome = 'Detergente';
  update public.casa_tarefas set nome = 'Lavar a louça', freq = 'diaria' where id = v_t;
  begin
    update public.casa_tarefas set user_id = '22222222-2222-2222-2222-222222222222' where id = v_t;
    raise exception 'FALHA: deixou trocar o dono';
  exception when insufficient_privilege then null; end;
end $$;

select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$
declare v_t uuid;
begin
  assert (select count(*) from public.casa_tarefas) = 0, 'FALHA: vê a rotina de outro usuário';
  assert (select count(*) from public.casa_compras) = 0, 'FALHA: vê compras de outro usuário';
  select id into v_t from (select id from public.casa_tarefas union all select '00000000-0000-0000-0000-000000000000'::uuid) x limit 1;
  begin
    insert into public.casa_feitas (user_id, tarefa_id) values ('11111111-1111-1111-1111-111111111111', (select id from public.casa_tarefas limit 1));
    raise exception 'FALHA: gravou no nome de outro';
  exception when insufficient_privilege or not_null_violation or foreign_key_violation then null; end;
end $$;
rollback;
