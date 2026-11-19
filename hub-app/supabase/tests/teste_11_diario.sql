-- Diário: privacidade, dia futuro, limites e anexos.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare v_e uuid := gen_random_uuid(); v_ant uuid;
begin
  insert into public.diario_entradas (id, titulo, texto, humor, etiquetas, tarefas)
    values (v_e, 'Dia pesado', 'Tudo que passou pela minha cabeça', 2, array['trabalho', 'cansaço'], '[{"id":"a","texto":"ligar","feita":false,"levada":false}]');
  insert into public.diario_entradas (dia, texto) values (public.hub_hoje() - 3, 'dia passado pode');
  update public.diario_entradas set texto = 'editado', favorita = true, atualizado_em = now() where id = v_e;
  begin
    insert into public.diario_entradas (dia, texto) values (public.hub_hoje() + 1, 'futuro');
    raise exception 'FALHA: aceitou dia futuro';
  exception when sqlstate '22023' then null; end;
  begin
    insert into public.diario_entradas (texto, humor) values ('x', 9);
    raise exception 'FALHA: aceitou humor 9';
  exception when check_violation then null; end;
  begin
    insert into public.diario_entradas (texto, tarefas) values ('x', '{"a":1}');
    raise exception 'FALHA: aceitou tarefas que não é lista';
  exception when check_violation then null; end;
  begin
    update public.diario_entradas set user_id = '22222222-2222-2222-2222-222222222222' where id = v_e;
    raise exception 'FALHA: deixou trocar o dono';
  exception when insufficient_privilege then null; end;
  insert into public.diario_anexos (entrada_id, path, nome, tipo, tamanho)
    values (v_e, '11111111-1111-1111-1111-111111111111/' || v_e || '/a.pdf', 'a.pdf', 'application/pdf', 1000) returning id into v_ant;
  begin
    insert into public.diario_anexos (entrada_id, path, nome, tipo) values (v_e, '22222222-2222-2222-2222-222222222222/x.pdf', 'x.pdf', 'application/pdf');
    raise exception 'FALHA: aceitou arquivo na pasta de outro usuário';
  exception when insufficient_privilege or check_violation then null; end;
  begin
    insert into public.diario_anexos (entrada_id, path, nome, tipo) values (v_e, '11111111-1111-1111-1111-111111111111/x.exe', 'x.exe', 'application/x-msdownload');
    raise exception 'FALHA: aceitou tipo de arquivo não permitido';
  exception when check_violation then null; end;
  delete from public.diario_entradas where id = v_e;
  assert (select count(*) from public.diario_anexos where id = v_ant) = 0, 'FALHA: anexo deveria sumir junto com a entrada';
end $$;

select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$
begin
  assert (select count(*) from public.diario_entradas) = 0, 'FALHA: vê o diário de outro usuário';
  assert (select count(*) from public.diario_anexos) = 0, 'FALHA: vê anexos de outro usuário';
  begin
    insert into public.diario_anexos (user_id, entrada_id, path, nome, tipo)
      values ('11111111-1111-1111-1111-111111111111', gen_random_uuid(), '11111111-1111-1111-1111-111111111111/a.pdf', 'a.pdf', 'application/pdf');
    raise exception 'FALHA: gravou anexo no nome de outro';
  exception when insufficient_privilege or foreign_key_violation then null; end;
end $$;
rollback;
