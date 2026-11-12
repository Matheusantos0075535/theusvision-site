-- Meu dia: privacidade, semente da rotina (idempotente), limite de datas e vínculo dos feitos ao dono.

begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare
  r jsonb; v_item uuid; v_n int;
begin
  r := public.dia_iniciar();
  assert (r ->> 'hoje')::date = public.hub_hoje(), 'FALHA: dia_iniciar devolveu outro dia';
  select count(*) into v_n from public.dia_itens;
  assert v_n = 17, 'FALHA: rotina padrão deveria ter 17 itens, tem ' || v_n;
  perform public.dia_iniciar();
  assert (select count(*) from public.dia_itens) = v_n, 'FALHA: semear duas vezes duplicou a rotina';

  select id into v_item from public.dia_itens where bloco = 'manha' and quando = 'semana' order by ordem limit 1;
  insert into public.dia_feitos (item_id) values (v_item);
  insert into public.dia_feitos (item_id, dia) values (v_item, public.hub_hoje() - 1);
  begin
    insert into public.dia_feitos (item_id, dia) values (v_item, public.hub_hoje() - 2);
    raise exception 'FALHA: aceitou marcar dia distante';
  exception when sqlstate '22023' then null; end;
  begin
    insert into public.dia_prioridades (dia, ordem, titulo) values (public.hub_hoje() + 1, 1, 'amanhã');
    raise exception 'FALHA: aceitou prioridade de dia futuro';
  exception when sqlstate '22023' then null; end;

  insert into public.dia_prioridades (ordem, titulo, primeira_acao) values (1, 'Fechar proposta', 'Abrir o modelo');
  begin
    insert into public.dia_prioridades (ordem, titulo) values (4, 'quarta');
    raise exception 'FALHA: aceitou 4ª prioridade';
  exception when check_violation then null; end;
  begin
    insert into public.dia_prioridades (ordem, titulo) values (1, 'duplicada');
    raise exception 'FALHA: aceitou duas prioridades na mesma posição';
  exception when unique_violation then null; end;

  insert into public.dia_despejo (texto, categoria, prioridade) values ('Ligar para o contador', 'trabalho', 'alta');
  insert into public.dia_encerramentos (primeira_acao_amanha) values ('Abrir a proposta');
  assert (public.dia_iniciar() ->> 'encerrado')::boolean, 'FALHA: encerramento não apareceu';
  begin
    update public.dia_itens set user_id = '22222222-2222-2222-2222-222222222222' where id = v_item;
    raise exception 'FALHA: trocou o dono de um item';
  exception when insufficient_privilege then null; end;
end
$$;
commit;

-- Bruno (autorizado, não admin) começa do zero e não vê nada da Ana; não marca item de outra pessoa.
begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$
declare v_item_ana uuid;
begin
  assert (select count(*) from public.dia_itens) = 0, 'FALHA: Bruno viu itens antes de iniciar';
  perform public.dia_iniciar();
  assert (select count(*) from public.dia_itens) = 17, 'FALHA: Bruno deveria ter a própria rotina';
  assert (select count(*) from public.dia_despejo) = 0 and (select count(*) from public.dia_prioridades) = 0
    and (select count(*) from public.dia_encerramentos) = 0, 'FALHA: Bruno viu dados da Ana';
  select id into v_item_ana from (select id from public.dia_itens limit 1) x;
  reset role;
  select id into v_item_ana from public.dia_itens where user_id = '11111111-1111-1111-1111-111111111111' limit 1;
  perform public.teste_logar('22222222-2222-2222-2222-222222222222');
  begin
    insert into public.dia_feitos (item_id) values (v_item_ana);
    raise exception 'FALHA: Bruno marcou item da Ana';
  exception when foreign_key_violation then null; end;
end
$$;
commit;

-- Usuário sem autorização não abre nada.
begin;
select public.teste_logar('33333333-3333-3333-3333-333333333333');
do $$
begin
  begin
    perform public.dia_iniciar();
    raise exception 'FALHA: usuário de fora abriu o módulo';
  exception when insufficient_privilege then null; end;
  assert (select count(*) from public.dia_itens) = 0, 'FALHA: usuário de fora leu itens';
end
$$;
commit;
