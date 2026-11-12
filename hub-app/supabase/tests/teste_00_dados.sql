-- Usuários fictícios para os testes (nenhum dado real).
insert into auth.users (id, email, email_confirmed_at) values
  ('11111111-1111-1111-1111-111111111111', 'ana@exemplo.com',      now()),
  ('22222222-2222-2222-2222-222222222222', 'bruno@exemplo.com',    now()),
  ('33333333-3333-3333-3333-333333333333', 'fora@exemplo.com',     now()),
  ('44444444-4444-4444-4444-444444444444', 'pendente@exemplo.com', null);

insert into public.hub_autorizados (email, nome, perfil) values
  ('ana@exemplo.com',      'Ana',      'admin'),
  ('bruno@exemplo.com',    'Bruno',    'viewer'),
  ('pendente@exemplo.com', 'Pendente', 'viewer');

-- Atalho de teste: age como um usuário logado dentro da transação atual.
create function public.teste_logar(p_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_id)::text, true)
$$;
grant execute on function public.teste_logar(uuid) to authenticated;
