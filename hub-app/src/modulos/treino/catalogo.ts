/**
 * Catálogo de exercícios. Imagens: free-exercise-db (domínio público), dois quadros por exercício em public/treino.
 * As fichas guardam só o id; trocar por outro do mesmo grupo é um toque.
 */
export type Grupo = 'costas' | 'peito' | 'pernas' | 'panturrilha' | 'ombros' | 'trapezio' | 'biceps' | 'triceps' | 'abdomen' | 'lombar'

export const GRUPOS: Record<Grupo, string> = {
  costas: 'Costas',
  peito: 'Peito',
  pernas: 'Pernas',
  panturrilha: 'Panturrilha',
  ombros: 'Ombros',
  trapezio: 'Trapézio',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  abdomen: 'Abdômen',
  lombar: 'Lombar',
}

export type Exercicio = {
  id: string
  nome: string
  grupo: Grupo
  /** Grupos que também trabalham (contam meia série na análise). */
  apoio?: Grupo[]
  equipamento: 'Máquina' | 'Polia' | 'Halteres' | 'Barra' | 'Peso do corpo'
  dicas: string[]
}

const E = (id: string, nome: string, grupo: Grupo, equipamento: Exercicio['equipamento'], dicas: string[], apoio?: Grupo[]): Exercicio => ({
  id,
  nome,
  grupo,
  equipamento,
  dicas,
  apoio,
})

