/**
 * DuoNoSmkg: TODOS os textos de saúde do módulo ficam aqui, num arquivo só,
 * para revisão por um profissional de saúde antes de publicar.
 *
 * Regras de escrita: linguagem cautelosa ("em geral", "costuma", "varia de pessoa para pessoa"),
 * sem promessas de cura, sem datas exatas, sem moralismo, sem estigma.
 * Os ids das lições precisam bater com dnsmk_licoes_catalogo (0002_dnsmk.sql).
 */

export const AVISO_EDUCATIVO = 'Conteúdo educativo, não substitui acompanhamento profissional.'

export const AJUDA = {
  botao: 'Preciso de ajuda agora',
  titulo: 'Você não precisa passar por isso sem apoio',
  apoio: 'Se estiver difícil agora, falar com alguém costuma ajudar. Escolha o que fizer mais sentido:',
  contatos: [
    {
      nome: 'CVV · Centro de Valorização da Vida',
      numero: '188',
      detalhe: 'Ligação gratuita, 24 horas, todos os dias. Também atende por chat em cvv.org.br.',
    },
    {
      nome: 'SAMU',
      numero: '192',
      detalhe: 'Para emergências médicas ou se você estiver em risco agora.',
    },
  ],
  orientacao:
    'Para acompanhamento contínuo e gratuito, procure um CAPS AD (Centro de Atenção Psicossocial Álcool e Drogas) ou a UBS mais perto de você. Em geral, o CAPS AD recebe sem encaminhamento.',
}

export const APOIO_HUMOR = {
  titulo: 'Seus últimos dias pareceram pesados',
  texto:
    'Notamos que o humor ficou baixo nos últimos check-ins. Isso costuma acontecer em fases de mudança e não diz nada de errado sobre você. Se quiser, conversar com alguém pode aliviar.',
  acao: 'Ver opções de apoio',
}

export const MENSAGENS_REFORCO = [
  'Mais um dia a favor de você.',
  'Você escolheu de novo. Isso conta.',
  'Um dia de cada vez, e hoje foi seu.',
  'Constância vale mais que perfeição.',
  'Seu corpo e sua mente agradecem esse dia.',
  'Mais um tijolo na sua nova rotina.',
  'Hoje você cuidou de você.',
  'Dia registrado. Você está construindo algo.',
  'Pequenas vitórias somam muito.',
  'Você apareceu para você hoje.',
]

export const MENSAGENS_MARCO = [
  'Um marco que é todo seu.',
  'Olha até onde você chegou.',
  'Esse número tem a sua história.',
]

export const RECAIDA = {
  botao: 'Tive uma recaída',
  titulo: 'Tudo bem. Respira.',
  texto:
    'Recaídas fazem parte do caminho de muita gente e, em geral, não apagam o que foi construído. O que importa agora é o próximo passo, sem culpa.',
  perguntaOpcional: 'Quer anotar o que aconteceu? (opcional)',
  placeholder: 'Ex.: estava num lugar onde todo mundo fumava, dia muito estressante…',
  privado: 'Só você vê essa anotação.',
  diasQueFicam: (dias: number) =>
    dias === 1 ? 'Você teve 1 dia. Isso não some.' : `Você teve ${dias} dias. Isso não some.`,
  totalQueFica: (total: number, melhor: number) =>
    `No total, são ${total} ${total === 1 ? 'dia' : 'dias'} sem fumar, e sua melhor sequência continua sendo ${melhor}.`,
  recomecar: 'Recomeçar agora',
  depois: 'Amanhã começa o dia 1 da nova sequência. Hoje, cuide de você.',
}

export const COMECAR = {
  titulo: 'Quando começou sua jornada?',
  texto:
    'Escolha o primeiro dia sem fumar. Se você já está sem fumar há um tempo, pode escolher uma data no passado: a contagem e as lições já vividas entram como concluídas.',
  aviso: 'Essa data só pode ser definida uma vez. Depois, a sequência só recomeça se você registrar uma recaída.',
}

export const CHECKIN = {
  passos: {
    semFumar: 'Hoje eu fiquei sem fumar',
    semFumarRetro: (rotulo: string) => `${rotulo} eu fiquei sem fumar`,
    humor: 'Como você está se sentindo?',
    fissura: 'Fissura hoje',
    fissuraApoio: 'De 0 (nenhuma) a 10 (muito forte). Não existe resposta certa.',
    sono: 'Como foi o sono de ontem?',
    ansiedade: 'Ansiedade ou irritação',
    gatilhos: 'Algum gatilho apareceu?',
    gatilhosApoio: 'Pode marcar mais de um, ou nenhum.',
    ajudou: 'O que te ajudou hoje?',
    ajudouApoio: 'Opcional. Uma frase curta já basta.',
  },
  humor: ['Muito mal', 'Mal', 'Mais ou menos', 'Bem', 'Muito bem'],
  sono: [
    { valor: 'ruim', rotulo: 'Ruim' },
    { valor: 'ok', rotulo: 'Ok' },
    { valor: 'bom', rotulo: 'Bom' },
  ],
  ansiedade: [
    { valor: 'baixa', rotulo: 'Baixa' },
    { valor: 'media', rotulo: 'Média' },
    { valor: 'alta', rotulo: 'Alta' },
  ],
  gatilhos: [
    { valor: 'estresse', rotulo: 'Estresse' },
    { valor: 'tedio', rotulo: 'Tédio' },
    { valor: 'social', rotulo: 'Social' },
    { valor: 'solidao', rotulo: 'Solidão' },
    { valor: 'insonia', rotulo: 'Insônia' },
    { valor: 'habito', rotulo: 'Hábito / horário' },
    { valor: 'outro', rotulo: 'Outro' },
  ],
}

