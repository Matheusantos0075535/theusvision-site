-- Hub: lista de autorizados protegida e acesso só para quem está nela com e-mail confirmado.

begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$ begin
  begin
    perform * from public.hub_autorizados;
    raise exception 'FALHA: admin conseguiu ler hub_autorizados diretamente';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.hub_autorizados values ('x@exemplo.com', 'X', 'admin');
    raise exception 'FALHA: usuário conseguiu inserir em hub_autorizados';
  exception when insufficient_privilege then null; end;
  begin
    update public.hub_autorizados set perfil = 'admin';
    raise exception 'FALHA: usuário conseguiu alterar hub_autorizados';
  exception when insufficient_privilege then null; end;
  assert public.hub_autorizado(), 'FALHA: Ana deveria estar autorizada';
  assert (select nome from public.hub_meu_acesso()) = 'Ana', 'FALHA: hub_meu_acesso deveria trazer só a Ana';
  assert (select count(*) from public.hub_meu_acesso()) = 1, 'FALHA: hub_meu_acesso trouxe mais de uma linha';
end $$;
rollback;

begin;
select public.teste_logar('33333333-3333-3333-3333-333333333333');
do $$ begin
  assert not public.hub_autorizado(), 'FALHA: e-mail fora da lista não pode ser autorizado';
  assert (select count(*) from public.hub_meu_acesso()) = 0, 'FALHA: fora da lista não pode ver acesso';
end $$;
rollback;

begin;
select public.teste_logar('44444444-4444-4444-4444-444444444444');
do $$ begin
  assert not public.hub_autorizado(), 'FALHA: e-mail não confirmado não pode ser autorizado';
end $$;
rollback;

begin;
set local role anon;
do $$ begin
  begin
    perform public.hub_meu_acesso();
    raise exception 'FALHA: anônimo conseguiu chamar hub_meu_acesso';
  exception when insufficient_privilege then null; end;
end $$;
rollback;

-- Hook de cadastro
do $$ begin
  assert public.hub_hook_antes_de_criar_usuario('{"user":{"email":"Ana@Exemplo.com"}}') = '{}'::jsonb,
    'FALHA: hook deveria liberar e-mail da lista (sem diferenciar maiúsculas)';
  assert (public.hub_hook_antes_de_criar_usuario('{"user":{"email":"fora@exemplo.com"}}') -> 'error' ->> 'http_code') = '403',
    'FALHA: hook deveria bloquear e-mail fora da lista';
end $$;

begin;
set local role authenticated;
do $$ begin
  begin
    perform public.hub_hook_antes_de_criar_usuario('{}');
    raise exception 'FALHA: usuário comum conseguiu chamar o hook';
  exception when insufficient_privilege then null; end;
end $$;
rollback;

do $$ begin
  assert public.hub_hoje() = (now() at time zone 'America/Sao_Paulo')::date, 'FALHA: hub_hoje fora de Brasília';
end $$;
