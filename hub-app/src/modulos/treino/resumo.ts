import { supabase } from '../../lib/supabase'
import { somarDias } from '../../lib/tempo'
import { inicioDaSemana, planejar } from './plano'
import { PERFIL_PADRAO, type Agenda, type Ficha, type Perfil, type Sessao } from './tipos'

/** Para o card do Hub: treinos feitos na semana e o treino de hoje. */
export async function resumoDoTreino() {
  const ini = await supabase.rpc('treino_iniciar')
  if (ini.error) throw ini.error
  const hoje = (ini.data as { hoje: string }).hoje
  const domingo = inicioDaSemana(hoje)
  const [pe, fi, se, ag] = await Promise.all([
    supabase.from('treino_perfil').select('peso_kg, altura_cm, dias_semana, folgas, descanso_seg, duracao_max_min').maybeSingle(),
    supabase.from('treino_fichas').select('id, nome, foco, ordem, ativa'),
    supabase.from('treino_sessoes').select('id, dia, ficha_id, nome, iniciado_em, concluido_em, sem_registro').gte('dia', somarDias(domingo, -60)),
    supabase.from('treino_agenda').select('dia, ficha_id').gte('dia', domingo),
  ])
  const falha = pe.error ?? fi.error ?? se.error ?? ag.error
  if (falha) throw falha
  const perfil: Perfil = { ...PERFIL_PADRAO, ...(pe.data ?? {}) }
  const fichas = (fi.data as Omit<Ficha, 'itens'>[]).map((f) => ({ ...f, itens: [] }))
  const plano = planejar({ hoje, desde: domingo, ate: somarDias(domingo, 6), fichas, sessoes: se.data as Sessao[], agenda: ag.data as Agenda[], perfil })
  const feitos = Array.from({ length: 7 }, (_, i) => plano.get(somarDias(domingo, i))).filter((p) => p?.tipo === 'feito').length
  const p = plano.get(hoje)
  const linha =
    p?.tipo === 'feito' ? 'Treino de hoje feito' : p?.tipo === 'treino' ? `Hoje: ${fichas.find((f) => f.id === p.fichaId)?.nome ?? 'treino'}` : 'Hoje: descanso'
  return { feitos, meta: perfil.dias_semana, linha }
}