export type TipoLicao = 'educacao' | 'respiracao' | 'gatilhos' | 'sono' | 'atividade' | 'atencao' | 'escrita'

export const ROTULO_TIPO: Record<TipoLicao, string> = {
  educacao: 'Entender',
  respiracao: 'Respiração',
  gatilhos: 'Plano para gatilhos',
  sono: 'Sono',
  atividade: 'Movimento',
  atencao: 'Atenção plena',
  escrita: 'Escrita guiada',
}

export type Licao = {
  id: string
  titulo: string
  tipo: TipoLicao
  educacao: string
  exercicio: string
  reflexao: string
}

export type Unidade = {
  numero: number
  titulo: string
  dias: string
  resumo: string
  licoes: Licao[]
}

export const UNIDADES: Unidade[] = [
  {
    numero: 1,
    titulo: 'Desligando o piloto automático',
    dias: 'Dias 1 a 3',
    resumo: 'O corpo começa a eliminar o THC e a rotina muda. É normal estranhar.',
    licoes: [
      {
        id: 'u1-1',
        titulo: 'O que acontece nos primeiros dias',
        tipo: 'educacao',
        educacao:
          'Nos primeiros dias, o corpo começa a eliminar o THC aos poucos. Muita gente sente a rotina "fora do lugar", porque o hábito ocupava horários e momentos específicos. Essa sensação costuma diminuir com o tempo.',
        exercicio:
          'Liste três momentos do dia em que você costumava fumar. Para cada um, escolha algo simples para fazer no lugar (beber água gelada, uma volta curta, mandar mensagem para alguém).',
        reflexao: 'Qual desses momentos parece mais desafiador para você?',
      },
      {
        id: 'u1-2',
        titulo: 'Respiração 4-6',
        tipo: 'respiracao',
        educacao:
          'Respirar mais devagar, com a expiração mais longa que a inspiração, costuma acalmar o corpo. É uma ferramenta que você pode usar em qualquer lugar, sem ninguém perceber.',
        exercicio: 'Inspire pelo nariz contando até 4. Solte o ar devagar pela boca contando até 6. Repita 6 vezes.',
        reflexao: 'Como seu corpo ficou depois dessas respirações?',
      },
      {
        id: 'u1-3',
        titulo: 'Seu porquê',
        tipo: 'escrita',
        educacao:
          'Ter claro o motivo da mudança costuma ajudar nos momentos difíceis. Não precisa ser um motivo grandioso: precisa ser verdadeiro para você.',
        exercicio: 'Escreva em uma frase por que você decidiu parar. Guarde num lugar que você vê todo dia.',
        reflexao: 'O que você espera sentir daqui a um mês?',
      },
    ],
  },
  {
    numero: 2,
    titulo: 'O pico da tempestade',
    dias: 'Dias 4 a 7',
    resumo:
      'Para muitas pessoas, os sintomas de abstinência costumam ser mais fortes entre o 2º e o 6º dia. Isso varia de pessoa para pessoa e tende a passar.',
    licoes: [
      {
        id: 'u2-1',
        titulo: 'Sintomas que costumam aparecer',
        tipo: 'educacao',
        educacao:
          'Irritabilidade, ansiedade, dificuldade para dormir, pouco apetite e sonhos intensos são relatos comuns nessa fase. Em geral, eles são temporários e indicam que o corpo está se reajustando.',
        exercicio: 'Marque mentalmente quais desses você tem sentido. Só reconhecer já ajuda a não se assustar com eles.',
        reflexao: 'Qual sintoma tem pesado mais? O que poderia aliviar um pouco?',
      },
      {
        id: 'u2-2',
        titulo: 'Surfando a fissura',
        tipo: 'respiracao',
        educacao:
          'A fissura costuma vir como uma onda: sobe, chega a um pico e desce, muitas vezes em poucos minutos. Em vez de lutar contra ela, dá para observá-la passar.',
        exercicio:
          'Na próxima fissura, perceba onde ela aparece no corpo. Dê uma nota de 0 a 10. Respire devagar e dê nota de novo depois de 3 minutos.',
        reflexao: 'A intensidade mudou depois de alguns minutos?',
      },
      {
        id: 'u2-3',
        titulo: 'Comer e beber água',
        tipo: 'atividade',
        educacao:
          'O apetite pode cair nos primeiros dias. Pequenas refeições ao longo do dia e água por perto costumam ajudar o corpo a atravessar essa fase com mais energia.',
        exercicio: 'Deixe uma garrafa de água à vista e planeje um lanche fácil para o horário em que você mais sente falta.',
        reflexao: 'Como está seu corpo hoje: cansado, agitado, leve?',
      },
      {
        id: 'u2-4',
        titulo: 'Primeira semana',
        tipo: 'escrita',
        educacao:
          'Completar a primeira semana é um marco importante. Você atravessou a fase que muitas pessoas descrevem como a mais intensa.',
        exercicio: 'Escreva três coisas que você fez nesta semana para se cuidar, por menores que sejam.',
        reflexao: 'O que essa semana mostrou sobre você?',
      },
    ],
  },
  {
    numero: 3,
    titulo: 'Reaprendendo a dormir',
    dias: 'Dias 8 a 14',
    resumo: 'O sono costuma ser um dos últimos aspectos a se ajustar. Paciência e rotina ajudam.',
    licoes: [
      {
        id: 'u3-1',
        titulo: 'Por que o sono muda',
        tipo: 'sono',
        educacao:
          'Sem a substância, muitas pessoas notam mais dificuldade para pegar no sono e sonhos mais vívidos. Em geral, isso faz parte do reajuste e costuma melhorar ao longo das semanas.',
        exercicio: 'Escolha um horário fixo para deitar e acordar nos próximos 7 dias, inclusive no fim de semana.',
        reflexao: 'Como têm sido suas noites?',
      },
      {
        id: 'u3-2',
        titulo: 'Higiene do sono',
        tipo: 'sono',
        educacao:
          'Pouca luz à noite, quarto mais fresco, menos cafeína à tarde e tela longe da cama costumam facilitar o sono.',
        exercicio: 'Hoje, deixe o celular fora da cama por 30 minutos antes de dormir.',
        reflexao: 'Qual mudança parece mais fácil de manter?',
      },
      {
        id: 'u3-3',
        titulo: 'Quando o sono não vem',
        tipo: 'atencao',
        educacao:
          'Ficar rolando na cama costuma aumentar a ansiedade. Levantar um pouco, fazer algo calmo com luz baixa e voltar quando o sono aparecer tende a ajudar.',
        exercicio: 'Faça uma varredura do corpo: dos pés à cabeça, perceba cada parte por alguns segundos e solte a tensão.',
        reflexao: 'Em que parte do corpo você guarda mais tensão?',
      },
      {
        id: 'u3-4',
        titulo: 'Duas semanas',
        tipo: 'escrita',
        educacao: 'Duas semanas de constância já mostram que uma nova rotina é possível.',
        exercicio: 'Escreva uma diferença, mesmo pequena, que você notou desde o primeiro dia.',
        reflexao: 'O que você quer manter daqui para frente?',
      },
    ],
  },
  {
    numero: 4,
    titulo: 'Receptores se reorganizando',
    dias: 'Dias 15 a 28',
    resumo:
      'Estudos sugerem que o sistema endocanabinoide tende a se reequilibrar ao longo de algumas semanas. O ritmo varia de pessoa para pessoa.',
    licoes: [
      {
        id: 'u4-1',
        titulo: 'O corpo se reequilibrando',
        tipo: 'educacao',
        educacao:
          'O uso frequente costuma diminuir a sensibilidade de alguns receptores no cérebro. Sem a substância, eles tendem a se reorganizar aos poucos, ao longo de semanas.',
        exercicio: 'Perceba hoje um momento em que você se sentiu um pouco mais presente ou disposto.',
        reflexao: 'O que mudou na sua disposição desde o começo?',
      },
      {
        id: 'u4-2',
        titulo: 'Mapa dos gatilhos',
        tipo: 'gatilhos',
        educacao:
          'Gatilhos são situações, lugares, pessoas ou sentimentos que despertam a vontade. Conhecer os seus ajuda a se preparar antes que eles apareçam.',
        exercicio: 'Escolha seu gatilho mais comum e escreva: onde acontece, quando, e com quem.',
        reflexao: 'Esse gatilho pode ser evitado, reduzido ou enfrentado com um plano?',
      },
      {
        id: 'u4-3',
        titulo: 'Plano se-então',
        tipo: 'gatilhos',
        educacao:
          'Planos no formato "se acontecer X, então eu faço Y" costumam funcionar melhor que intenções vagas, porque a decisão já está tomada antes do momento difícil.',
        exercicio: 'Complete: "Se eu sentir vontade depois do trabalho, então eu ___."',
        reflexao: 'Qual seria um plano B se o primeiro não funcionar?',
      },
      {
        id: 'u4-4',
        titulo: 'Movimento',
        tipo: 'atividade',
        educacao:
          'Atividade física costuma reduzir a ansiedade e melhorar o sono. Não precisa ser intensa: uma caminhada já conta.',
        exercicio: 'Caminhe por 10 minutos hoje, de preferência ao ar livre.',
        reflexao: 'Como você se sentiu durante e depois?',
      },
      {
        id: 'u4-5',
        titulo: 'Quatro semanas',
        tipo: 'escrita',
        educacao: 'Quase um mês. Muita coisa costuma começar a se assentar por aqui.',
        exercicio: 'Escreva uma carta curta para você do primeiro dia, contando como está agora.',
        reflexao: 'O que você diria para alguém que está começando hoje?',
      },
    ],
  },
  {
    numero: 5,
    titulo: 'Recompensa recalibrando',
    dias: 'Dias 29 a 60',
    resumo:
      'A resposta de prazer e motivação costuma voltar aos poucos. Coisas simples tendem a ganhar graça de novo.',
    licoes: [
      {
        id: 'u5-1',
        titulo: 'Prazer nas coisas simples',
        tipo: 'educacao',
        educacao:
          'O sistema de recompensa do cérebro costuma se recalibrar ao longo das semanas. Muita gente relata que música, comida e conversas voltam a ter mais graça.',
        exercicio: 'Faça hoje algo pequeno de que você gosta, sem pressa, prestando atenção na experiência.',
        reflexao: 'O que tem te dado prazer ultimamente?',
      },
      {
        id: 'u5-2',
        titulo: 'Tédio sem fuga',
        tipo: 'atencao',
        educacao:
          'O tédio é um gatilho comum. Aprender a ficar alguns minutos com ele, sem fugir, costuma diminuir o poder que ele tem.',
        exercicio: 'Fique 3 minutos sem celular, só observando o ambiente e a respiração.',
        reflexao: 'O que surgiu na sua mente nesses minutos?',
      },
      {
        id: 'u5-3',
        titulo: 'Novas recompensas',
        tipo: 'gatilhos',
        educacao:
          'Trocar a recompensa antiga por outras novas ajuda o cérebro a aprender caminhos diferentes para relaxar e se divertir.',
        exercicio: 'Liste cinco recompensas saudáveis que você poderia se dar no fim de um dia difícil.',
        reflexao: 'Qual delas você pode experimentar ainda esta semana?',
      },
      {
        id: 'u5-4',
        titulo: 'Situações sociais',
        tipo: 'gatilhos',
        educacao:
          'Estar com pessoas que fumam pode ser desafiador. Ter uma resposta pronta e uma forma de sair, se precisar, costuma dar segurança.',
        exercicio: 'Escreva uma frase curta para recusar ("hoje não, valeu") e um motivo para ir embora mais cedo, se precisar.',
        reflexao: 'Quem na sua vida apoia essa mudança?',
      },
      {
        id: 'u5-5',
        titulo: 'Dois meses',
        tipo: 'escrita',
        educacao: 'Perto de dois meses, a nova rotina costuma começar a parecer mais sua.',
        exercicio: 'Escreva o que você ganhou de tempo, energia ou dinheiro nesses dois meses.',
        reflexao: 'Do que você mais se orgulha até aqui?',
      },
    ],
  },
  {
    numero: 6,
    titulo: 'Mente mais clara',
    dias: 'Dias 61 a 90',
    resumo: 'Atenção, memória de trabalho e motivação costumam melhorar nessa fase, cada um no seu ritmo.',
    licoes: [
      {
        id: 'u6-1',
        titulo: 'Clareza mental',
        tipo: 'educacao',
        educacao:
          'Com o passar das semanas, muitas pessoas relatam mais facilidade para se concentrar, lembrar de coisas e manter a motivação.',
        exercicio: 'Escolha uma tarefa que você vinha adiando e dedique 15 minutos a ela, sem interrupções.',
        reflexao: 'Você tem notado diferença na sua concentração?',
      },
      {
        id: 'u6-2',
        titulo: 'Foco em blocos',
        tipo: 'atencao',
        educacao: 'Trabalhar em blocos curtos com pausas costuma ajudar a mente a manter o foco sem se cansar tanto.',
        exercicio: 'Faça 2 blocos de 20 minutos de foco com 5 minutos de pausa entre eles.',
        reflexao: 'Em que momento do dia sua mente funciona melhor?',
      },
      {
        id: 'u6-3',
        titulo: 'Quando a vontade volta do nada',
        tipo: 'respiracao',
        educacao:
          'Mesmo depois de semanas, a vontade pode aparecer de surpresa, às vezes ligada a lembranças. Isso é comum e não significa retrocesso.',
        exercicio: 'Repita a respiração 4-6 por 2 minutos e nomeie em voz baixa o que você está sentindo.',
        reflexao: 'Qual lembrança ou situação trouxe a vontade?',
      },
      {
        id: 'u6-4',
        titulo: 'Metas que cabem na semana',
        tipo: 'escrita',
        educacao:
          'Com mais clareza, é um bom momento para pequenas metas. Metas concretas e curtas costumam ser mais fáceis de cumprir.',
        exercicio: 'Escreva uma meta para os próximos 7 dias que dependa só de você.',
        reflexao: 'Como você vai saber que cumpriu?',
      },
      {
        id: 'u6-5',
        titulo: 'Memória e aprendizado',
        tipo: 'atividade',
        educacao: 'Aprender algo novo costuma ser um bom exercício para a mente e uma fonte de satisfação.',
        exercicio: 'Escolha algo pequeno para aprender esta semana: uma receita, um acorde, uma palavra nova por dia.',
        reflexao: 'O que você sempre quis aprender e foi deixando para depois?',
      },
      {
        id: 'u6-6',
        titulo: 'Energia ao longo do dia',
        tipo: 'atividade',
        educacao: 'Sono regular, movimento e refeições em horários parecidos costumam deixar a energia mais estável.',
        exercicio: 'Observe hoje em quais horários sua energia sobe e cai.',
        reflexao: 'O que você pode ajustar na sua rotina com base nisso?',
      },
      {
        id: 'u6-7',
        titulo: 'Quase 90 dias',
        tipo: 'escrita',
        educacao: 'Perto de três meses, o novo hábito costuma estar mais firme. Vale olhar para trás com carinho.',
        exercicio: 'Escreva três mudanças que você notou em você desde o início.',
        reflexao: 'Quem você está se tornando?',
      },
    ],
  },
  {
    numero: 7,
    titulo: 'Nova rotina, nova identidade',
    dias: 'Dias 91 a 180',
    resumo: 'A mudança deixa de ser só "parar" e passa a ser "quem eu sou agora".',
    licoes: [
      {
        id: 'u7-1',
        titulo: 'Identidade',
        tipo: 'escrita',
        educacao: 'Hábitos que duram costumam estar ligados a como a pessoa se vê. "Eu não fumo" pesa diferente de "estou tentando parar".',
        exercicio: 'Complete: "Eu sou uma pessoa que ___."',
        reflexao: 'Essa frase combina com você hoje?',
      },
      {
        id: 'u7-2',
        titulo: 'Excesso de confiança',
        tipo: 'gatilhos',
        educacao:
          'Depois de um tempo, pode surgir o pensamento "só uma vez não faz mal". Reconhecer esse pensamento como um gatilho ajuda a não cair nele.',
        exercicio: 'Escreva o que você responderia para esse pensamento se ele aparecesse.',
        reflexao: 'Em que situações esse pensamento poderia surgir?',
      },
      {
        id: 'u7-3',
        titulo: 'Estresse sem fuga',
        tipo: 'respiracao',
        educacao: 'O estresse continua existindo. Ter mais de uma forma de lidar com ele costuma deixar você mais firme.',
        exercicio: 'Escolha duas ferramentas para dias de estresse: uma rápida (respiração) e uma longa (caminhada, conversa).',
        reflexao: 'O que mais te estressa hoje, e o que está ao seu alcance mudar?',
      },
      {
        id: 'u7-4',
        titulo: 'Rede de apoio',
        tipo: 'atividade',
        educacao: 'Pessoas próximas costumam ser uma das maiores proteções. Contar com alguém de confiança faz diferença.',
        exercicio: 'Mande uma mensagem hoje para alguém que te faz bem.',
        reflexao: 'Com quem você pode contar num dia difícil?',
      },
      {
        id: 'u7-5',
        titulo: 'Cinco meses',
        tipo: 'escrita',
        educacao: 'Cinco meses de caminho. Cada dia somou.',
        exercicio: 'Liste o que você faz hoje no tempo que antes era do hábito.',
        reflexao: 'O que você gostaria de começar a seguir?',
      },
      {
        id: 'u7-6',
        titulo: 'Corpo em movimento',
        tipo: 'atividade',
        educacao: 'Atividade física regular costuma apoiar o humor e o sono no longo prazo.',
        exercicio: 'Escolha uma atividade física que você goste e marque um horário fixo na semana.',
        reflexao: 'Que tipo de movimento te dá prazer?',
      },
      {
        id: 'u7-7',
        titulo: 'Seis meses',
        tipo: 'escrita',
        educacao: 'Meio ano. Um marco que muita gente celebra como virada.',
        exercicio: 'Escreva como você celebraria essa conquista de um jeito saudável.',
        reflexao: 'O que mais mudou na sua vida nesses seis meses?',
      },
    ],
  },
  {
    numero: 8,
    titulo: 'Consolidando',
    dias: 'Dias 181 a 364',
    resumo: 'O hábito novo se firma. É hora de cuidar do que foi construído.',
    licoes: [
      {
        id: 'u8-1',
        titulo: 'Manutenção',
        tipo: 'educacao',
        educacao: 'Manter costuma pedir menos esforço que começar, mas ainda pede atenção, especialmente em fases de mudança na vida.',
        exercicio: 'Liste as situações de risco que ainda existem para você.',
        reflexao: 'Como você tem se protegido delas?',
      },
      {
        id: 'u8-2',
        titulo: 'Datas e lugares',
        tipo: 'gatilhos',
        educacao: 'Férias, festas e datas especiais podem trazer gatilhos antigos. Planejar antes costuma ajudar.',
        exercicio: 'Pense no próximo evento especial e faça um plano se-então para ele.',
        reflexao: 'Quem poderia estar com você nesse momento?',
      },
      {
        id: 'u8-3',
        titulo: 'Atenção ao presente',
        tipo: 'atencao',
        educacao: 'Práticas curtas de atenção plena costumam reduzir a reatividade a pensamentos e emoções.',
        exercicio: 'Durante uma refeição hoje, preste atenção total no sabor, na textura e no cheiro.',
        reflexao: 'O que você percebeu que normalmente passaria despercebido?',
      },
      {
        id: 'u8-4',
        titulo: 'Nove meses',
        tipo: 'escrita',
        educacao: 'Nove meses de cuidado contínuo.',
        exercicio: 'Escreva um agradecimento para você mesmo.',
        reflexao: 'Que conselho você daria para o seu eu de nove meses atrás?',
      },
      {
        id: 'u8-5',
        titulo: 'Sonhos maiores',
        tipo: 'escrita',
        educacao: 'Com energia e clareza mais estáveis, muita gente se sente pronta para planos maiores.',
        exercicio: 'Escreva um sonho para os próximos 12 meses e o primeiro passo para ele.',
        reflexao: 'O que te impede de dar esse primeiro passo?',
      },
      {
        id: 'u8-6',
        titulo: 'Quase um ano',
        tipo: 'escrita',
        educacao: 'Falta pouco para um ano. Olhe para o caminho inteiro.',
        exercicio: 'Releia as anotações do seu caderno de check-ins e escolha uma que te marcou.',
        reflexao: 'Como você descreveria esse ano em uma palavra?',
      },
    ],
  },
  {
    numero: 9,
    titulo: 'Liberdade',
    dias: '365 dias ou mais',
    resumo: 'Um ano ou mais. A jornada continua, agora com mais leveza.',
    licoes: [
      {
        id: 'u9-1',
        titulo: 'Um ano',
        tipo: 'escrita',
        educacao: 'Um ano inteiro. Um marco enorme, construído um dia de cada vez.',
        exercicio: 'Escreva o que esse ano significou para você.',
        reflexao: 'O que você quer levar para o próximo?',
      },
      {
        id: 'u9-2',
        titulo: 'Cuidando do longo prazo',
        tipo: 'educacao',
        educacao: 'No longo prazo, o que costuma proteger é manter a rotina de cuidado e reconhecer cedo os sinais de risco.',
        exercicio: 'Escolha um sinal de alerta pessoal e o que você faria se ele aparecesse.',
        reflexao: 'Qual hábito de cuidado você quer manter para sempre?',
      },
      {
        id: 'u9-3',
        titulo: 'Inspirar sem pressionar',
        tipo: 'atividade',
        educacao: 'Sua história pode ajudar outras pessoas, se e quando você quiser compartilhar.',
        exercicio: 'Pense em como você apoiaria alguém que está começando, sem julgamento.',
        reflexao: 'O que você gostaria de ter ouvido no seu primeiro dia?',
      },
      {
        id: 'u9-4',
        titulo: 'Sua jornada',
        tipo: 'escrita',
        educacao: 'A jornada é sua e continua. Cada novo dia segue contando.',
        exercicio: 'Escreva uma frase para ler sempre que precisar lembrar de onde você veio.',
        reflexao: 'Quem é você hoje?',
      },
    ],
  },
]

