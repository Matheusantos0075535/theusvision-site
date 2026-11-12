-- TeusVision Hub: lista de autorizados, acesso e "dia" de Brasília.
-- Nenhum dado pessoal aqui. A lista de autorizados é preenchida direto no SQL Editor.

create table public.hub_autorizados (
  email      text primary key check (email = lower(email) and position('@' in email) > 1),
  nome       text not null check (char_length(nome) between 1 and 80),
  perfil     text not null check (perfil in ('admin', 'editor', 'viewer')),
  criado_em  timestamptz not null default now()
);

-- RLS ligado e sem nenhuma política: ninguém lê nem altera pela API.
alter table public.hub_autorizados enable row level security;
revoke all on public.hub_autorizados from public, anon, authenticated;

-- O "dia" do sistema é sempre a data de Brasília, calculada aqui.
create function public.hub_hoje()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

create function public.hub_autorizado()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.hub_autorizados a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  )
$$;

create function public.hub_meu_acesso()
returns table (nome text, perfil text)
language sql
stable
security definer
set search_path = ''
as $$
  select a.nome, a.perfil
  from auth.users u
  join public.hub_autorizados a on a.email = lower(u.email)
  where u.id = auth.uid()
    and u.email_confirmed_at is not null
$$;

-- Hook "Before User Created" do Supabase Auth: só cria conta para e-mail da lista.
create function public.hub_hook_antes_de_criar_usuario(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(event -> 'user' ->> 'email');
begin
  if v_email is not null
     and exists (select 1 from public.hub_autorizados where email = v_email) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Este e-mail não tem acesso ao TeusVision Hub.'
    )
  );
end
$$;

-- Uso interno das funções dos módulos: devolve o usuário logado ou recusa.
create function public.hub_uid_autorizado()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v uuid := auth.uid();
begin
  if v is null or not public.hub_autorizado() then
    raise exception 'TV: Acesso negado.' using errcode = '42501';
  end if;
  return v;
end
$$;

revoke all on function public.hub_uid_autorizado() from public, anon, authenticated;
revoke all on function public.hub_hoje() from public, anon;
revoke all on function public.hub_autorizado() from public, anon;
revoke all on function public.hub_meu_acesso() from public, anon;
revoke all on function public.hub_hook_antes_de_criar_usuario(jsonb) from public, anon, authenticated;

grant execute on function public.hub_hoje() to authenticated;
grant execute on function public.hub_autorizado() to authenticated;
grant execute on function public.hub_meu_acesso() to authenticated;
grant execute on function public.hub_hook_antes_de_criar_usuario(jsonb) to supabase_auth_admin;