export const EXERCICIOS: Exercicio[] = [
  // costas
  E('puxada-frente', 'Puxada frontal aberta', 'costas', 'Polia', ['Peito alto, puxe a barra até a parte de cima do peito.', 'Pense em levar os cotovelos para o bolso.'], ['biceps']),
  E('puxada-triangulo', 'Puxada com triângulo', 'costas', 'Polia', ['Tronco levemente inclinado para trás.', 'Segure 1 segundo embaixo apertando as costas.'], ['biceps']),
  E('puxada-supinada', 'Puxada supinada', 'costas', 'Polia', ['Pegada com as palmas para você, na largura dos ombros.', 'Desça controlando, sem soltar o peso.'], ['biceps']),
  E('remada-curvada', 'Remada curvada com barra', 'costas', 'Barra', ['Coluna neutra, tronco perto de 45 graus.', 'Puxe a barra em direção ao umbigo.'], ['biceps', 'lombar']),
  E('remada-cavalinho', 'Remada cavalinho (T-bar)', 'costas', 'Barra', ['Peito aberto, sem arredondar as costas.', 'Aperte as escápulas no final.'], ['biceps']),
  E('remada-maquina', 'Remada sentada na máquina articulada', 'costas', 'Máquina', ['Peito apoiado no encosto.', 'Puxe com os cotovelos e segure 1 segundo atrás.'], ['biceps']),
  E('remada-baixa', 'Remada baixa na polia', 'costas', 'Polia', ['Tronco parado, sem balançar.', 'Leve o triângulo até a barriga.'], ['biceps']),
  E('remada-alta-maquina', 'Remada alta na máquina (high row)', 'costas', 'Máquina', ['Puxe de cima para baixo e para trás.', 'Ótima para a parte alta das costas.'], ['biceps']),
  E('serrote', 'Remada unilateral com halter (serrote)', 'costas', 'Halteres', ['Joelho e mão apoiados no banco.', 'Puxe o halter em direção ao quadril.'], ['biceps']),
  E('pullover-polia', 'Pullover na polia (braços estendidos)', 'costas', 'Polia', ['Braços quase retos, leve flexão no cotovelo.', 'Desça a barra até as coxas sentindo o dorsal.']),
  E('crucifixo-inverso-maquina', 'Crucifixo inverso na máquina (voador inverso)', 'costas', 'Máquina', ['Braços abertos na altura dos ombros.', 'Movimento curto e controlado, sem tranco.'], ['ombros']),
  E('face-pull', 'Face pull na polia', 'ombros', 'Polia', ['Corda na altura do rosto.', 'Puxe abrindo as mãos para os lados das orelhas.'], ['costas', 'trapezio']),
  E('hiperextensao', 'Hiperextensão lombar (banco romano)', 'lombar', 'Peso do corpo', ['Desça com a coluna neutra.', 'Suba até alinhar o corpo, sem jogar para trás.'], ['pernas']),
  E('encolhimento', 'Encolhimento com halteres', 'trapezio', 'Halteres', ['Suba os ombros em direção às orelhas.', 'Segure 1 segundo em cima.']),
  // peito
  E('supino-reto', 'Supino reto com barra', 'peito', 'Barra', ['Escápulas juntas e pés firmes no chão.', 'Desça a barra até o meio do peito.'], ['triceps', 'ombros']),
  E('supino-inclinado-halter', 'Supino inclinado com halteres', 'peito', 'Halteres', ['Banco entre 30 e 45 graus.', 'Desça os halteres na linha do peito alto.'], ['triceps', 'ombros']),
  E('supino-maquina', 'Supino na máquina articulada (chest press)', 'peito', 'Máquina', ['Pegadas na altura do meio do peito.', 'Empurre sem travar os cotovelos.'], ['triceps']),
  E('supino-inclinado-maquina', 'Supino inclinado na máquina', 'peito', 'Máquina', ['Encosto bem apoiado.', 'Foco na parte alta do peito.'], ['triceps', 'ombros']),
  E('supino-reto-halter', 'Supino reto com halteres', 'peito', 'Halteres', ['Halteres descem até a linha do peito.', 'Suba aproximando, sem bater um no outro.'], ['triceps']),
  E('voador', 'Voador (peck deck)', 'peito', 'Máquina', ['Cotovelos levemente flexionados.', 'Aperte o peito 1 segundo no meio.']),
  E('crossover', 'Crossover na polia alta', 'peito', 'Polia', ['Um passo à frente, tronco levemente inclinado.', 'Cruze as mãos à frente do quadril.']),
  E('crossover-baixo', 'Crossover de baixo para cima', 'peito', 'Polia', ['Polias embaixo, mãos sobem até a altura do queixo.', 'Foco no peito alto.']),
  E('crucifixo-inclinado', 'Crucifixo inclinado com halteres', 'peito', 'Halteres', ['Abra até sentir alongar, sem passar da linha do ombro.', 'Cotovelos fixos, levemente dobrados.']),
  E('paralelas', 'Paralelas (mergulho para peito)', 'peito', 'Peso do corpo', ['Tronco inclinado para frente.', 'Desça até o cotovelo fazer 90 graus.'], ['triceps']),
  // pernas
  E('agachamento-livre', 'Agachamento livre com barra', 'pernas', 'Barra', ['Pés na largura dos ombros, joelhos na direção dos pés.', 'Desça com o tronco firme até onde manter a coluna neutra.'], ['lombar']),
  E('hack', 'Agachamento no hack', 'pernas', 'Máquina', ['Costas bem apoiadas.', 'Desça fundo e suba empurrando com o pé inteiro.']),
  E('leg-press', 'Leg press 45°', 'pernas', 'Máquina', ['Lombar colada no encosto.', 'Não trave os joelhos lá em cima.']),
  E('extensora', 'Cadeira extensora', 'pernas', 'Máquina', ['Segure 1 segundo com a perna esticada.', 'Desça devagar.']),
  E('flexora-deitada', 'Mesa flexora', 'pernas', 'Máquina', ['Quadril colado no banco.', 'Puxe até perto do glúteo e volte controlando.']),
  E('flexora-sentada', 'Cadeira flexora', 'pernas', 'Máquina', ['Coxa travada pelo apoio.', 'Movimento completo e controlado.']),
  E('stiff', 'Stiff com barra', 'pernas', 'Barra', ['Joelhos levemente dobrados e fixos.', 'Desça a barra rente às pernas, quadril para trás.'], ['lombar']),
  E('rdl', 'Levantamento terra romeno', 'pernas', 'Barra', ['Quadril vai para trás, coluna neutra.', 'Suba apertando os glúteos.'], ['lombar']),
  E('panturrilha-pe', 'Panturrilha em pé na máquina', 'panturrilha', 'Máquina', ['Desça bem o calcanhar.', 'Segure 1 segundo na ponta dos pés.']),
  E('panturrilha-sentado', 'Panturrilha sentado', 'panturrilha', 'Máquina', ['Amplitude completa.', 'Ritmo lento, sem quicar.']),
  // ombros
  E('desenvolvimento-maquina', 'Desenvolvimento na máquina', 'ombros', 'Máquina', ['Costas no encosto.', 'Desça até as mãos ficarem na altura do queixo.'], ['triceps']),
  E('desenvolvimento-halter', 'Desenvolvimento com halteres', 'ombros', 'Halteres', ['Sentado, abdômen firme.', 'Suba sem bater os halteres.'], ['triceps']),
  E('elevacao-lateral', 'Elevação lateral com halteres', 'ombros', 'Halteres', ['Suba até a altura dos ombros.', 'Cotovelo levemente à frente da mão.']),
  E('elevacao-lateral-polia', 'Elevação lateral na polia', 'ombros', 'Polia', ['Um braço por vez, cabo passando à frente do corpo.', 'Tensão constante, sem tranco.']),
  E('crucifixo-inverso-halter', 'Crucifixo inverso com halteres', 'ombros', 'Halteres', ['Tronco inclinado à frente.', 'Abra os braços focando a parte de trás do ombro.'], ['costas']),
  // abdômen
  E('abdominal-polia', 'Abdominal na polia (ajoelhado)', 'abdomen', 'Polia', ['Enrole o tronco levando o peito em direção ao quadril.', 'O quadril fica parado.']),
  E('elevacao-pernas', 'Elevação de pernas suspenso', 'abdomen', 'Peso do corpo', ['Sem balançar o corpo.', 'Suba as pernas enrolando o quadril.']),
  // bíceps
  E('rosca-w', 'Rosca direta com barra W', 'biceps', 'Barra', ['Cotovelos colados no corpo.', 'Desça até quase esticar, sem embalar.']),
  E('rosca-direta', 'Rosca direta com barra reta', 'biceps', 'Barra', ['Tronco parado.', 'Suba apertando o bíceps.']),
  E('rosca-inclinada', 'Rosca alternada no banco inclinado', 'biceps', 'Halteres', ['Braços pendurados atrás do corpo.', 'Gire o punho para fora ao subir.']),
  E('rosca-martelo', 'Rosca martelo', 'biceps', 'Halteres', ['Pegada neutra, polegar para cima.', 'Trabalha bíceps e antebraço.']),
  E('rosca-scott-maquina', 'Rosca Scott na máquina', 'biceps', 'Máquina', ['Braço todo apoiado.', 'Desça devagar, sem soltar no final.']),
  E('rosca-martelo-polia', 'Rosca martelo na polia (corda)', 'biceps', 'Polia', ['Cotovelos fixos.', 'Tensão constante do começo ao fim.']),
  // tríceps
  E('triceps-corda', 'Tríceps na polia com corda', 'triceps', 'Polia', ['Cotovelos colados ao corpo.', 'Abra a corda no final do movimento.']),
  E('triceps-barra', 'Tríceps pulley com barra', 'triceps', 'Polia', ['Cotovelos parados.', 'Estique totalmente e volte até 90 graus.']),
  E('triceps-frances-polia', 'Tríceps francês na polia (corda)', 'triceps', 'Polia', ['De costas para a polia, braços acima da cabeça.', 'Ótimo para a cabeça longa do tríceps.']),
  E('triceps-testa', 'Tríceps testa com barra W', 'triceps', 'Barra', ['Desça a barra em direção à testa.', 'Cotovelos apontando para o teto.']),
  E('triceps-maquina', 'Tríceps na máquina (mergulho)', 'triceps', 'Máquina', ['Tronco reto.', 'Empurre até esticar os braços.']),
]

export const EXERCICIO: Record<string, Exercicio> = Object.fromEntries(EXERCICIOS.map((e) => [e.id, e]))

export function nomeExercicio(id: string) {
  return EXERCICIO[id]?.nome ?? id
}

export function alternativas(id: string) {
  const g = EXERCICIO[id]?.grupo
  return EXERCICIOS.filter((e) => e.grupo === g && e.id !== id)
}

/** Séries semanais por grupo para hipertrofia (faixa usual de referência). */
export const SERIES_SEMANA = { min: 10, max: 20 }