export const LICOES_POR_ID: Record<string, { licao: Licao; unidade: Unidade }> = Object.fromEntries(
  UNIDADES.flatMap((u) => u.licoes.map((l) => [l.id, { licao: l, unidade: u }])),
)

/**
 * Quadro "Dois caminhos": lembrete fixo dos dois lados, o que se está evitando e para onde se quer ir.
 * Linguagem cautelosa de propósito: descreve tendências e riscos, sem prever o futuro e sem culpa.
 * Revisar com um profissional de saúde junto com o resto deste arquivo.
 */
export const DOIS_CAMINHOS = {
  olho: 'Lembrete',
  titulo: 'Os dois lados da moeda',
  apoio: 'As mesmas escolhas de hoje, daqui a uns meses. Varia de pessoa para pessoa, mas o rumo costuma ser parecido.',
  evitando: {
    rotulo: 'O que eu estou evitando',
    titulo: 'Se eu continuar no uso e na sobrecarga',
    resultado:
      'Um desgaste que vai se acumulando: energia, dinheiro, relações e planos ficam em segundo plano, e o alívio de hoje vira o peso de amanhã.',
    frase: 'Sobrecarga + uso contínuo costuma levar ao desgaste.',
    tendencias: ['Disciplina', 'Energia', 'Dinheiro', 'Relações', 'Liberdade'],
    tendenciaRotulo: 'Tende a cair',
  },
  querendo: {
    rotulo: 'Para onde eu quero ir',
    titulo: 'Se eu mantiver a sobriedade estruturada',
    resultado:
      'Viver com mais energia, clareza e constância, construindo o que eu quero com o corpo e a mente alinhados.',
    frase: 'Descanso de verdade + constância costuma levar a mais liberdade.',
    tendencias: ['Disciplina', 'Energia', 'Dinheiro', 'Relações', 'Liberdade'],
    tendenciaRotulo: 'Tende a subir',
  },
  areas: [
    {
      id: 'sensacao',
      nome: 'A sensação do uso',
      evitando:
        'O alívio dura pouco e costuma cobrar depois: mais irritação, ansiedade e cabeça pesada. Com o tempo, a mesma dose tende a aliviar cada vez menos.',
      querendo:
        'O corpo vai se reequilibrando. O prazer nas coisas simples costuma voltar e a cabeça fica mais leve, sem depender de nada para relaxar.',
    },
    {
      id: 'foco',
      nome: 'Foco e execução',
      evitando:
        'O foco costuma ficar picado e o que importa vai sendo adiado. Muito movimento, pouco resultado, e a decisão difícil fica para amanhã.',
      querendo:
        'A atenção tende a ficar mais firme. Fica mais fácil começar, manter o ritmo e terminar o que importa, inclusive os projetos da TheusVision.',
    },
    {
      id: 'casa',
      nome: 'Casa e ambiente',
      evitando:
        'Quando tudo pesa, a casa e a rotina costumam se desorganizar, e a bagunça aumenta o cansaço mental.',
      querendo:
        'Um ambiente mais simples e em ordem costuma ajudar a mente a descansar. A casa vira lugar de recarregar.',
    },
    {
      id: 'burnout',
      nome: 'Burnout e emoções',
      evitando:
        'Sobrecarga somada ao uso como fuga pode alimentar um ciclo: cansaço, fuga, culpa, mais cansaço. Isso pode evoluir para burnout, ansiedade e desânimo.',
      querendo:
        'Com descanso de verdade e rotina, a energia tende a voltar. Os problemas continuam existindo, mas passam a parecer mais resolvíveis.',
    },
  ],
  /**
   * Versos do topo: "onde você estava" (passado) e "para onde você está indo". Trocam a cada 10 segundos.
   * Mantenha curtos, sem culpa e sem prometer nada.
   */
  lembreteDe: 'Onde você estava',
  lembretePara: 'Para onde você está indo',
  lembreteLink: 'Ver o porquê',
  lembretes: [
    { de: 'Alívio rápido que virava peso no dia seguinte.', para: 'Energia e clareza para construir o que você quer.' },
    { de: 'Cabeça picada, tarefa adiada.', para: 'Foco firme: começar e terminar.' },
    { de: 'Fugir do cansaço só adiava o cansaço.', para: 'Descanso de verdade, energia de volta.' },
    { de: 'Dias no automático.', para: 'Dias por escolha.' },
    { de: 'Sobrecarga + fuga: ciclo de desgaste.', para: 'Rotina + descanso: constância.' },
    { de: 'A bagunça de fora virava bagunça de dentro.', para: 'Casa em ordem, mente leve.' },
    { de: 'Um prazer que cobrava depois.', para: 'Prazer nas pequenas conquistas.' },
    { de: 'Energia e dinheiro escorrendo.', para: 'Energia e dinheiro a favor dos seus projetos.' },
    { de: 'A decisão difícil ficava para amanhã.', para: 'O próximo passo, feito hoje.' },
    { de: 'Desgaste se acumulando em silêncio.', para: 'Limites e descanso de verdade.' },
  ],
  fecho: 'Dois caminhos. Uma escolha, que eu refaço todo dia.',
  semCulpa: 'Não é para me culpar. É para lembrar do que eu estou escolhendo hoje.',
  verTudo: 'Ver a comparação completa',
  esconder: 'Fechar a comparação',
}

