/** Textos do Meu dia. A rotina em si fica no banco (editável); aqui só o roteiro dos blocos do dia. */

export type BlocoDoDia = { id: 'manha' | 'tarde' | 'noite'; nome: string; foco: string; itens: string[] }

export const BLOCOS_SEMANA: BlocoDoDia[] = [
  {
    id: 'manha',
    nome: 'Manhã · foco e energia',
    foco: 'O que é mais importante primeiro.',
    itens: ['Rotina da manhã', 'Treino físico', 'Bloco de foco total na tarefa de maior valor'],
  },
  {
    id: 'tarde',
    nome: 'Tarde · execução e reuniões',
    foco: 'Falar com as pessoas e resolver o que está pendente.',
    itens: ['Reuniões e alinhamentos', 'Resolver pendências', 'Entregas e operação'],
  },
  {
    id: 'noite',
    nome: 'Noite · desconexão e lazer',
    foco: 'O trabalho acabou. Hora de desligar.',
    itens: ['Desconexão total do trabalho', 'Rotina da noite', 'Leitura e descanso'],
  },
]

export const BLOCOS_FIM_DE_SEMANA: BlocoDoDia[] = [
  {
    id: 'manha',
    nome: 'Manhã · sem pressa',
    foco: 'Corpo e família primeiro.',
    itens: ['Despertar sem pressa', 'Café em família', 'Atividade ao ar livre'],
  },
  {
    id: 'tarde',
    nome: 'Tarde · lazer e casa',
    foco: 'Descansar de verdade e cuidar do seu espaço.',
    itens: ['Lazer intencional', 'Organização da casa', 'Hobbies'],
  },
  {
    id: 'noite',
    nome: 'Noite · repouso',
    foco: 'No domingo, um olhar rápido para a semana que vem.',
    itens: ['Planejamento e revisão semanal (domingo)', 'Repouso'],
  },
]

export const CATEGORIAS = [
  { id: 'pessoal', rotulo: 'Pessoal' },
  { id: 'trabalho', rotulo: 'Trabalho' },
  { id: 'saude', rotulo: 'Saúde' },
  { id: 'financas', rotulo: 'Finanças' },
  { id: 'casa', rotulo: 'Casa' },
] as const

export const PRIORIDADES = [
  { id: 'alta', rotulo: 'Alta' },
  { id: 'media', rotulo: 'Média' },
  { id: 'baixa', rotulo: 'Baixa' },
] as const

export const TEXTOS = {
  prioridadesTitulo: 'As 3 prioridades de hoje',
  prioridadesApoio: 'No máximo três. O que importa mais vem primeiro, com a primeira ação já escrita.',
  prioridadeVazia: 'Escolher a prioridade',
  acaoRotulo: 'Primeira ação (menos de 10 minutos)',
  acaoExemplo: 'Ex.: abrir o arquivo e escrever o título',
  encerrarTitulo: 'Encerrar o dia',
  encerrarApoio: 'Fechar o dia deixa a manhã de amanhã mais leve. Pergunta única:',
  encerrarPergunta: 'Qual é a primeira ação de amanhã?',
  encerrarFeito: 'Dia encerrado. Descanse.',
  despejoApoio: 'Joga tudo aqui, sem julgar e sem organizar. Depois você faz a triagem com calma.',
}
