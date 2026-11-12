import { useMemo } from 'react'
import { hojeBrasiliaIso, somarDias } from '../../lib/tempo'
import { uid, usePersistido } from '../prototipo/estado'

export type Status = 'a_fazer' | 'fazendo' | 'aprovacao' | 'entregue'
export const STATUS_ENTREGA: { id: Status; rotulo: string }[] = [
  { id: 'a_fazer', rotulo: 'A fazer' },
  { id: 'fazendo', rotulo: 'Fazendo' },
  { id: 'aprovacao', rotulo: 'Em aprovação' },
  { id: 'entregue', rotulo: 'Entregue' },
]

export type Entrega = { id: string; titulo: string; prazo?: string; status: Status; processo?: string }
export type Pendencia = { id: string; texto: string; acao: string; feita: boolean }
export type Cliente = {
  id: string
  nome: string
  fixo: boolean
  servico: string
  contato: string
  notas: string
  entregas: Entrega[]
  pendencias: Pendencia[]
}
export type Execucao = { id: string; processo: string; clienteId?: string; titulo: string; feitos: number[]; criado: string; fim?: string }
export type Fonte = { id: string; nome: string }
export type Etapa = 'mente' | 'contatado' | 'proposta' | 'fechado' | 'perdido'
export const ETAPAS: { id: Etapa; rotulo: string }[] = [
  { id: 'mente', rotulo: 'Em mente' },
  { id: 'contatado', rotulo: 'Contatado' },
  { id: 'proposta', rotulo: 'Proposta' },
  { id: 'fechado', rotulo: 'Fechado' },
  { id: 'perdido', rotulo: 'Perdido' },
]
export type Prospect = { id: string; nome: string; contato: string; etapa: Etapa; acao: string; valor: number; criado: string }

export type Work = {
  clientes: Cliente[]
  execucoes: Execucao[]
  fontes: Fonte[]
  /** caixa['2026-11'][fonteId] = { previsto, recebido } */
  caixa: Record<string, Record<string, { previsto: number; recebido: number }>>
  prospects: Prospect[]
  iniciativas: string[]
  construcao: string[]
}

/** Nomes de clientes ficam só no seu aparelho: edite os de exemplo no app. */
export function exemplo(): Work {
  const h = hojeBrasiliaIso()
  const f1 = uid()
  const f2 = uid()
  const f3 = uid()
  return {
    clientes: [
      {
        id: uid(),
        nome: 'Cliente fitness (edite o nome)',
        fixo: true,
        servico: 'Tráfego, atendimento por IA, vídeos e site',
        contato: '',
        notas: '',
        entregas: [
          { id: uid(), titulo: 'Relatório da campanha do mês', prazo: somarDias(h, 4), status: 'fazendo', processo: 'relatorio' },
          { id: uid(), titulo: 'Atualizar promoção no agente de atendimento', prazo: somarDias(h, 1), status: 'a_fazer', processo: 'agente-ia' },
          { id: uid(), titulo: 'Novo site: página de planos', prazo: somarDias(h, 10), status: 'a_fazer', processo: 'site' },
        ],
        pendencias: [{ id: uid(), texto: 'Alinhar entregas da semana com a equipe do cliente', acao: 'Mandar mensagem propondo horário', feita: false }],
      },
      {
        id: uid(),
        nome: 'Cliente de perfumaria (edite o nome)',
        fixo: true,
        servico: 'Reposicionamento da marca e conteúdo',
        contato: '',
        notas: '',
        entregas: [{ id: uid(), titulo: 'Vídeos comerciais do mês', prazo: somarDias(h, 6), status: 'fazendo', processo: 'edicao-video' }],
        pendencias: [{ id: uid(), texto: 'Mapear gargalos e definir plano de ação para a marca', acao: 'Listar 5 gargalos em 10 minutos', feita: false }],
      },
    ],
    execucoes: [],
    fontes: [
      { id: f1, nome: 'Cliente fixo · fitness' },
      { id: f2, nome: 'Cliente fixo · perfumaria' },
      { id: f3, nome: 'Projetos e esporádicos' },
    ],
    caixa: {},
    prospects: [{ id: uid(), nome: 'Comércio local (exemplo)', contato: '', etapa: 'mente', acao: 'Mandar mensagem para um único contato', valor: 1200, criado: h }],
    iniciativas: [],
    construcao: [],
  }
}

export function useWork() {
  const [w, setW, recomecar] = usePersistido<Work>('tv-proto-work', exemplo)
  return useMemo(() => ({ w, setW, recomecar }), [w, setW, recomecar])
}

export const mesAtual = () => hojeBrasiliaIso().slice(0, 7)
export const semanaDe = (dia: string) => somarDias(dia, -new Date(`${dia}T12:00:00Z`).getUTCDay())
