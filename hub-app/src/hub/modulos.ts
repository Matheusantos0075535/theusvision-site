import { BookOpen, Lightbulb, Briefcase, CalendarCheck, Dumbbell, GraduationCap, HandCoins, House, Rocket, Sprout, Users, Wallet, type LucideIcon } from 'lucide-react'

export type Modo = 'pessoal' | 'work'

export type StatusModulo = 'disponivel' | 'em_breve'

export type Modulo = {
  id: string
  modo: Modo
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
    id: 'dia',
    modo: 'pessoal',
    nome: 'Meu dia',
    categoria: 'Rotina',
    descricao: 'Prioridades, rotinas e despejo mental.',
    icone: CalendarCheck,
    status: 'disponivel',
    rota: '/dia',
    previa: {
      resumo: 'O painel do seu dia: 3 prioridades, rotina da manhã e da noite (diferente no fim de semana), essenciais e um despejo mental para esvaziar a cabeça.',
      itens: [
        'As 3 prioridades do dia, cada uma com a primeira ação',
        'Rotina da manhã e da noite, editável',
        'Essenciais do dia que não se negociam',
        'Despejo mental com triagem em categorias',
        'Encerrar o dia deixando a primeira ação de amanhã pronta',
      ],
    },
  },
  {
    id: 'dnsmk',
    modo: 'pessoal',
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
    modo: 'pessoal',
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
    modo: 'pessoal',
    nome: 'Treino',
    categoria: 'Corpo',
    descricao: 'Fichas, cargas, calendário e evolução.',
    icone: Dumbbell,
    status: 'disponivel',
    rota: '/treino',
    previa: {
      resumo: 'Divisão de 5 dias para ganhar massa, com o treino do dia já montado, cargas e séries anotadas na hora e o calendário de 2026 se ajustando sozinho.',
      itens: [
        'Treino do dia e próximos dias com descanso planejado',
        'Anotar carga e repetições de cada série',
        'Cronômetro de descanso entre séries',
        'Imagens animadas de cada exercício',
        'Evolução de carga, volume e recordes',
      ],
    },
  },
  {
    id: 'estudos',
    modo: 'pessoal',
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
    modo: 'pessoal',
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
    modo: 'pessoal',
    nome: 'TheusVision Ideias',
    categoria: 'Criação',
    descricao: 'Banco de ideias com link, propósito e plano.',
    icone: Lightbulb,
    status: 'disponivel',
    rota: '/ideias',
    previa: {
      resumo: 'Guarde toda ideia antes de ela sumir: cole o link do Instagram ou YouTube que inspirou, escreva o propósito, marque o dia de executar e quebre em etapas.',
      itens: [
        'Captura rápida colando o link',
        'Prévia do reel ou vídeo dentro do app',
        'Propósito, data e área de cada ideia',
        'Plano de ação com etapas e progresso',
        'Agenda: atrasadas, hoje e próximos dias',
      ],
    },
  },
  {
    id: 'financas',
    modo: 'pessoal',
    nome: 'Finanças',
    categoria: 'Dinheiro',
    descricao: 'Orçamento, dívidas e o freio de compra.',
    icone: Wallet,
    status: 'em_breve',
    previa: {
      resumo: 'Controle do mês sem planilha complicada: para onde o dinheiro vai, dívidas saindo da lista e um freio contra compra por impulso.',
      itens: ['Orçamento do mês', 'Dívidas com plano de quitação', 'Freio de 24 horas para compras grandes', 'Aportes e metas'],
    },
  },
  {
    id: 'clientes',
    modo: 'work',
    nome: 'Clientes e entregas',
    categoria: 'Entrega',
    descricao: 'Uma página por cliente, com a próxima ação.',
    icone: Users,
    status: 'em_breve',
    previa: {
      resumo: 'Cada cliente ou projeto com o que é entregue, os prazos visíveis, o que está parado e a primeira ação de cada pendência.',
      itens: ['Página por cliente ou projeto', 'Próximas entregas com prazo', 'Pendências e quem depende de quem', 'Mensagens-padrão prontas'],
    },
  },
  {
    id: 'receita',
    modo: 'work',
    nome: 'Receita e prospecção',
    categoria: 'Receita',
    descricao: 'Uma iniciativa por dia, sem depender de sobra de tempo.',
    icone: HandCoins,
    status: 'em_breve',
    previa: {
      resumo: 'Propostas, follow-ups e renovações em andamento, com uma iniciativa comercial por dia.',
      itens: ['Funil simples: contato, proposta, fechado', 'Iniciativa do dia', 'Follow-ups programados', 'Cobranças e renovações'],
    },
  },
  {
    id: 'construcao',
    modo: 'work',
    nome: 'Construção do negócio',
    categoria: 'Estrutura',
    descricao: 'Processos, ofertas e automações.',
    icone: Rocket,
    status: 'em_breve',
    previa: {
      resumo: 'O trabalho NO negócio, não DENTRO dele: documentar processos, montar ofertas e automações, em um bloco fixo por semana.',
      itens: ['Bloco semanal de construção', 'Processos documentados', 'Automações e ofertas', 'Revisão dos 90 dias'],
    },
  },
  {
    id: 'negocios',
    modo: 'work',
    nome: 'Visão do trabalho',
    categoria: 'Panorama',
    descricao: 'Tudo o que está rodando, numa tela.',
    icone: Briefcase,
    status: 'em_breve',
    previa: {
      resumo: 'Um painel único do modo work: entregas da semana, receita em andamento e o que está travado.',
      itens: ['Entregas da semana', 'Receita em andamento', 'O que está travado e por quê'],
    },
  },
]

export const ROTULO_STATUS: Record<StatusModulo, string> = {
  disponivel: 'Disponível',
  em_breve: 'Em breve',
}

export const ROTULO_MODO: Record<Modo, string> = { pessoal: 'Pessoal', work: 'Work' }
