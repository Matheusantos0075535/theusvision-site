import { supabase } from './supabase'

/**
 * "Salvar ou criar" sem usar upsert. O upsert do PostgREST reescreve também as colunas de chave
 * (user_id, dia, id), e as tabelas do Hub só deixam o app mudar os campos de conteúdo.
 * Aqui: atualiza a linha que bate com `filtro`; se não existir, cria com `criar`.
 */
export async function atualizarOuCriar(
  tabela: string,
  filtro: Record<string, string>,
  campos: Record<string, unknown>,
  criar: Record<string, unknown>,
) {
  let q = supabase.from(tabela).update(campos)
  for (const [k, v] of Object.entries(filtro)) q = q.eq(k, v)
  const r = await q.select()
  if (r.error) return r.error
  if (r.data && r.data.length > 0) return null
  const c = await supabase.from(tabela).insert(criar)
  return c.error
}
