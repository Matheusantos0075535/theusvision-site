-- Leitura: privacidade entre usuários, progresso só por sessões, ofensiva, idempotência e capas privadas.

-- Livro do Bruno com id conhecido (inserido como superusuário só para o teste poder mirar nele).
insert into public.leit_livros (id, user_id, titulo, autor, total_paginas, estado)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Livro do Bruno', 'Autor B', 100, 'lendo');

begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare
  v_livro uuid; v_livro_b uuid; r jsonb; v_sessao uuid := gen_random_uuid(); e jsonb;
begin
  -- Admin não enxerga o livro do Bruno.
  assert (select count(*) from public.leit_livros) = 0, 'FALHA: admin viu livro de outra pessoa';
  select id into v_livro_b from public.leit_livros where titulo = 'Livro do Bruno';
  assert v_livro_b is null, 'FALHA: admin achou o livro do Bruno';

  insert into public.leit_livros (titulo, autor, total_paginas, estado) values ('Livro da Ana', 'Autora A', 200, 'lendo')
  returning id into v_livro;
  assert (select iniciado_em from public.leit_livros where id = v_livro) = public.hub_hoje(), 'FALHA: iniciado_em automático';
  insert into public.leit_capitulos (livro_id, ordem, nome, pagina_inicial) values
    (v_livro, 1, 'Começo', 1), (v_livro, 2, 'Meio', 25), (v_livro, 3, 'Fim', 120);

  -- Progresso não pode ser editado direto.
  begin
    update public.leit_livros set pagina_atual = 150 where id = v_livro;
    raise exception 'FALHA: página atual alterada sem sessão';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.leit_dias (user_id, dia, cumprido) values (auth.uid(), public.hub_hoje(), true);
    raise exception 'FALHA: dia de leitura inserido sem sessão';
  exception when insufficient_privilege then null; end;

  -- Sessão retroativa de ontem: confirma o dia de ontem.
  r := public.leit_registrar_sessao(gen_random_uuid(), v_livro, public.hub_hoje() - 1, 12, null, 4::smallint, null, null, null);
  assert (r ->> 'dia_confirmado')::boolean, 'FALHA: 12 páginas deveriam cumprir a meta de ontem';
  assert (r ->> 'depois')::int = 1, 'FALHA: ofensiva deveria ser 1 depois de ontem';

  -- Sessão de hoje: 12 → 30, cruza o fim do capítulo "Começo" (página 24).
  r := public.leit_registrar_sessao(v_sessao, v_livro, null, 30, 15, 5::smallint, 'ideia boa', 28, 'uma frase marcante');
  assert (r ->> 'novo')::boolean and (r ->> 'dia_confirmado')::boolean, 'FALHA: primeira sessão de hoje confirma o dia';
  assert (r ->> 'antes')::int = 1 and (r ->> 'depois')::int = 2, 'FALHA: ofensiva 1 → 2, veio ' || (r ->> 'antes') || ' → ' || (r ->> 'depois');
  assert (r -> 'livro' ->> 'pagina_atual')::int = 30, 'FALHA: livro deveria estar na página 30';
  assert jsonb_array_length(r -> 'capitulos_concluidos') = 1 and (r -> 'capitulos_concluidos' -> 0 ->> 'rotulo') = 'Começo',
    'FALHA: deveria concluir o capítulo Começo';
  assert (r -> 'livro' ->> 'capitulo_atual') = 'Meio', 'FALHA: capítulo atual deveria ser Meio';
  assert (select count(*) from public.leit_trechos) = 1, 'FALHA: trecho favorito deveria ser salvo';

  -- Mesmo id de novo: não premia nem soma.
  r := public.leit_registrar_sessao(v_sessao, v_livro, null, 30, 15, 5::smallint, 'ideia boa', 28, 'uma frase marcante');
  assert not (r ->> 'novo')::boolean, 'FALHA: repetir a mesma sessão não pode ser novo';
  assert (select count(*) from public.leit_sessoes) = 2, 'FALHA: repetição criou sessão duplicada';
  assert (select paginas from public.leit_dias where dia = public.hub_hoje()) = 18, 'FALHA: repetição somou páginas';

  -- Segunda sessão do dia não confirma o dia de novo.
  r := public.leit_registrar_sessao(gen_random_uuid(), v_livro, null, 40, null, null, null, null, null);
  assert not (r ->> 'dia_confirmado')::boolean and (r ->> 'depois')::int = 2, 'FALHA: segunda sessão do dia não premia';

  -- Limites.
  begin
    perform public.leit_registrar_sessao(gen_random_uuid(), v_livro, public.hub_hoje() - 3, 50, null, null, null, null, null);
    raise exception 'FALHA: retroativo de 3 dias deveria ser recusado';
  exception when raise_exception then if sqlerrm not like 'TV:%' then raise; end if; end;
  begin
    perform public.leit_registrar_sessao(gen_random_uuid(), v_livro, null, 999, null, null, null, null, null);
    raise exception 'FALHA: página acima do total deveria ser recusada';
  exception when raise_exception then if sqlerrm not like 'TV:%' then raise; end if; end;

  -- Concluir o livro.
  r := public.leit_registrar_sessao(gen_random_uuid(), v_livro, null, 200, null, null, null, null, null);
  assert (r -> 'livro' ->> 'concluido_agora')::boolean, 'FALHA: chegar na última página conclui o livro';
  assert (select estado from public.leit_livros where id = v_livro) = 'concluido', 'FALHA: estado deveria ser concluido';
  update public.leit_livros set nota_final = 5, resumo_final = 'Gostei' where id = v_livro;

  e := public.leit_estado();
  assert (e ->> 'ofensiva')::int = 2 and (e ->> 'total_dias')::int = 2 and (e ->> 'melhor')::int = 2, 'FALHA: estado da ofensiva';
  assert (e ->> 'livros_ano')::int = 1, 'FALHA: 1 livro concluído no ano';
  assert exists (select 1 from public.leit_conquistas where tipo = 'paginas' and marco = 100), 'FALHA: selo de 100 páginas';

  -- Mesmo sabendo o id, não dá para mexer no livro do Bruno.
  begin
    insert into public.leit_capitulos (livro_id, ordem, nome, pagina_inicial)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'invasão', 1);
    raise exception 'FALHA: capítulo pendurado no livro de outra pessoa';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.leit_trechos (livro_id, citacao) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'invasão');
    raise exception 'FALHA: trecho no livro de outra pessoa';
  exception when foreign_key_violation then null; end;
  begin
    perform public.leit_registrar_sessao(gen_random_uuid(), 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 50, null, null, null, null, null);
    raise exception 'FALHA: sessão registrada no livro de outra pessoa';
  exception when raise_exception then if sqlerrm not like 'TV:%' then raise; end if; end;
  update public.leit_livros set titulo = 'invadido' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  delete from public.leit_livros where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
