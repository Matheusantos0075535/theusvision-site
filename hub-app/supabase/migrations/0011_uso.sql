-- Tempo de uso por módulo e dia (só conta com o módulo aberto e em uso). Seguro rodar mais de uma vez.

create table if not exists public.hub_uso (
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia       date not null,
  modulo    text not null check (modulo ~ '^[a-z][a-z-]{1,29}$'),
  segundos  integer not null default 0 check (segundos >= 0),
  primary key (user_id, dia, modulo)
);

alter table public.hub_uso enable row level security;
revoke all on public.hub_uso from public, anon, authenticated;
grant select on public.hub_uso to authenticated;
drop policy if exists hub_uso_ler on public.hub_uso;
create policy hub_uso_ler on public.hub_uso for select to authenticated
  using (user_id = (select auth.uid()) and (select public.hub_autorizado()));

-- Soma segundos ao dia de hoje (Brasília). Limita cada envio para não inflar por engano.
create or replace function public.hub_registrar_uso(p_modulo text, p_segundos integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.hub_uid_autorizado();
  v_seg integer := least(greatest(coalesce(p_segundos, 0), 0), 600);
begin
  if v_seg = 0 then return; end if;
  if p_modulo is null or p_modulo !~ '^[a-z][a-z-]{1,29}$' then
    raise exception 'TV: Módulo inválido.' using errcode = '22023';
  end if;
  insert into public.hub_uso (user_id, dia, modulo, segundos)
  values (v_uid, public.hub_hoje(), p_modulo, v_seg)
  on conflict (user_id, dia, modulo) do update set segundos = public.hub_uso.segundos + excluded.segundos;
end
$$;
revoke all on function public.hub_registrar_uso(text, integer) from public, anon;
grant execute on function public.hub_registrar_uso(text, integer) to authenticated;
