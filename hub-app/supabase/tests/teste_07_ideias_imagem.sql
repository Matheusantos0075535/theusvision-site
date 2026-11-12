-- Imagem das ideias: só na própria pasta; ninguém vê a imagem do outro.
begin;
select public.teste_logar('11111111-1111-1111-1111-111111111111');
do $$
declare v uuid;
begin
  insert into public.ideias (titulo, imagem_path) values ('Com imagem', '11111111-1111-1111-1111-111111111111/a.jpg') returning id into v;
  assert (select imagem_path from public.ideias where id = v) is not null, 'FALHA: imagem_path não salvou';
  update public.ideias set imagem_path = null where id = v;
  insert into storage.objects (bucket_id, name) values ('ideias-imagens', '11111111-1111-1111-1111-111111111111/a.jpg');
  begin
    insert into storage.objects (bucket_id, name) values ('ideias-imagens', '22222222-2222-2222-2222-222222222222/invasao.jpg');
    raise exception 'FALHA: gravou na pasta de outra pessoa';
  exception when insufficient_privilege then null; end;
end
$$;
commit;
begin;
select public.teste_logar('22222222-2222-2222-2222-222222222222');
do $$
begin
  assert (select count(*) from storage.objects where bucket_id = 'ideias-imagens') = 0, 'FALHA: Bruno viu imagem da Ana';
end
$$;
commit;