/**
 * "Onde você está": fases da recuperação pelo tempo sem usar. Estimativa baseada em literatura, não promessa:
 * cada pessoa tem o seu ritmo. Linguagem de tendência, sem diagnóstico. Revisar com um profissional junto com o resto.
 */
export type Fase = {
  id: string
  nome: string
  periodo: string
  /** Primeiro e último dia da fase (ultimoDia null = sem fim). */
  de: number
  ate: number | null
  normal: string
  foco: string
  mais: string[]
}

export const FASES: Fase[] = [
  {
    id: 'atravessar',
    nome: 'Atravessando',
    periodo: 'Semanas 1 a 4',
    de: 1,
    ate: 28,
    normal: 'Irritação, sono e apetite alterados e fissura mais forte são esperados. Na maior parte, isso costuma ceder em 2 a 4 semanas.',
    foco: 'Só atravessar. Dormir, comer e se mexer já contam.',
    mais: [
      'Sonhos vívidos e sono picado são comuns e tendem a passar.',
      'Não é hora de planos gigantes. Um dia de cada vez.',
      'Se estiver pesado demais, o botão de ajuda está sempre aqui.',
    ],
  },
  {
    id: 'clareza',
    nome: 'Clareza voltando',
    periodo: 'Semanas 5 a 8',
    de: 29,
    ate: 56,
    normal: 'A clareza volta e a ansiedade costuma baixar, mas a vontade de agir ainda vem devagar: calma sem tração. Isso não é perda de quem você é.',
    foco: 'Estrutura mínima e pequenos ciclos fechados todos os dias.',
    mais: [
      'O sistema que dá o "vai lá" é o que mais demora a voltar, e ele responde à prática.',
      'Tarefas pequenas e concluídas valem mais do que grandes e pela metade.',
      'Cobrar o ritmo de antes só aumenta o peso. Sua régua é você de 30 dias atrás.',
    ],
  },
  {
    id: 'recalibrar',
    nome: 'Recalibrando',
    periodo: 'Meses 2 a 6',
    de: 57,
    ate: 180,
    normal: 'O sistema de recompensa vai se ajustando conforme você age. Os hábitos começam a ficar automáticos (em média uns 66 dias, variando muito de pessoa para pessoa).',
    foco: 'Constância e progressão gradual, aumentando a carga aos poucos.',
    mais: [
      'Subir a exigência no máximo 10 a 20% por semana, só depois de cumprir a atual.',
      'Semana ruim não derruba o plano: repita a semana, não recomece do zero.',
      'Cuidado com o "desespero de acelerar": planos grandes demais acabam em vergonha e fuga.',
    ],
  },
  {
    id: 'consolidar',
    nome: 'Consolidando',
    periodo: 'A partir de 6 meses',
    de: 181,
    ate: null,
    normal: 'Você sustenta mais carga com mais estabilidade. Os riscos agora são o excesso de confiança ("já controlo") e voltar ao ritmo que gerou o desgaste.',
    foco: 'Manutenção, e atenção para não voltar ao overdrive.',
    mais: [
      'Sinais de alerta: trabalhar de noite com frequência, pular refeição ou treino, irritação constante.',
      'Dois ou mais sinais na mesma semana: volte à carga anterior por sete dias.',
      'Deslize é evento, não identidade. Volta no próximo bloco.',
    ],
  },
]

