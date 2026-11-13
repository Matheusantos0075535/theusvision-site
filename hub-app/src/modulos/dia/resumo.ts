import { supabase } from '../../lib/supabase'
import { itensDeHoje, type Item } from './dados'

/** Para o card do Hub: quantas tarefas do A fazer (rotinas + prioridades) já foram feitas hoje. */
export async function resumoDoDia() {
  const ini = await supabase.rpc('dia_iniciar')
  if (ini.error) throw ini.error
  const { hoje, dow } = ini.data as { hoje: string; dow: number }
  const [it, fe, pr] = await Promise.all([
    supabase.from('dia_itens').select('id, bloco, quando, titulo, detalhe, ordem, ativo'),
    supabase.from('dia_feitos').select('item_id').eq('dia', hoje),
    supabase.from('dia_prioridades').select('feita').eq('dia', hoje),
  ])
  const falha = it.error ?? fe.error ?? pr.error
  if (falha) throw falha
  const fds = dow === 0 || dow === 6
  const itens = [...itensDeHoje(it.data as Item[], 'manha', fds), ...itensDeHoje(it.data as Item[], 'noite', fds)]
  const feitos = new Set((fe.data as { item_id: string }[]).map((f) => f.item_id))
  const prios = pr.data as { feita: boolean }[]
  return {
    feitos: itens.filter((i) => feitos.has(i.id)).length + prios.filter((p) => p.feita).length,
    total: itens.length + prios.length,
  }
}
