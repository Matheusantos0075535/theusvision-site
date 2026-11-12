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
    categoria: 'Aprendizado · protótipo',
    descricao: 'Foco cronometrado e revisões no dia certo.',
    icone: GraduationCap,
    status: 'disponivel',
    rota: '/estudos',
    previa: {
      resumo: 'Trilhas de estudo com timer de foco (15, 25 ou 30 min) e revisão espaçada: o que você aprende volta no dia certo para não esquecer.',
      itens: ['Timer de foco por trilha', 'Revisões de hoje: lembrei, mais ou menos, esqueci', 'Trilhas com assuntos e progresso', 'Minutos por dia e sequência'],
    },
  },

  {
    id: 'rotina',
    modo: 'pessoal',
    nome: 'Rotina da casa',
    categoria: 'Casa · protótipo',
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
    categoria: 'Dinheiro · protótipo',
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