export const ONDE_ESTOU = {
  rotulo: 'Onde você está',
  normal: 'O que é normal agora',
  foco: 'Foco desta fase',
  verMais: 'Ver mais',
  verMenos: 'Ver menos',
  proxima: (dias: number, nome: string) => `${dias === 1 ? 'falta 1 dia' : `faltam ${dias} dias`} para ${nome}`,
  ultima: 'Fase de manutenção: o foco é seguir firme.',
  aviso: 'É uma estimativa baseada em estudos, não uma promessa. Cada pessoa tem o seu ritmo, e o que você faz em cada fase muda a velocidade da seguinte.',
}

/** Frases-âncora curtas que entram na faixa do topo, misturadas aos pares "onde você estava → para onde está indo". */
export const FRASES_ANCORA = [
  { situacao: 'Quando a vontade apertar', frase: 'A onda sobe e desce. Eu rodo o filme até o fim.' },
  { situacao: 'Quando o dia começar mal', frase: 'O sentimento escolhe a versão do dia, não cancela o dia.' },
  { situacao: 'Quando escorregar', frase: 'Deslize é evento, não identidade. Volto no próximo bloco.' },
  { situacao: 'Quando se comparar com o passado', frase: 'Minha régua é eu de 30 dias atrás, não o de antes.' },
  { situacao: 'Quando quiser acelerar tudo', frase: 'Progressão de carga. Constância ganha de intensidade.' },
  { situacao: 'Quando travar para começar', frase: 'Qual é a menor ação física que eu consigo fazer agora?' },
  { situacao: 'Quando der vontade de fugir', frase: 'Do que eu estou fugindo agora?' },
  { situacao: 'Quando pintar um "só hoje"', frase: 'Isso é um pensamento de permissão. Eu nomeio e deixo passar.' },
  { situacao: 'Quando for decidir algo importante', frase: 'Fome, raiva, solidão ou cansaço? Então espero 24 horas.' },
  { situacao: 'Quando o dia for muito bom', frase: 'Paro no horário. O dia bom também tem fim.' },
  { situacao: 'Quando quiser desistir do dia', frase: 'Imprevisto muda o plano, não cancela o dia.' },
  { situacao: 'Sobre quem eu sou', frase: 'Identidade não se pensa. Se coleciona como prova.' },
]

