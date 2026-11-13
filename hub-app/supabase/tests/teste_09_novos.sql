-- A fazer (mais prioridades, levar para hoje), Finanças e Creative Studio: privacidade e regras.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare v_cat uuid; v_fixa uuid; v_meta uuid; v_ideia uuid; v_proj uuid; n int;
begin
  -- A fazer
  insert into public.dia_prioridades (ordem, titulo) values (7, 'sétima prioridade');
  update public.dia_prioridades set levada = true where ordem = 7 and dia = public.hub_hoje();
  get diagnostics n = row_count; assert n = 1, 'FALHA: não marcou levada';
  begin
    insert into public.dia_prioridades (ordem, titulo) values (21, 'demais');
    raise exception 'FALHA: aceitou 21 prioridades';
  exception when check_violation then null; end;

  -- Finanças
  perform public.fin_iniciar();
  perform public.fin_iniciar();
  assert (select count(*) from public.fin_categorias) = 7, 'FALHA: categorias padrão';
  assert (select count(*) from public.fin_metas) = 2, 'FALHA: metas padrão';
  select id into v_cat from public.fin_categorias where nome = 'Mercado';
  insert into public.fin_lancamentos (tipo, valor, categoria_id, pagamento, descricao) values ('gasto', 42.5, v_cat, 'pix', 'feira');
  insert into public.fin_lancamentos (tipo, valor, descricao) values ('entrada', 1500, 'cliente');
  begin
    insert into public.fin_lancamentos (tipo, valor, pagamento) values ('gasto', 10, 'boleto');
    raise exception 'FALHA: aceitou forma de pagamento inválida';
  exception when check_violation then null; end;
  begin
    insert into public.fin_lancamentos (tipo, valor, dia) values ('gasto', 10, public.hub_hoje() + 1);
    raise exception 'FALHA: aceitou lançamento no futuro';
  exception when sqlstate '22023' then null; end;
  delete from public.fin_categorias where id = v_cat;
  assert (select categoria_id from public.fin_lancamentos where descricao = 'feira') is null, 'FALHA: categoria apagada deveria ficar nula';
  assert (select user_id from public.fin_lancamentos where descricao = 'feira') = auth.uid(), 'FALHA: dono sumiu ao apagar categoria';
  insert into public.fin_fixas (nome, valor, dia_vencimento, tipo, pagamento, parcelas_total, primeira_parcela)
    values ('Celular', 120, 10, 'parcela', 'credito', 12, '2026-06') returning id into v_fixa;
  insert into public.fin_fixas_pagas (fixa_id, mes) values (v_fixa, '2026-11');
  select id into v_meta from public.fin_metas where nome = 'Investimentos';
  insert into public.fin_aportes (meta_id, valor) values (v_meta, 50);

  -- Creative Studio
  insert into public.ideias (titulo) values ('Ideia com quadro') returning id into v_ideia;
  insert into public.studio_projetos (titulo, ideia_id, quadro) values ('Projeto', v_ideia, '{"itens":[{"id":"a","tipo":"nota"}],"ligacoes":[]}') returning id into v_proj;
  update public.studio_projetos set quadro = '{"itens":[],"ligacoes":[]}', atualizado_em = now() where id = v_proj;
  get diagnostics n = row_count; assert n = 1, 'FALHA: quadro não salvou';
end
$$;
commit;

begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$
declare v_cat_ana uuid; v_ideia_ana uuid; v_meta_ana uuid;
begin
  assert (select count(*) from public.fin_lancamentos) = 0, 'FALHA: Bruno viu lançamentos da Ana';
  assert (select count(*) from public.fin_fixas) = 0 and (select count(*) from public.fin_aportes) = 0, 'FALHA: Bruno viu finanças da Ana';
  assert (select count(*) from public.studio_projetos) = 0, 'FALHA: Bruno viu projetos da Ana';
  reset role;
  select id into v_cat_ana from public.fin_categorias where user_id = '11111111-1111-1111-1111-111111111111' limit 1;
  select id into v_ideia_ana from public.ideias where user_id = '11111111-1111-1111-1111-111111111111' limit 1;
  select id into v_meta_ana from public.fin_metas where user_id = '11111111-1111-1111-1111-111111111111' limit 1;
  perform public.teste_logar('22222222-2222-2222-2222-222222222222');
  begin
    insert into public.fin_lancamentos (tipo, valor, categoria_id) values ('gasto', 5, v_cat_ana);
    raise exception 'FALHA: usou categoria da Ana';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.fin_aportes (meta_id, valor) values (v_meta_ana, 5);
    raise exception 'FALHA: guardou na meta da Ana';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.studio_projetos (titulo, ideia_id) values ('x', v_ideia_ana);
    raise exception 'FALHA: ligou projeto à ideia da Ana';
  exception when insufficient_privilege then null; end;
end
$$;
commit;

-- Tempo de uso: só pela função, limitado, e privado.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
begin
  perform public.hub_registrar_uso('treino', 120);
  perform public.hub_registrar_uso('treino', 99999);
  assert (select segundos from public.hub_uso where modulo = 'treino') = 720, 'FALHA: soma do uso';
  begin
    insert into public.hub_uso (dia, modulo, segundos) values (public.hub_hoje(), 'x', 1);
    raise exception 'FALHA: gravou uso direto na tabela';
  exception when insufficient_privilege then null; end;
end
$$;
commit;
begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$
begin
  assert (select count(*) from public.hub_uso) = 0, 'FALHA: Bruno viu o uso da Ana';
end
$$;
commit;
