-- DuoNoSmkg: privacidade total entre usuários (inclusive admin) e regras de honestidade.
-- Ana = admin, Bruno = viewer. Datas sempre relativas a hub_hoje().

-- Bruno cria a jornada dele e faz um check-in com dados sensíveis.
begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
select public.dnsmk_iniciar(public.hub_hoje() - 10);
select public.dnsmk_checkin(public.hub_hoje(), 2::smallint, 7::smallint, 'ruim', 'alta', array['estresse'], 'nota do bruno');
select public.dnsmk_recaida('privado do bruno');
commit;

-- Ana (admin) começa com 72 dias, como no estado inicial pedido.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare e jsonb; r jsonb;
begin
  e := public.dnsmk_iniciar(public.hub_hoje() - 72);
  assert (e ->> 'sequencia_atual')::int = 72, 'FALHA: deveria começar com 72 dias, veio ' || (e ->> 'sequencia_atual');
  assert (e ->> 'proxima_meta')::int = 80, 'FALHA: próxima meta deveria ser 80';
  assert (e ->> 'meta_anterior')::int = 72, 'FALHA: meta anterior deveria ser 72';
  assert (e ->> 'dia_da_jornada')::int = 73, 'FALHA: hoje deveria ser o dia 73 da jornada';
  assert (e -> 'proxima_licao' ->> 'id') = 'u6-4', 'FALHA: próxima lição deveria ser u6-4, veio ' || coalesce(e -> 'proxima_licao' ->> 'id', 'nula');
  assert (e -> 'proxima_licao' ->> 'liberada')::boolean, 'FALHA: lição do dia 73 deveria estar liberada';
  assert (select count(*) from public.dnsmk_licoes l join public.dnsmk_licoes_catalogo c on c.id = l.licao_id where c.unidade <= 5)
         = (select count(*) from public.dnsmk_licoes_catalogo where unidade <= 5), 'FALHA: unidades 1 a 5 deveriam estar concluídas';
  assert exists (select 1 from public.dnsmk_conquistas where marco = 72), 'FALHA: selo de 72 dias deveria existir';
  assert not exists (select 1 from public.dnsmk_conquistas where marco = 80), 'FALHA: selo de 80 não pode existir ainda';

  -- Privacidade: a admin não vê nada do Bruno.
  assert (select count(*) from public.dnsmk_jornada) = 1, 'FALHA: admin viu jornada de outra pessoa';
  assert (select count(*) from public.dnsmk_checkins where user_id <> auth.uid()) = 0, 'FALHA: admin viu check-in de outra pessoa';
  assert (select count(*) from public.dnsmk_recaidas) = 0, 'FALHA: admin viu recaída de outra pessoa';
  assert (select count(*) from public.dnsmk_conquistas where user_id <> auth.uid()) = 0, 'FALHA: admin viu conquistas de outra pessoa';

  -- Escrita direta é proibida: só pelas funções.
  begin
    insert into public.dnsmk_checkins (user_id, dia, humor, fissura, sono, ansiedade)
    values (auth.uid(), public.hub_hoje(), 5, 0, 'bom', 'baixa');
    raise exception 'FALHA: insert direto em check-ins deveria ser bloqueado';
  exception when insufficient_privilege then null; end;
  begin
    update public.dnsmk_jornada set inicio_sequencia = '2000-01-01';
    raise exception 'FALHA: update direto na jornada deveria ser bloqueado';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.dnsmk_checkins (user_id, dia, humor, fissura, sono, ansiedade)
    values ('22222222-2222-2222-2222-222222222222', public.hub_hoje() - 1, 5, 0, 'bom', 'baixa');
    raise exception 'FALHA: gravar em nome de outra pessoa deveria ser bloqueado';
  exception when insufficient_privilege then null; end;

  -- Check-in de hoje: 72 → 73, idempotente.
  r := public.dnsmk_checkin(public.hub_hoje(), 4::smallint, 3::smallint, 'bom', 'baixa', array['tedio', 'habito'], 'caminhada');
  assert (r ->> 'novo')::boolean, 'FALHA: primeiro check-in deveria ser novo';
  assert (r ->> 'antes')::int = 72 and (r ->> 'depois')::int = 73, 'FALHA: deveria ir de 72 para 73';
  assert not (r ->> 'eh_marco')::boolean, 'FALHA: 73 não é marco';
  r := public.dnsmk_checkin(public.hub_hoje(), 1::smallint, 9::smallint, 'ruim', 'alta', '{}', null);
  assert not (r ->> 'novo')::boolean, 'FALHA: segundo check-in no mesmo dia não pode ser novo';
  assert (r ->> 'depois')::int = 73, 'FALHA: repetir o check-in não pode somar de novo';
  assert (select humor from public.dnsmk_checkins where dia = public.hub_hoje()) = 4, 'FALHA: repetir não pode sobrescrever o registro';

  -- Retroativo: até 2 dias. Não muda a ofensiva.
  r := public.dnsmk_checkin(public.hub_hoje() - 2, 3::smallint, 4::smallint, 'ok', 'media', '{}', null);
  assert (r ->> 'novo')::boolean and (r ->> 'retroativo')::boolean, 'FALHA: retroativo de 2 dias deveria valer';
  assert (r ->> 'depois')::int = 73, 'FALHA: retroativo não muda a ofensiva';
  begin
    perform public.dnsmk_checkin(public.hub_hoje() - 3, 3::smallint, 4::smallint, 'ok', 'media', '{}', null);
    raise exception 'FALHA: retroativo de 3 dias deveria ser recusado';
  exception when raise_exception then
    if sqlerrm not like 'TV:%' then raise; end if;
  end;
  begin
    perform public.dnsmk_checkin(public.hub_hoje() + 1, 3::smallint, 4::smallint, 'ok', 'media', '{}', null);
    raise exception 'FALHA: check-in no futuro deveria ser recusado';
  exception when raise_exception then
    if sqlerrm not like 'TV:%' then raise; end if;
  end;
  begin
    perform public.dnsmk_checkin(public.hub_hoje() - 1, 3::smallint, 4::smallint, 'ok', 'media', array['inventado'], null);
    raise exception 'FALHA: gatilho fora da lista deveria ser recusado';
  exception when check_violation then null; end;

  -- Lições: a liberada pode, a futura não.
  r := public.dnsmk_concluir_licao('u6-4');
  assert (r ->> 'novo')::boolean, 'FALHA: lição liberada deveria concluir';
  r := public.dnsmk_concluir_licao('u6-4');
  assert not (r ->> 'novo')::boolean, 'FALHA: concluir de novo não pode contar duas vezes';
  begin
    perform public.dnsmk_concluir_licao('u7-1');
    raise exception 'FALHA: lição do dia 91 não pode ser concluída no dia 73';
  exception when raise_exception then
    if sqlerrm not like 'TV:%' then raise; end if;
  end;
