-- Ideias: privacidade, link só http(s), etapas só em ideia própria.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare v uuid;
begin
  insert into public.ideias (titulo, link, proposito) values ('Série de reels', 'https://www.instagram.com/reel/abc/', 'Atrair clientes') returning id into v;
  insert into public.ideias_etapas (ideia_id, ordem, texto) values (v, 1, 'Roteiro'), (v, 2, 'Gravar');
  assert (select count(*) from public.ideias_etapas) = 2, 'FALHA: etapas';
  begin
    insert into public.ideias (titulo, link) values ('x', 'javascript:alert(1)');
    raise exception 'FALHA: aceitou link perigoso';
  exception when check_violation then null; end;
end
$$;
commit;
begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$
declare v_ana uuid;
begin
  assert (select count(*) from public.ideias) = 0, 'FALHA: Bruno viu ideia da Ana';
  reset role;
  select id into v_ana from public.ideias limit 1;
  perform public.teste_logar('22222222-2222-2222-2222-222222222222');
  begin
    insert into public.ideias_etapas (ideia_id, texto) values (v_ana, 'invasão');
    raise exception 'FALHA: Bruno criou etapa na ideia da Ana';
  exception when foreign_key_violation then null; end;
  update public.ideias set titulo = 'hackeado' where id = v_ana;
  reset role;
  assert (select titulo from public.ideias where id = v_ana) = 'Série de reels', 'FALHA: Bruno alterou ideia da Ana';
end
$$;
commit;
