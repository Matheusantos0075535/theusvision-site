export type Perfil = {
  peso_kg: number | null
  altura_cm: number | null
  dias_semana: number
  folgas: number[]
  descanso_seg: number
  duracao_max_min: number
}

export type FichaItem = {
  id: string
  ficha_id: string
  ordem: number
  exercicio: string
  series: number
  reps_min: number
  reps_max: number
  descanso_seg: number | null
  nota: string | null
}

export type Ficha = { id: string; nome: string; foco: string | null; ordem: number; ativa: boolean; itens: FichaItem[] }

export type Sessao = {
  id: string
  dia: string
  ficha_id: string | null
  nome: string
  iniciado_em: string
  concluido_em: string | null
  sem_registro: boolean
}

export type Serie = {
  id: string
  sessao_id: string
  exercicio: string
  ordem: number
  serie: number
  carga_kg: number | null
  reps: number | null
  feita: boolean
  criado_em: string
}

export type Agenda = { dia: string; ficha_id: string | null }

export const PERFIL_PADRAO: Perfil = { peso_kg: null, altura_cm: null, dias_semana: 5, folgas: [0, 1], descanso_seg: 90, duracao_max_min: 90 }
