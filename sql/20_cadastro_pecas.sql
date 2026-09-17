-- Portal YXZ 2.0 | Cadastro seguro de peças | V1
-- Revisar no projeto de TESTES antes de executar na produção.
-- NÃO reinstala as tabelas existentes e NÃO altera estoque de outras peças.
-- Executar no SQL Editor como uma unidade transacional.
begin;

do $check$
begin
  if to_regclass('public.gp_pecas') is null
     or to_regclass('public.gp_pecas_oficinas') is null
     or to_regclass('public.gp_movimentacoes_estoque') is null
     or to_regprocedure('private.gp_pode_gerenciar()') is null
     or not exists (select 1 from storage.buckets where id = 'gp-pecas' and public = false)
  then
    raise exception 'Pre-requisitos ausentes ou bucket gp-pecas nao privado. Nenhuma alteracao aplicada.';
  end if;
end
$check$;

create or replace function public.gp_cadastrar_peca(
  p_codigo text,
  p_nome text,
  p_categoria text,
  p_cor text,
  p_estoque integer,
  p_estoque_minimo integer,
  p_disponivel_todas boolean,
  p_oficinas uuid[],
  p_imagem_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $func$
declare
  v_usuario uuid := auth.uid();
  v_codigo text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_codigo, '')));
  v_nome text := pg_catalog.btrim(coalesce(p_nome, ''));
  v_categoria text := pg_catalog.btrim(coalesce(p_categoria, ''));
  v_cor text := pg_catalog.btrim(coalesce(p_cor, ''));
  v_oficinas uuid[] := coalesce(p_oficinas, array[]::uuid[]);
  v_total integer;
  v_validas integer;
  v_peca_id uuid;
begin
  -- Autorizacao REAL: nao confia no perfil nem no usuario enviado pelo cliente.
  if v_usuario is null or not (select private.gp_pode_gerenciar()) then
    raise exception 'Sem permissao para cadastrar pecas.' using errcode = '42501';
  end if;

  if pg_catalog.length(v_codigo) < 2 or pg_catalog.length(v_codigo) > 60
     or v_codigo !~ '^[A-Z0-9][A-Z0-9._/-]*$' then
    raise exception 'Codigo invalido: use 2 a 60 caracteres, letras, numeros, ponto, barra, hifen ou sublinhado.';
  end if;
  if pg_catalog.length(v_nome) < 2 or pg_catalog.length(v_nome) > 180 then
    raise exception 'Nome da peca invalido (2 a 180 caracteres).';
  end if;
  if pg_catalog.length(v_categoria) > 100 or pg_catalog.length(v_cor) > 80 then
    raise exception 'Categoria ou cor excedeu o tamanho permitido.';
  end if;
  if p_estoque is null or p_estoque < 0 or p_estoque > 1000000
     or p_estoque_minimo is null or p_estoque_minimo < 0 or p_estoque_minimo > 1000000 then
    raise exception 'Estoque e estoque minimo devem ser inteiros entre 0 e 1000000.';
  end if;
  if p_disponivel_todas is null then
    raise exception 'Informe a disponibilidade da peca.';
  end if;
  if p_imagem_path is null
     or p_imagem_path !~ '^pecas/cadastros/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$' then
    raise exception 'Caminho da imagem invalido.';
  end if;

  -- Evita duplicatas por caixa e serializa cadastros concorrentes do mesmo codigo.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_codigo)::bigint);
  if exists (
    select 1 from public.gp_pecas p
    where pg_catalog.upper(pg_catalog.btrim(p.codigo_legado)) = v_codigo
  ) then
    raise exception 'Codigo ja cadastrado.' using errcode = '23505';
  end if;

  -- Nao aceita caminhos falsos, objetos de outros buckets ou uma imagem ja vinculada.
  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'gp-pecas' and o.name = p_imagem_path
  ) or exists (
    select 1 from public.gp_pecas p where p.imagem_path = p_imagem_path
  ) then
    raise exception 'Fotografia ausente ou ja vinculada a outra peca.';
  end if;

  v_total := coalesce(pg_catalog.array_length(v_oficinas, 1), 0);
  if p_disponivel_todas then
    if v_total <> 0 then raise exception 'Todas as oficinas nao aceita lista de oficinas.'; end if;
  else
    if v_total < 1 or v_total > 100 then
      raise exception 'Selecione pelo menos uma oficina (maximo 100).';
    end if;
    select pg_catalog.count(distinct o.id)::integer
      into v_validas
    from public.gp_oficinas o
    where o.id = any(v_oficinas) and o.ativo is true;
    if v_validas <> v_total then
      raise exception 'Lista de oficinas contem duplicidade ou oficina inexistente/inativa.';
    end if;
  end if;

  insert into public.gp_pecas (
    codigo_legado, nome, categoria, cor, estoque, estoque_minimo,
    disponivel_todas, imagem_path, ativo
  )
  values (
    v_codigo, v_nome, v_categoria, v_cor, p_estoque, p_estoque_minimo,
    p_disponivel_todas, p_imagem_path, true
  )
  returning id into v_peca_id;

  if not p_disponivel_todas then
    insert into public.gp_pecas_oficinas (peca_id, oficina_id)
    select v_peca_id, o.id
    from public.gp_oficinas o where o.id = any(v_oficinas);
  end if;

  -- Estoque inicial fica registrado como ENTRADA; zero nao gera movimento
  -- porque gp_movimentacoes_estoque exige quantidade > 0.
  if p_estoque > 0 then
    insert into public.gp_movimentacoes_estoque (
      peca_id, usuario_id, tipo, quantidade,
      estoque_antes, estoque_depois, observacoes
    ) values (
      v_peca_id, v_usuario, 'ENTRADA', p_estoque,
      0, p_estoque, 'Cadastro inicial de peca pelo Portal YXZ'
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'id', v_peca_id, 'codigo', v_codigo, 'nome', v_nome,
    'estoque', p_estoque, 'imagem_path', p_imagem_path
  );
end
$func$;

revoke all on function public.gp_cadastrar_peca(
  text,text,text,text,integer,integer,boolean,uuid[],text
) from public,anon,authenticated;
grant execute on function public.gp_cadastrar_peca(
  text,text,text,text,integer,integer,boolean,uuid[],text
) to authenticated;

-- Permite leitura do NOVO prefixo por usuarios ativos somente se a imagem
-- estiver vinculada a uma peca ativa. Bucket continua PRIVADO.
-- Nao concede INSERT/UPDATE/DELETE no Storage ao navegador.
drop policy if exists gp_fotos_cadastro_leitura on storage.objects;
create policy gp_fotos_cadastro_leitura
  on storage.objects for select to authenticated
  using (
    bucket_id = 'gp-pecas'
    and name like 'pecas/cadastros/%'
    and (select private.gp_usuario_ativo())
    and exists (
      select 1 from public.gp_pecas p
      where p.imagem_path = name and p.ativo is true
    )
  );

commit;
notify pgrst, 'reload schema';

-- Conferencias SOMENTE LEITURA (executar separadamente, depois da instalacao):
-- select has_function_privilege('anon',
--   'public.gp_cadastrar_peca(text,text,text,text,integer,integer,boolean,uuid[],text)',
--   'execute') as anon_executa,
--   has_function_privilege('authenticated',
--   'public.gp_cadastrar_peca(text,text,text,text,integer,integer,boolean,uuid[],text)',
--   'execute') as autenticado_executa;
-- Esperado: false, true (a funcao nega usuarios que nao sejam gestores ativos).