/**
 * "O que a ciência diz": achados de pesquisa sobre parar a cannabis e sobre hábito, sono e cérebro.
 * Texto resumido com a fonte entre parênteses. Linguagem de tendência (estudos com grupos, não promessa individual).
 * Revisar com um profissional junto com o resto deste arquivo.
 */
export const FRASES_CIENCIA = [
  {
    frase: 'Os receptores CB1, que diminuem com o uso diário, voltaram ao nível normal após cerca de 4 semanas sem usar.',
    fonte: 'Hirvonen et al., 2012 · Molecular Psychiatry',
  },
  {
    frase: 'A recuperação dos receptores CB1 começa rápido: já aparece nos primeiros 2 dias sem usar.',
    fonte: "D'Souza et al., 2016 · Biological Psychiatry: CNNI",
  },
  {
    frase: 'Numa revisão de 69 estudos, depois de mais de 72 horas sem uso os prejuízos de memória e atenção ficaram pequenos ou sumiram.',
    fonte: 'Scott et al., 2018 · JAMA Psychiatry',
  },
  {
    frase: 'Efeitos cognitivos residuais do uso não apareceram mais em quem estava sem usar há cerca de 25 dias ou mais.',
    fonte: 'Schreiner & Dunn, 2012 · Experimental and Clinical Psychopharmacology',
  },
  {
    frase: 'A abstinência costuma começar em 1 a 3 dias, ter pico na primeira semana e ceder em 1 a 2 semanas. O sono pode levar mais.',
    fonte: 'Budney et al., 2004 · American Journal of Psychiatry',
  },
  {
    frase: 'Em usuários frequentes, a menor produção de dopamina acompanhou o uso, o que ajuda a explicar a apatia. O sistema responde ao que você faz.',
    fonte: 'Bloomfield et al., 2014 · Biological Psychiatry',
  },
  {
    frase: 'A fissura sobe, chega a um pico e desce, em geral em minutos. Cada onda atravessada sem usar enfraquece a associação.',
    fonte: 'Bowen, Chawla & Marlatt, 2010 · prevenção de recaída',
  },
  {
    frase: 'Correr aumentou a anandamida, um canabinoide produzido pelo próprio corpo, ligado à sensação boa depois do exercício.',
    fonte: 'Raichlen et al., 2012 · Journal of Experimental Biology',
  },
  {
    frase: 'Uma noite sem dormir deixou a amígdala cerca de 60% mais reativa a estímulos negativos. Dormir bem protege suas decisões.',
    fonte: 'Yoo et al., 2007 · Current Biology',
  },
  {
    frase: 'Em média, um hábito novo levou 66 dias para ficar automático, variando de 18 a 254 dias.',
    fonte: 'Lally et al., 2010 · European Journal of Social Psychology',
  },
  {
    frase: 'A passividade é a resposta padrão ao estresse longo. O que se aprende é o controle: perceber que a sua ação teve efeito.',
    fonte: 'Maier & Seligman, 2016 · Psychological Review',
  },
  {
    frase: 'Planos no formato "quando X acontecer, eu faço Y" tiveram efeito médio a grande em alcançar metas.',
    fonte: 'Gollwitzer & Sheeran, 2006 · Advances in Experimental Social Psychology',
  },
  {
    frase: 'Neurônios que disparam juntos se conectam: o que você repete, o cérebro fortalece.',
    fonte: 'Princípio de Hebb, 1949',
  },
]
