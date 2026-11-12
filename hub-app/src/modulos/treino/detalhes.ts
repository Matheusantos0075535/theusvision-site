/**
 * Ficha de cada exercício: o movimento, os músculos, por que ele está no treino e o erro mais comum.
 * Texto de orientação geral de musculação; ajuste com seu professor da academia quando precisar.
 */
export type Detalhe = { como: string; musculos: string[]; porque: string; erro: string }

export const DETALHES: Record<string, Detalhe> = {
  'puxada-frente': {
    como: 'Sentado com as coxas travadas, você puxa a barra larga de cima até a parte alta do peito, levando os cotovelos para baixo e para trás.',
    musculos: ['Dorsal (latíssimo)', 'Redondo maior', 'Bíceps', 'Parte de trás do ombro'],
    porque: 'É o exercício que mais dá largura às costas, aquele formato em V. Abre o treino porque é composto e pede você descansado.',
    erro: 'Jogar o tronco muito para trás e puxar com os braços em vez das costas.',
  },
  'puxada-triangulo': {
    como: 'Com o triângulo (pegada neutra e fechada), puxe até o peito com o tronco levemente inclinado para trás.',
    musculos: ['Dorsal', 'Romboides', 'Bíceps'],
    porque: 'A pegada fechada permite mais amplitude e carga, ótima para variar a largura com foco na parte de baixo do dorsal.',
    erro: 'Encurtar o movimento em cima: deixe os braços quase esticarem para alongar o dorsal.',
  },
  'puxada-supinada': {
    como: 'Palmas viradas para você, mãos na largura dos ombros, puxe a barra até o queixo e desça devagar.',
    musculos: ['Dorsal', 'Bíceps', 'Parte baixa do trapézio'],
    porque: 'Coloca o bíceps a favor e deixa puxar mais peso, bom substituto da puxada aberta.',
    erro: 'Virar uma rosca: o movimento começa abaixando os ombros, não dobrando o cotovelo.',
  },
  'remada-curvada': {
    como: 'Em pé, tronco inclinado à frente e coluna neutra, você puxa a barra do joelho até o umbigo.',
    musculos: ['Dorsal', 'Romboides', 'Trapézio médio', 'Lombar (estabilizando)', 'Bíceps'],
    porque: 'É o rei da espessura das costas. Trabalha muitos músculos juntos e aceita carga alta, por isso vem logo no começo.',
    erro: 'Arredondar a lombar ou levantar o tronco a cada repetição para "roubar" o peso.',
  },
  'remada-cavalinho': {
    como: 'Por cima da barra presa no chão, com o pegador em V, puxe em direção ao peito mantendo o peito aberto.',
    musculos: ['Dorsal', 'Romboides', 'Trapézio médio'],
    porque: 'Dá espessura ao meio das costas com mais estabilidade que a curvada livre.',
    erro: 'Usar as pernas para dar impulso.',
  },
  'remada-maquina': {
    como: 'Sentado com o peito no apoio, puxe as pegadas para trás até as mãos chegarem perto do tronco e aperte as escápulas.',
    musculos: ['Romboides', 'Trapézio médio', 'Dorsal', 'Parte de trás do ombro'],
    porque: 'O peito apoiado tira a lombar da jogada, então você foca só nas costas e consegue ir até a falha com segurança.',
    erro: 'Afastar o peito do apoio no fim para ganhar amplitude.',
  },
  'remada-baixa': {
    como: 'Sentado na polia baixa com o triângulo, puxe até a barriga com o tronco firme e volte alongando.',
    musculos: ['Dorsal', 'Romboides', 'Trapézio médio', 'Bíceps'],
    porque: 'Tensão constante do cabo, ótima para meio das costas e para ganhar conexão com o músculo.',
    erro: 'Balançar o tronco para frente e para trás.',
  },
  'remada-alta-maquina': {
    como: 'Na máquina, puxe as pegadas de cima para baixo e para trás, em diagonal.',
    musculos: ['Dorsal', 'Redondo maior', 'Trapézio'],
    porque: 'Mistura puxada e remada: boa para a parte alta das costas.',
    erro: 'Subir os ombros em direção às orelhas.',
  },
  serrote: {
    como: 'Com um joelho e uma mão no banco, puxe o halter do chão até o lado do quadril.',
    musculos: ['Dorsal', 'Romboides', 'Bíceps'],
    porque: 'Um lado por vez corrige diferença de força entre os lados e dá ótima amplitude.',
    erro: 'Girar o tronco para subir o peso.',
  },
  'pullover-polia': {
    como: 'Em pé na frente da polia alta, braços quase retos, você traz a barra de cima até as coxas num arco.',
    musculos: ['Dorsal', 'Redondo maior', 'Serrátil'],
    porque: 'Isola o dorsal sem o bíceps ajudar. Depois dos compostos, termina de cansar as costas e melhora a conexão mente e músculo.',
    erro: 'Dobrar muito os cotovelos e transformar em tríceps.',
  },
  'crucifixo-inverso-maquina': {
    como: 'Sentado de frente para o encosto, abra os braços para trás na altura dos ombros.',
    musculos: ['Parte de trás do ombro (deltoide posterior)', 'Romboides', 'Trapézio médio'],
    porque: 'Trabalha a parte alta das costas e o ombro de trás, que deixam a postura melhor e o ombro mais saudável.',
    erro: 'Usar carga demais e dar tranco.',
  },
  'face-pull': {
    como: 'Com a corda na polia na altura do rosto, puxe em direção às orelhas abrindo as mãos.',
    musculos: ['Deltoide posterior', 'Manguito rotador', 'Trapézio médio'],
    porque: 'Protege o ombro e equilibra tanto supino e desenvolvimento. Ombro forte atrás aguenta mais carga na frente.',
    erro: 'Puxar baixo, em direção ao peito.',
  },
  hiperextensao: {
    como: 'No banco romano, desça o tronco com a coluna reta e suba até alinhar com as pernas.',
    musculos: ['Lombar (eretores da espinha)', 'Glúteos', 'Posteriores da coxa'],
    porque: 'Fecha o treino de costas fortalecendo a lombar, que segura a coluna em todos os outros exercícios.',
    erro: 'Subir além da linha do corpo, arqueando a coluna para trás.',
  },
  encolhimento: {
    como: 'Em pé com um halter em cada mão, suba os ombros em direção às orelhas e desça devagar.',
    musculos: ['Trapézio superior'],
    porque: 'Dá volume ao trapézio, a parte entre o pescoço e o ombro.',
    erro: 'Girar os ombros em círculo.',
  },
  'supino-reto': {
    como: 'Deitado, escápulas juntas, desça a barra até o meio do peito e empurre de volta.',
    musculos: ['Peitoral maior', 'Tríceps', 'Ombro da frente'],
    porque: 'O exercício base do peito. Composto e com carga alta, vem primeiro para você render mais.',
    erro: 'Tirar o quadril do banco ou deixar os cotovelos abertos a 90 graus.',
  },
  'supino-inclinado-halter': {
    como: 'Banco entre 30 e 45 graus, desça os halteres ao lado do peito alto e empurre para cima.',
    musculos: ['Peitoral (parte alta)', 'Ombro da frente', 'Tríceps'],
    porque: 'Cuida da parte de cima do peito, que costuma ficar para trás. Halteres dão mais amplitude.',
    erro: 'Banco inclinado demais, que vira exercício de ombro.',
  },
  'supino-maquina': {
    como: 'Sentado, empurre as pegadas à frente na altura do meio do peito.',
    musculos: ['Peitoral maior', 'Tríceps'],
    porque: 'A máquina estabiliza o movimento, então dá para levar o peito ao limite com segurança, mesmo cansado.',
    erro: 'Banco baixo ou alto demais: as pegadas devem ficar na altura do meio do peito.',
  },
  'supino-inclinado-maquina': {
    como: 'Encostado na máquina inclinada, empurre as pegadas para cima e para frente.',
    musculos: ['Peitoral (parte alta)', 'Ombro da frente'],
    porque: 'Alternativa estável para a parte alta do peito.',
    erro: 'Tirar as costas do encosto.',
  },
  'supino-reto-halter': {
    como: 'Deitado com um halter em cada mão, desça até a linha do peito e suba aproximando.',
    musculos: ['Peitoral maior', 'Tríceps'],
    porque: 'Mais amplitude que a barra e trabalha cada lado separado.',
    erro: 'Bater os halteres em cima e perder a tensão.',
  },
  voador: {
    como: 'Sentado no peck deck, feche os braços à frente do peito e volte devagar.',
    musculos: ['Peitoral maior'],
    porque: 'Isola o peito sem cansar o tríceps: ótimo depois dos supinos para terminar o músculo.',
    erro: 'Deixar o peso bater atrás e perder o controle no alongamento.',
  },
  crossover: {
    como: 'Entre as polias altas, um passo à frente, traga as mãos de cima para baixo até se cruzarem.',
    musculos: ['Peitoral (parte baixa e média)'],
    porque: 'Tensão o tempo todo e aperto forte no final: o acabamento do treino de peito.',
    erro: 'Dobrar e esticar os cotovelos (vira um supino).',
  },
  'crossover-baixo': {
    como: 'Com as polias embaixo, suba as mãos em arco até a altura do queixo.',
    musculos: ['Peitoral (parte alta)'],
    porque: 'Alternativa para a parte de cima do peito com tensão constante.',
    erro: 'Usar o ombro em vez do peito.',
  },
  'crucifixo-inclinado': {
    como: 'No banco inclinado, abra os braços com halteres em arco e feche em cima do peito.',
    musculos: ['Peitoral (parte alta)'],
    porque: 'Alonga bastante o peito, estímulo forte para crescer.',
    erro: 'Descer além do confortável para o ombro.',
  },
  paralelas: {
    como: 'Nas barras paralelas, tronco inclinado à frente, desça até o cotovelo fazer 90 graus e suba.',
    musculos: ['Peitoral (parte baixa)', 'Tríceps', 'Ombro da frente'],
    porque: 'Composto com o peso do corpo, trabalha muito peito e tríceps juntos.',
    erro: 'Descer fundo demais e forçar o ombro.',
  },
  'agachamento-livre': {
    como: 'Com a barra nas costas, desça dobrando joelho e quadril juntos e suba empurrando o chão.',
    musculos: ['Quadríceps', 'Glúteos', 'Adutores', 'Lombar (estabilizando)'],
    porque: 'O exercício mais completo de perna. Gasta muita energia, então vai primeiro.',
    erro: 'Joelhos caindo para dentro na subida.',
  },
  hack: {
    como: 'Costas apoiadas na máquina inclinada, desça fundo e suba empurrando com o pé inteiro.',
    musculos: ['Quadríceps', 'Glúteos'],
    porque: 'Dá o estímulo do agachamento com as costas protegidas. Ótimo para focar no quadríceps com carga.',
    erro: 'Descer só até a metade.',
  },
  'leg-press': {
    como: 'Sentado na máquina 45°, desça a plataforma até os joelhos dobrarem bem e empurre de volta.',
    musculos: ['Quadríceps', 'Glúteos', 'Posteriores'],
    porque: 'Permite muito volume de perna com segurança, depois do exercício principal.',
    erro: 'Tirar a lombar do encosto lá embaixo ou travar os joelhos em cima.',
  },
  extensora: {
    como: 'Sentado, estique as pernas levantando o apoio e desça devagar.',
    musculos: ['Quadríceps'],
    porque: 'Isola a frente da coxa e termina o quadríceps sem cansar o resto.',
    erro: 'Jogar o peso e não segurar em cima.',
  },
  'flexora-deitada': {
    como: 'Deitado de bruços, puxe o apoio com os calcanhares em direção ao glúteo.',
    musculos: ['Posteriores da coxa'],
    porque: 'A parte de trás da coxa precisa de exercício próprio para crescer e proteger o joelho.',
    erro: 'Levantar o quadril do banco.',
  },
  'flexora-sentada': {
    como: 'Sentado com a coxa travada, puxe o apoio para baixo e para trás.',
    musculos: ['Posteriores da coxa'],
    porque: 'Variação da flexora que alonga mais o posterior.',
    erro: 'Fazer meio movimento.',
  },
  stiff: {
    como: 'Em pé com a barra, joelhos levemente dobrados e fixos, desça a barra rente às pernas levando o quadril para trás.',
    musculos: ['Posteriores da coxa', 'Glúteos', 'Lombar'],
    porque: 'Trabalha o posterior alongado, que é onde ele mais cresce.',
    erro: 'Arredondar as costas para descer mais.',
  },
  rdl: {
    como: 'Igual ao stiff, mas com mais flexão de joelho e foco em empurrar o quadril para trás.',
    musculos: ['Glúteos', 'Posteriores', 'Lombar'],
    porque: 'Ótimo para glúteo e posterior com carga.',
    erro: 'Deixar a barra se afastar das pernas.',
  },
  'panturrilha-pe': {
    como: 'Na máquina em pé, desça o calcanhar ao máximo e suba na ponta dos pés.',
    musculos: ['Panturrilha (gastrocnêmio)'],
    porque: 'A panturrilha é teimosa: precisa de amplitude completa e repetições controladas.',
    erro: 'Quicar embaixo sem pausar.',
  },
  'panturrilha-sentado': {
    como: 'Sentado com os joelhos sob o apoio, suba e desça os calcanhares.',
    musculos: ['Panturrilha (sóleo)'],
    porque: 'Pega a parte mais profunda da panturrilha.',
    erro: 'Amplitude curta.',
  },
  'desenvolvimento-maquina': {
    como: 'Sentado, empurre as pegadas da altura do queixo até em cima.',
    musculos: ['Ombro (frente e lado)', 'Tríceps'],
    porque: 'O composto principal do ombro, abre o treino com carga.',
    erro: 'Arquear a lombar para empurrar.',
  },
  'desenvolvimento-halter': {
    como: 'Sentado com halteres na altura das orelhas, empurre para cima sem bater.',
    musculos: ['Ombro (frente e lado)', 'Tríceps'],
    porque: 'Mais amplitude e trabalho de estabilidade que a máquina.',
    erro: 'Descer pouco.',
  },
  'elevacao-lateral': {
    como: 'Em pé, levante os halteres para os lados até a altura dos ombros.',
    musculos: ['Ombro lateral (deltoide médio)'],
    porque: 'É o que deixa o ombro largo. Ninguém faz demais: pede várias séries.',
    erro: 'Usar impulso do corpo e subir acima do ombro.',
  },
  'elevacao-lateral-polia': {
    como: 'Um braço por vez com o cabo passando na frente do corpo, levante para o lado.',
    musculos: ['Ombro lateral'],
    porque: 'O cabo mantém tensão desde o começo, completando a elevação com halter.',
    erro: 'Inclinar o corpo para longe da polia.',
  },
  'crucifixo-inverso-halter': {
    como: 'Tronco inclinado à frente, abra os braços para os lados com halteres leves.',
    musculos: ['Ombro de trás', 'Parte alta das costas'],
    porque: 'Equilibra o ombro e melhora a postura.',
    erro: 'Carga alta demais.',
  },
  'abdominal-polia': {
    como: 'Ajoelhado na frente da polia alta, enrole o tronco levando o peito em direção ao quadril.',
    musculos: ['Reto abdominal'],
    porque: 'Abdômen também é músculo: com carga ele cresce e fica mais definido.',
    erro: 'Sentar sobre os calcanhares e puxar com os braços.',
  },
  'elevacao-pernas': {
    como: 'Pendurado na barra, suba as pernas enrolando o quadril para cima.',
    musculos: ['Abdômen (parte baixa)', 'Flexores do quadril'],
    porque: 'Trabalha a parte baixa do abdômen e a força do core.',
    erro: 'Balançar o corpo para subir.',
  },
  'rosca-w': {
    como: 'Em pé com a barra W, suba a barra dobrando os cotovelos e desça controlando.',
    musculos: ['Bíceps', 'Braquial'],
    porque: 'O exercício base do bíceps, com carga alta. A barra W é mais confortável para o punho.',
    erro: 'Balançar o tronco para subir.',
  },
  'rosca-direta': {
    como: 'Igual à rosca W, com a barra reta.',
    musculos: ['Bíceps'],
    porque: 'Pega o bíceps bem no meio; alternativa à barra W.',
    erro: 'Cotovelos indo para frente.',
  },
  'rosca-inclinada': {
    como: 'Sentado no banco inclinado, braços pendurados atrás do corpo, suba um halter de cada vez.',
    musculos: ['Bíceps (cabeça longa)'],
    porque: 'O braço atrás do corpo alonga o bíceps, o que dá um estímulo diferente para crescer.',
    erro: 'Trazer o cotovelo para frente.',
  },
  'rosca-martelo': {
    como: 'Com a palma virada para dentro, suba os halteres sem girar o punho.',
    musculos: ['Braquial', 'Braquiorradial (antebraço)', 'Bíceps'],
    porque: 'Engrossa o braço por fora e fortalece o antebraço, que ajuda nas puxadas.',
    erro: 'Balançar o halter.',
  },
  'rosca-scott-maquina': {
    como: 'Com o braço apoiado no banco Scott, suba e desça devagar.',
    musculos: ['Bíceps (parte baixa)'],
    porque: 'O apoio impede roubar, isolando bem o bíceps.',
    erro: 'Soltar o peso no final da descida.',
  },
  'rosca-martelo-polia': {
    como: 'Na polia baixa com corda, faça a rosca com pegada neutra.',
    musculos: ['Braquial', 'Antebraço'],
    porque: 'Tensão constante para o braquial.',
    erro: 'Cotovelos se movendo.',
  },
  'triceps-corda': {
    como: 'Na polia alta com corda, estique os braços para baixo e abra a corda no final.',
    musculos: ['Tríceps (cabeça lateral)'],
    porque: 'O clássico do tríceps, ótimo para volume e conexão com o músculo.',
    erro: 'Cotovelos saindo do lado do corpo.',
  },
  'triceps-barra': {
    como: 'Na polia alta com a barra, empurre para baixo até esticar os braços.',
    musculos: ['Tríceps'],
    porque: 'Aceita mais carga que a corda.',
    erro: 'Inclinar o tronco sobre a barra.',
  },
  'triceps-frances-polia': {
    como: 'De costas para a polia, braços acima da cabeça, estique a corda para frente e para cima.',
    musculos: ['Tríceps (cabeça longa)'],
    porque: 'Com o braço acima da cabeça, a cabeça longa (a maior do tríceps) fica alongada e trabalha mais.',
    erro: 'Abrir muito os cotovelos.',
  },
  'triceps-testa': {
    como: 'Deitado, desça a barra W em direção à testa dobrando só o cotovelo e estique de volta.',
    musculos: ['Tríceps (todas as cabeças)'],
    porque: 'Composto de tríceps com boa carga.',
    erro: 'Mover os ombros junto.',
  },
  'triceps-maquina': {
    como: 'Sentado na máquina de mergulho, empurre as pegadas para baixo até esticar os braços.',
    musculos: ['Tríceps', 'Peitoral (parte baixa)'],
    porque: 'Permite carga alta com segurança para fechar o treino de braço.',
    erro: 'Encurtar o movimento.',
  },
}

/** Por que essa faixa de repetições. */
export function porqueReps(min: number, max: number) {
  if (max <= 10) return 'Faixa mais pesada (até 10 repetições): constrói força e massa nos exercícios grandes. Escolha uma carga em que as últimas repetições sejam difíceis.'
  if (min >= 12) return 'Faixa mais leve e longa (12 ou mais): queima e congestão no músculo, ideal para isolar no fim do treino. Controle a descida.'
  return 'Faixa clássica de hipertrofia (8 a 12): bom equilíbrio entre carga e volume. Quando passar do número de cima em todas as séries, aumente a carga.'
}
