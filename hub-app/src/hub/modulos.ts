import { BookOpen, Dumbbell, GraduationCap, House, Lightbulb, Sprout, type LucideIcon } from 'lucide-react'

export type StatusModulo = 'disponivel' | 'em_breve'

export type Modulo = {
  id: string
  nome: string
  categoria: string
  descricao: string
  icone: LucideIcon
  status: StatusModulo
  rota?: string
  previa: { resumo: string; itens: string[] }
}

export const MODULOS: Modulo[] = [
  {
    id: 'dnsmk',
    nome: 'DuoNoSmkg',
    categoria: 'Saúde',
    descricao: 'Dias sem fumar, um check-in por dia.',
    icone: Sprout,
    status: 'disponivel',
    rota: '/dnsmk',
    previa: {
      resumo: 'Sua jornada sem fumar, com check-in diário, trilha de lições e progresso. Dados privados: só você vê.',
      itens: [
        'Ofensiva, melhor sequência e total de dias',
        'Check-in diário em menos de 1 minuto',
        'Trilha de lições por fase da recuperação',
        'Progresso de humor, fissura e sono',
        'Ajuda imediata sempre à mão',
      ],
    },
  },
  {
    id: 'leitura',
    nome: 'Leitura',
    categoria: 'Hábito',
    descricao: 'Vários livros, uma página por vez.',
    icone: BookOpen,
    status: 'disponivel',
    rota: '/leitura',
    previa: {
      resumo: 'Leia vários livros ao mesmo tempo, com ofensiva diária, trilha por capítulos e um caderno com o que marcou você.',
      itens: [
        'Estante com seus livros e progresso',
        'Registro rápido da sessão de leitura',
        'Ofensiva com meta diária pequena',
        'Trilha de capítulos com estrelas',
        'Meu caderno: frases e trechos favoritos',
      ],
    },
  },
  {
    id: 'treino',
    nome: 'Treino',
    categoria: 'Corpo',
    descricao: 'Treinos, cargas e evolução.',
    icone: Dumbbell,
    status: 'em_breve',
    previa: {
      resumo: 'Registro de treinos e acompanhamento de evolução.',
      itens: ['Fichas de treino', 'Cargas e repetições', 'Evolução ao longo das semanas'],
    },
  },
  {
    id: 'estudos',
    nome: 'Estudos',
    categoria: 'Aprendizado',
    descricao: 'O que estudar e quanto já avancei.',
    icone: GraduationCap,
    status: 'em_breve',
    previa: {
      resumo: 'Uma trilha do que você precisa estudar e de como cada assunto está avançando.',
      itens: ['Trilha de assuntos', 'Avanço por tema', 'Revisões programadas'],
    },
  },
  {
    id: 'rotina',
    nome: 'Rotina da casa',
    categoria: 'Casa',
    descricao: 'Tarefas da casa sem esquecer nada.',
    icone: House,
    status: 'em_breve',
    previa: {
      resumo: 'Tarefas recorrentes da casa organizadas por dia e por frequência.',
      itens: ['Tarefas da semana', 'Recorrências', 'Lista de compras'],
    },
  },
  {
    id: 'ideias',
    nome: 'Banco de ideias',
    categoria: 'Criação',
    descricao: 'Ideias guardadas antes de sumirem.',
    icone: Lightbulb,
    status: 'em_breve',
    previa: {
      resumo: 'Um lugar rápido para guardar ideias e voltar nelas depois.',
      itens: ['Captura em segundos', 'Etiquetas', 'Ideias favoritas'],
    },
  },
]

export const ROTULO_STATUS: Record<StatusModulo, string> = {
  disponivel: 'Disponível',
  em_breve: 'Em breve',
}
