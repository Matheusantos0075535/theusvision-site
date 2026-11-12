-- Treino: semente idempotente, privacidade, sessão no futuro recusada, séries só em sessão própria, agenda só com ficha própria.

begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare v_ficha uuid; v_sessao uuid := gen_random_uuid(); n int;
begin
  perform public.treino_iniciar();
  perform public.treino_iniciar();
  assert (select count(*) from public.treino_fichas) = 5, 'FALHA: deveriam existir 5 fichas';
  assert (select count(*) from public.treino_ficha_itens) = 30, 'FALHA: itens das fichas';
  assert (select count(*) from public.treino_perfil) = 1, 'FALHA: perfil';
  update public.treino_perfil set peso_kg = 80, altura_cm = 183;

  select id into v_ficha from public.treino_fichas where nome = 'Costas';
  insert into public.treino_sessoes (id, ficha_id, nome) values (v_sessao, v_ficha, 'Costas');
  insert into public.treino_series (id, sessao_id, exercicio, ordem, serie, carga_kg, reps)
    values (gen_random_uuid(), v_sessao, 'puxada-frente', 1, 1, 60, 10);
  begin
    insert into public.treino_sessoes (id, nome, dia) values (gen_random_uuid(), 'Futuro', public.hub_hoje() + 1);
    raise exception 'FALHA: aceitou treino no futuro';
  exception when sqlstate '22023' then null; end;
  insert into public.treino_agenda (dia, ficha_id) values (public.hub_hoje() + 2, v_ficha);
  insert into public.treino_agenda (dia, ficha_id) values (public.hub_hoje() + 3, null);
  begin
    update public.treino_perfil set dias_semana = 9;
    raise exception 'FALHA: aceitou perfil inválido';
  exception when check_violation then null; end;
end
$$;
commit;

begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$
declare v_ficha_ana uuid; v_sessao_ana uuid;
begin
  assert (select count(*) from public.treino_fichas) = 0, 'FALHA: Bruno viu fichas da Ana';
  assert (select count(*) from public.treino_sessoes) = 0 and (select count(*) from public.treino_series) = 0,
    'FALHA: Bruno viu treinos da Ana';
  reset role;
  select id into v_ficha_ana from public.treino_fichas where user_id = '11111111-1111-1111-1111-111111111111' limit 1;
  select id into v_sessao_ana from public.treino_sessoes where user_id = '11111111-1111-1111-1111-111111111111' limit 1;
  perform public.teste_logar('22222222-2222-2222-2222-222222222222');
  perform public.treino_iniciar();
  begin
    insert into public.treino_agenda (dia, ficha_id) values (public.hub_hoje(), v_ficha_ana);
    raise exception 'FALHA: Bruno agendou ficha da Ana';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.treino_sessoes (id, ficha_id, nome) values (gen_random_uuid(), v_ficha_ana, 'x');
    raise exception 'FALHA: Bruno usou ficha da Ana';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.treino_series (id, sessao_id, exercicio, serie) values (gen_random_uuid(), v_sessao_ana, 'x', 1);
    raise exception 'FALHA: Bruno anotou série na sessão da Ana';
  exception when foreign_key_violation then null; end;
end
$$;
commit;

begin;
select public.teste_logar('33333333-3333-3333-3333-333333333333');
do $$
begin
  begin
    perform public.treino_iniciar();
    raise exception 'FALHA: usuário de fora abriu o treino';
  exception when insufficient_privilege then null; end;
end
$$;
commit;
