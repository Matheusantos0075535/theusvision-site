-- Gravações do jeito que o app faz (atualiza; se não existir, cria). Pegam grant de coluna errado.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare n int; v_s uuid := gen_random_uuid(); v_f uuid;
begin
  -- Leitura: config (update sem user_id, depois insert)
  update public.leit_config set meta_paginas = 5, meta_minutos = 5, meta_anual_livros = 12, som = false, vibracao = true;
  get diagnostics n = row_count; assert n = 0, 'FALHA: não deveria existir config ainda';
  insert into public.leit_config (user_id, meta_paginas, meta_minutos, meta_anual_livros, som, vibracao) values (auth.uid(), 5, 5, 12, false, true);
  update public.leit_config set meta_paginas = 8, meta_minutos = 5, meta_anual_livros = 12, som = false, vibracao = true where user_id = auth.uid();
  get diagnostics n = row_count; assert n = 1, 'FALHA: não atualizou a config';

  -- Meu dia: encerramento
  perform public.dia_iniciar();
  insert into public.dia_encerramentos (dia, primeira_acao_amanha) values (public.hub_hoje() - 1, 'a');
  update public.dia_encerramentos set primeira_acao_amanha = 'b' where dia = public.hub_hoje() - 1;
  get diagnostics n = row_count; assert n = 1, 'FALHA: encerramento não atualizou';

  -- Treino: agenda e séries
  perform public.treino_iniciar();
  select id into v_f from public.treino_fichas limit 1;
  insert into public.treino_agenda (dia, ficha_id) values (public.hub_hoje() + 1, v_f);
  update public.treino_agenda set ficha_id = null where dia = public.hub_hoje() + 1;
  get diagnostics n = row_count; assert n = 1, 'FALHA: agenda não atualizou';
  insert into public.treino_sessoes (id, nome) values (v_s, 'T');
  insert into public.treino_series (id, sessao_id, exercicio, ordem, serie, carga_kg, reps, feita) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_s, 'x', 1, 1, 10, 10, true);
  update public.treino_series set exercicio = 'y', ordem = 2, carga_kg = 12, reps = 9, feita = false where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  get diagnostics n = row_count; assert n = 1, 'FALHA: série não atualizou';
  -- Chave não pode ser trocada
  begin
    update public.treino_series set sessao_id = gen_random_uuid() where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    raise exception 'FALHA: trocou a sessão da série';
  exception when insufficient_privilege then null; end;
end
$$;
commit;
