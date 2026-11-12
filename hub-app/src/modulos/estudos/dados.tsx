import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import { somarDias } from '../../lib/tempo'
import { uid } from '../prototipo/estado'

export type Topico = { id: string; nome: string; aprendido?: string; proxima?: string; nivel: number; revisoes: number }
export type Trilha = { id: string; nome: string; cor: string; topicos: Topico[] }
/** ok = false: o foco foi abandonado e a árvore murchou (não conta minutos). */
export type Sessao = { id: string; dia: string; min: number; trilha: string; ok?: boolean }
export type Dados = {
  trilhas: Trilha[]
  sessoes: Sessao[]
  timer: { fim: number; total: number; trilha: string; pausado?: number } | null
  meta: number
  metaDia: number
}

/** Revisão espaçada: depois de aprender, revisa em 1, 3, 7, 14, 30 e 60 dias. */
export const INTERVALOS = [1, 3, 7, 14, 30, 60]
export const CORES = ['#3ddc97', '#ff9f11', '#7fb0f5', '#c792ea', '#ff8f82']

export function exemplo(): Dados {
  const t = (nome: string): Topico => ({ id: uid(), nome, nivel: 0, revisoes: 0 })
  return {
    meta: 25,
    metaDia: 60,
    timer: null,
    sessoes: [],
    trilhas: [
      {
        id: uid(),
        nome: 'Manual de reconstrução',
        cor: CORES[0],
        topicos: [
          'O mapa da situação',
          'O modelo dos três sistemas',
          'Dopamina: querer não é gostar',
          'Desamparo aprendido e controle',
          'Catálogo de padrões (P1 a P13)',
          'Ferramentas do núcleo (F1 a F6)',
          'Protocolo de 12 semanas',
          'Prevenção de recaída',
        ].map(t),
      },
      { id: uid(), nome: 'Tráfego pago', cor: CORES[1], topicos: ['Estrutura de campanha', 'Públicos e segmentação', 'Criativos que convertem', 'Métricas: CPA, CTR, ROAS'].map(t) },
      { id: uid(), nome: 'IA e automação', cor: CORES[2], topicos: ['Prompts que funcionam', 'Automações no dia a dia da agência', 'Agentes e integrações'].map(t) },
    ],
  }
}

type Ctx = { d: Dados; set: Dispatch<SetStateAction<Dados>> }
export const EstCtx = createContext<Ctx | null>(null)
export const useE = () => useContext(EstCtx)!

export const minutosDoDia = (sessoes: Sessao[], dia: string) => sessoes.filter((s) => s.dia === dia && s.ok !== false).reduce((t, s) => t + s.min, 0)

export function sequencia(sessoes: Sessao[], hoje: string) {
  const s = new Set(sessoes.filter((x) => x.ok !== false).map((x) => x.dia))
  let n = 0
  let d = s.has(hoje) ? hoje : somarDias(hoje, -1)
  while (s.has(d)) {
    n++
    d = somarDias(d, -1)
  }
  return n
}

export const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`)