end $$;
commit;

do $$ begin
  assert (select titulo from public.leit_livros where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') = 'Livro do Bruno',
    'FALHA: Ana conseguiu alterar ou apagar o livro do Bruno';
end $$;

-- Bruno: não vê nada da Ana e não consegue usar o livro dela.
begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$
declare v_ana uuid; r jsonb;
begin
  assert (select count(*) from public.leit_livros) = 1, 'FALHA: Bruno deveria ver só o próprio livro';
  assert (select count(*) from public.leit_sessoes) = 0, 'FALHA: Bruno viu sessões da Ana';
  assert (select count(*) from public.leit_trechos) = 0, 'FALHA: Bruno viu trechos da Ana';
  assert (select count(*) from public.leit_capitulos) = 0, 'FALHA: Bruno viu capítulos da Ana';
  assert (select count(*) from public.leit_dias) = 0, 'FALHA: Bruno viu dias da Ana';

  select id into v_ana from public.leit_livros l where l.user_id = '11111111-1111-1111-1111-111111111111';
  assert v_ana is null, 'FALHA: Bruno encontrou o livro da Ana';

  -- Proteção de um dia: leu anteontem, não leu ontem.
  r := public.leit_registrar_sessao(gen_random_uuid(), (select id from public.leit_livros limit 1),
       public.hub_hoje() - 2, 15, null, null, null, null, null);
  assert (public.leit_estado() ->> 'pode_congelar')::boolean, 'FALHA: deveria poder proteger ontem';
  r := public.leit_congelar_ontem();
  assert (r ->> 'ofensiva')::int = 1, 'FALHA: ofensiva protegida deveria continuar em 1, veio ' || (r ->> 'ofensiva');
  assert (r ->> 'total_dias')::int = 1, 'FALHA: dia protegido não conta no total';
  begin
    perform public.leit_congelar_ontem();
    raise exception 'FALHA: proteção só vale uma vez';
  exception when raise_exception then if sqlerrm not like 'TV:%' then raise; end if; end;
  begin
    update public.leit_config set congelamento_usado_em = null;
    raise exception 'FALHA: usuário zerou a proteção sozinho';
  exception when insufficient_privilege then null; end;
end $$;
commit;

-- Capas: cada um só na própria pasta.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
insert into storage.objects (bucket_id, name) values ('leit-capas', '11111111-1111-1111-1111-111111111111/capa.jpg');
do $$ begin
  begin
    insert into storage.objects (bucket_id, name) values ('leit-capas', '22222222-2222-2222-2222-222222222222/capa.jpg');
    raise exception 'FALHA: gravou capa na pasta de outra pessoa';
  exception when insufficient_privilege then null; end;
end $$;
commit;

begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$ begin
  assert (select count(*) from storage.objects where bucket_id = 'leit-capas') = 0, 'FALHA: Bruno viu capa da Ana';
end $$;
rollback;

-- Fora da lista: nada.
begin;
select public.teste_logar('33333333-3333-3333-3333-333333333333');
do $$ begin
  assert (select count(*) from public.leit_livros) = 0, 'FALHA: fora da lista leu livros';
  begin
    insert into public.leit_livros (titulo, total_paginas) values ('x', 10);
    raise exception 'FALHA: fora da lista criou livro';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
