import { diaDaSemana, somarDias } from '../../lib/tempo'
import type { Agenda, Ficha, FichaItem, Perfil, Sessao } from './tipos'

export type Plano =
  | { tipo: 'feito'; sessoes: Sessao[]; fichaId: string | null }
  | { tipo: 'treino'; fichaId: string; manual: boolean }
  | { tipo: 'descanso'; manual: boolean }
  | { tipo: 'vazio' }

/** Domingo da semana do dia. */
export const inicioDaSemana = (dia: string) => somarDias(dia, -diaDaSemana(dia))

/**
 * Planeja do passado até `ate`:
 * - passado: o que foi feito (ou descanso marcado);
 * - hoje e futuro: agenda manual > dia de folga > próxima ficha da rotação depois do último treino.
 * Respeita o limite de dias de treino por semana.
 */
export function planejar(p: { hoje: string; ate: string; desde: string; fichas: Ficha[]; sessoes: Sessao[]; agenda: Agenda[]; perfil: Perfil }) {
  const { hoje, ate, desde, perfil } = p
  const fichas = p.fichas.filter((f) => f.ativa).sort((a, b) => a.ordem - b.ordem)
  const porDia = new Map<string, Sessao[]>()
  for (const s of [...p.sessoes].sort((a, b) => a.iniciado_em.localeCompare(b.iniciado_em))) {
    const l = porDia.get(s.dia) ?? []
    l.push(s)
    porDia.set(s.dia, l)
  }
  const agenda = new Map(p.agenda.map((a) => [a.dia, a.ficha_id]))
  const plano = new Map<string, Plano>()

  // Último treino antes de hoje (ou de hoje), para saber qual ficha vem depois.
  let ultima: string | null = null
  const anteriores = [...p.sessoes].filter((s) => s.dia < hoje && s.ficha_id).sort((a, b) => (a.dia + a.iniciado_em).localeCompare(b.dia + b.iniciado_em))
  if (anteriores.length) ultima = anteriores[anteriores.length - 1].ficha_id

  const proxima = (depois: string | null) => {
    if (!fichas.length) return null
    const i = fichas.findIndex((f) => f.id === depois)
    return fichas[(i + 1) % fichas.length].id
  }

  const treinosNaSemana = new Map<string, number>()
  const contar = (dia: string) => {
    const k = inicioDaSemana(dia)
    treinosNaSemana.set(k, (treinosNaSemana.get(k) ?? 0) + 1)
  }

  for (let d = desde; d <= ate; d = somarDias(d, 1)) {
    const feitos = porDia.get(d)
    if (feitos?.length) {
      const fid = feitos[feitos.length - 1].ficha_id
      plano.set(d, { tipo: 'feito', sessoes: feitos, fichaId: fid })
      if (d >= hoje && fid) ultima = fid
      contar(d)
      continue
    }
    if (d < hoje) {
      if (agenda.has(d) && agenda.get(d) === null) plano.set(d, { tipo: 'descanso', manual: true })
      else if (perfil.folgas.includes(diaDaSemana(d))) plano.set(d, { tipo: 'descanso', manual: false })
      else plano.set(d, { tipo: 'vazio' })
      continue
    }
    if (agenda.has(d)) {
      const fid = agenda.get(d)
      if (fid && fichas.some((f) => f.id === fid)) {
        plano.set(d, { tipo: 'treino', fichaId: fid, manual: true })
        ultima = fid
        contar(d)
      } else plano.set(d, { tipo: 'descanso', manual: true })
      continue
    }
    const semana = treinosNaSemana.get(inicioDaSemana(d)) ?? 0
    if (perfil.folgas.includes(diaDaSemana(d)) || semana >= perfil.dias_semana) {
      plano.set(d, { tipo: 'descanso', manual: false })
      continue
    }
    const fid = proxima(ultima)
    if (!fid) {
      plano.set(d, { tipo: 'descanso', manual: false })
      continue
    }
    plano.set(d, { tipo: 'treino', fichaId: fid, manual: false })
    ultima = fid
    contar(d)
  }
  return plano
}

/** Tempo estimado: aquecimento + cada série (~45 s de execução + descanso). */
export function duracaoEstimada(itens: FichaItem[], descansoPadrao: number) {
  const seg = itens.reduce((t, i) => t + i.series * (45 + (i.descanso_seg ?? descansoPadrao)), 0)
  return Math.round(seg / 60) + 8
}

/** 1RM estimado (Epley). */
export const umRM = (carga: number, reps: number) => (reps <= 1 ? carga : carga * (1 + reps / 30))