end $$;
commit;

-- Recaída: guarda melhor e total, recomeça amanhã, não apaga nada.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare r jsonb; e jsonb;
begin
  r := public.dnsmk_recaida('foi num aniversário');
  -- O check-in de hoje já tinha sido feito: a sequência encerrada é a que estava na tela (73).
  assert (r ->> 'dias_da_sequencia')::int = 73, 'FALHA: recaída deveria encerrar os 73 dias mostrados, veio ' || (r ->> 'dias_da_sequencia');
  e := r -> 'estado';
  assert (e ->> 'sequencia_atual')::int = 0, 'FALHA: nova sequência começa em 0';
  assert (e ->> 'melhor')::int = 73, 'FALHA: melhor sequência deveria ser preservada (73), veio ' || (e ->> 'melhor');
  assert (e ->> 'total')::int = 73, 'FALHA: total deveria ser 73, veio ' || (e ->> 'total');
  assert (e -> 'proxima_licao' ->> 'id') = 'u6-5', 'FALHA: lições concluídas continuam concluídas';
  assert (select count(*) from public.dnsmk_checkins) = 2, 'FALHA: recaída não pode apagar check-ins';

  -- Duas recaídas no mesmo dia contam uma vez.
  r := public.dnsmk_recaida(null);
  assert (r -> 'estado' ->> 'total')::int = 73, 'FALHA: segunda recaída no mesmo dia não pode mexer no total';
  assert (select count(*) from public.dnsmk_recaidas) = 1, 'FALHA: segunda recaída no mesmo dia não pode criar registro';

  -- Depois da recaída, hoje não aceita check-in "sem fumar".
  begin
    perform public.dnsmk_checkin(public.hub_hoje(), 3::smallint, 4::smallint, 'ok', 'media', '{}', null);
    raise exception 'FALHA: check-in no dia da recaída deveria ser recusado';
  exception when raise_exception then
    if sqlerrm not like 'TV:%' then raise; end if;
  end;
end $$;
rollback;

-- Bruno não vê nada da Ana.
begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$ begin
  assert (select count(*) from public.dnsmk_checkins) = 1, 'FALHA: Bruno deveria ver só o próprio check-in';
  assert (select count(*) from public.dnsmk_checkins where ajudou = 'caminhada') = 0, 'FALHA: Bruno viu check-in da Ana';
  assert (select count(*) from public.dnsmk_jornada) = 1, 'FALHA: Bruno viu jornada de outra pessoa';
  assert (public.dnsmk_estado() ->> 'sequencia_atual')::int = 0, 'FALHA: estado do Bruno misturou dados';
end $$;
rollback;

-- Fora da lista e anônimo: nada.
begin;
select public.teste_logar('33333333-3333-3333-3333-333333333333');
do $$ begin
  assert (select count(*) from public.dnsmk_checkins) = 0, 'FALHA: usuário fora da lista leu check-ins';
  begin
    perform public.dnsmk_estado();
    raise exception 'FALHA: usuário fora da lista chamou dnsmk_estado';
  exception when insufficient_privilege then null; end;
end $$;
rollback;

begin;
set local role anon;
do $$ begin
  begin
    perform * from public.dnsmk_checkins;
    raise exception 'FALHA: anônimo leu check-ins';
  exception when insufficient_privilege then null; end;
end $$;
rollback;

-- Metas
do $$ begin
  assert public.dnsmk_proxima_meta(0) = 7 and public.dnsmk_proxima_meta(72) = 80 and public.dnsmk_proxima_meta(365) = 455
     and public.dnsmk_proxima_meta(460) = 545, 'FALHA: sequência de metas';
  assert public.dnsmk_eh_marco(72) and public.dnsmk_eh_marco(455) and not public.dnsmk_eh_marco(73), 'FALHA: marcos';
end $$;
