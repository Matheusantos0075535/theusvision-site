import { BookOpen, Lightbulb, Briefcase, CalendarCheck, Dumbbell, GraduationCap, HandCoins, House, Rocket, Sprout, Users, Wallet, type LucideIcon } from 'lucide-react'

export type Modo = 'pessoal' | 'work'

export type StatusModulo = 'disponivel' | 'em_breve'

export type Modulo = {
  id: string
  modo: Modo
  grupo: string
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
    grupo: 'pilares',
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
    grupo: 'pilares',
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
    grupo: 'crescimento',
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
    grupo: 'pilares',
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
    grupo: 'crescimento',
    nome: 'Estudos',
    categoria: 'Aprendizado',
    descricao: 'Foco cronometrado e revisões no dia certo.',
    icone: GraduationCap,
    status: 'disponivel',
    rota: '/estudos',
    previa: {
      resumo: 'Cada foco concluído planta uma árvore na sua floresta. Resumo do dia e do mês, calendário de 2026 com o tempo estudado e revisão espaçada dos assuntos.',
      itens: ['Timer de foco: a árvore cresce enquanto você estuda', 'Floresta do dia e do mês', 'Calendário de 2026 com minutos por dia', 'Revisões no dia certo e trilhas de assuntos'],
    },
  },

  {
    id: 'rotina',
    modo: 'pessoal',
    grupo: 'base',
    nome: 'Rotina da casa',
    categoria: 'Casa',
    descricao: 'Uma zona por dia, 15 minutos.',
    icone: House,
    status: 'disponivel',
    rota: '/casa',
    previa: {
      resumo: 'A casa dividida em micro-zonas com mapa de cores, missão de 15 minutos por dia, rotina recorrente e lista de compras.',
      itens: ['Missão de 15 minutos na zona da vez', 'Mapa da casa: caótica a organizada', 'Rotina diária, semanal e mensal', 'Lista de compras'],
    },
  },

  {
    id: 'ideias',
    modo: 'pessoal',
    grupo: 'crescimento',
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
    grupo: 'base',
    nome: 'Finanças',
    categoria: 'Dinheiro',
    descricao: 'Quanto posso gastar hoje, freio e dívidas.',
    icone: Wallet,
    status: 'disponivel',
    rota: '/financas',
    previa: {
      resumo: 'Controle simples: quanto dá para gastar por dia, freio de 24 horas contra compra por impulso, dívidas em bola de neve e metas para o futuro.',
      itens: ['Pode gastar hoje, por categoria', 'Freio de compra com contador', 'Dívidas: foco na menor primeiro', 'Reserva e investimentos'],
    },
  },

  {
    id: 'clientes',
    modo: 'work',
    grupo: 'w-operacao',
    nome: 'Clientes e entregas',
    categoria: 'Entrega',
    descricao: 'Fixos e esporádicos, com a próxima ação.',
    icone: Users,
    status: 'disponivel',
    rota: '/clientes',
    previa: {
      resumo: 'Uma página por cliente (os fixos e os avulsos) com entregas e prazos, pendências com a primeira ação e mensagens-padrão prontas.',
      itens: ['Clientes fixos e esporádicos', 'Entregas com prazo e status', 'Pendências com primeira ação', 'Todas as entregas pela urgência', 'Mensagens-padrão para copiar'],
    },
  },

  {
    id: 'receita',
    modo: 'work',
    grupo: 'w-crescimento',
    nome: 'Receita e prospecção',
    categoria: 'Receita',
    descricao: 'Fluxo de caixa e quem você tem em mente.',
    icone: HandCoins,
    status: 'disponivel',
    rota: '/receita',
    previa: {
      resumo: 'As fontes de renda do mês com previsto e recebido, e a prospecção: quem você tem em mente, em que etapa está e a iniciativa do dia.',
      itens: ['Fluxo de caixa das 3 fontes de renda', 'Recebido por mês em 2026', 'Funil: em mente, contatado, proposta, fechado', 'Iniciativa comercial do dia'],
    },
  },

  {
    id: 'construcao',
    modo: 'work',
    grupo: 'w-crescimento',
    nome: 'Construção do negócio',
    categoria: 'Estrutura',
    descricao: 'Caixa de ferramentas e processos da TheusVision.',
    icone: Rocket,
    status: 'disponivel',
    rota: '/construcao',
    previa: {
      resumo: 'Os processos da TheusVision passo a passo (vídeo com IA, edição, sites, relatório de tráfego, agente de IA) para executar por cliente sem esquecer a ordem.',
      itens: ['5 processos com regra fixa', 'Executar para um cliente e marcar os passos', 'O que a TheusVision faz', 'Bloco semanal de construção'],
    },
  },

  {
    id: 'negocios',
    modo: 'work',
    grupo: 'w-operacao',
    nome: 'Visão do trabalho',
    categoria: 'Panorama',
    descricao: 'Tudo o que está rodando, numa tela.',
    icone: Briefcase,
    status: 'disponivel',
    rota: '/visao',
    previa: {
      resumo: 'Um painel único do modo work: entregas da semana, receita do mês, o que está travado e os processos rodando.',
      itens: ['Entregas da semana e atrasadas', 'Receita do mês contra o previsto', 'O que está travado e por quê', 'Processos em andamento'],
    },
  },

]

export const ROTULO_STATUS: Record<StatusModulo, string> = {
  disponivel: 'Disponível',
  em_breve: 'Em breve',
}

export const ROTULO_MODO: Record<Modo, string> = { pessoal: 'Pessoal', work: 'Work' }

export type Grupo = { id: string; nome: string; apoio: string }

/** Categorias do painel, na ordem em que aparecem. */
export const GRUPOS: Record<Modo, Grupo[]> = {
  pessoal: [
    { id: 'pilares', nome: 'Pilares', apoio: 'O que sustenta o seu dia a dia' },
    { id: 'crescimento', nome: 'Crescimento', apoio: 'Aprender, ler e criar' },
    { id: 'base', nome: 'Base da vida', apoio: 'Casa e dinheiro em ordem' },
  ],
  work: [
    { id: 'w-operacao', nome: 'Operação', apoio: 'Clientes, entregas e visão geral' },
    { id: 'w-crescimento', nome: 'Crescimento', apoio: 'Receita e estrutura do negócio' },
  ],
}
