/** Os processos da TheusVision (caixa de ferramentas), do jeito dos manuais de parede. */
export type Passo = { t: string; d: string }
export type Processo = {
  id: string
  numero: string
  nome: string
  resumo: string
  servico: string
  final: string
  regra: string
  passos: Passo[]
}

export const PROCESSOS: Processo[] = [
  {
    id: 'video-ia',
    numero: '002',
    nome: 'Criação de vídeo com IA',
    servico: 'Vídeo com IA para comércios locais, sem gravação no local',
    resumo: 'Do logo do cliente ao vídeo pronto para aprovação.',
    final: 'Vídeo pronto',
    regra: 'Toda ambientação precisa ter os três elementos juntos: logo do comércio, fundo do comércio e a pessoa de referência. Sem os três, refaz.',
    passos: [
      { t: 'Reunir referências', d: 'Logo do comércio e foto da pessoa que vai aparecer. Se tiver imagem do ambiente do local, separa também.' },
      { t: 'Explicar o contexto no Claude', d: 'Anexa as referências e explica: quero essa pessoa nas ambientações que eu escolher. Se tiver referência do local, anexa junto.' },
      { t: 'Gerar e aprovar as ambientações', d: 'Gera os cenários com logo, fundo do comércio e a pessoa juntos. Só avança depois de aprovado.' },
      { t: 'Criar ou buscar o roteiro', d: 'Se não tiver roteiro pronto, cria um. Uma fala por cena: sem isso, a próxima etapa não roda.' },
      { t: 'Gerar cena por cena', d: 'Cada cena é uma geração: imagem da ambientação aprovada e prompt com a fala daquela cena.' },
      { t: 'Editar no CapCut', d: 'Corta os silêncios, coloca legenda, ajusta contraste, adiciona efeito se precisar e áudio de fundo.' },
      { t: 'Exportar e enviar', d: 'Exporta, sobe no Drive, copia o link e envia para a pessoa aprovar.' },
    ],
  },
  {
    id: 'edicao-video',
    numero: '004',
    nome: 'Edição de vídeo comercial',
    servico: 'Edição de vídeo comercial gravado',
    resumo: 'Do roteiro ao vídeo exportado, sem depender de lembrar a ordem certa.',
    final: 'Vídeo pronto',
    regra: 'Nada é gravado sem referência definida. Referência primeiro, sempre: é ela que evita retrabalho em todas as etapas seguintes.',
    passos: [
      { t: 'Definir referência', d: 'Antes de qualquer coisa, define a referência visual da gravação. Sem referência, nada é gravado.' },
      { t: 'Roteiro e trilha', d: 'Define o roteiro da gravação e já escolhe a trilha sonora de fundo que vai usar no vídeo final.' },
      { t: 'Gravar e organizar as cenas', d: 'Grava as cenas seguindo a referência, sobe tudo no Drive e baixa no PC para a edição.' },
      { t: 'Montar, colocar efeitos e fechar o corte', d: 'Importa as cenas no CapCut, organiza a timeline, coloca os efeitos e fecha o corte final antes de tratar áudio ou cor.' },
      { t: 'Limpar o áudio', d: 'Remove silêncios, isola a voz e reduz o ruído de fundo.' },
      { t: 'Cor', d: 'Ajusta contraste e saturação de todas as cenas.' },
      { t: 'Gerar legendas', d: 'Gera e revisa as legendas em cima do corte já fechado, com áudio limpo e cor já ajustada.' },
      { t: 'Exportar', d: 'Insere a trilha do passo 2 com volume baixo por trás da voz e exporta o vídeo final.' },
    ],
  },
  {
    id: 'site',
    numero: '005',
    nome: 'Criação de sites',
    servico: 'Sites no ar, do link de referência ao domínio próprio',
    resumo: 'Do link de referência ao site no ar, sem travar em decisão de código.',
    final: 'Site online',
    regra: 'GitHub e o host ficam sincronizados desde o passo 5. Nenhuma alteração final sobe sem passar por commit: é isso que garante o deploy automático.',
    passos: [
      { t: 'Reunir referência e copy', d: 'Pega o link do site de referência e a copy do site que vai criar.' },
      { t: 'Pedir o prompt pro Claude', d: 'Com base na referência e na copy, pede para o Claude montar o prompt para criar o site.' },
      { t: 'Gerar o site em Artefato e baixar', d: 'Roda o prompt, gera o site como Artefato e baixa o código.' },
      { t: 'Organizar o repositório', d: 'Coloca o código na pasta do PC e sobe no GitHub.' },
      { t: 'Conectar o repositório ao site', d: 'Cria o site no host conectado ao repositório do GitHub: todo commit passa a puxar o deploy automático.' },
      { t: 'Fazer os ajustes finais com o Claude Code', d: 'Revisa e ajusta o que precisar direto no código, localmente, usando o Claude Code, antes de subir.' },
      { t: 'Colocar no ar', d: 'Sobe as alterações finais: o commit dispara o deploy e o site fica online.' },
      { t: 'Domínio próprio (opcional)', d: 'Passo opcional: configura o domínio próprio do cliente.' },
    ],
  },
  {
    id: 'relatorio',
    numero: '006',
    nome: 'Relatório de campanha de tráfego',
    servico: 'Gestão de tráfego pago com relatório realista',
    resumo: 'Da métrica bruta ao PDF na mão do cliente, com tom realista, não inflado.',
    final: 'Relatório entregue',
    regra: 'Nunca trata um número ruim como se fosse bom. Contextualiza a causa e mostra o plano para melhorar no próximo período.',
    passos: [
      { t: 'Exportar métricas da campanha', d: 'Puxa gasto, conversas e período direto do gerenciador de anúncios.' },
      { t: 'Cruzar leads com a base de clientes', d: 'Bate telefone contra os ativos para achar quem converteu de verdade, incluindo quem fechou por outro canal, não só pelo link direto.' },
      { t: 'Calcular as métricas principais', d: 'Custo por conversa, taxa de conversão e custo por matrícula.' },
      { t: 'Escrever com tom realista', d: 'Contextualiza o que deu errado (teste, bug, saldo). Número fraco não vira resultado positivo no texto.' },
      { t: 'Enviar pro cliente', d: 'Gera o PDF e envia.' },
    ],
  },
  {
    id: 'agente-ia',
    numero: '007',
    nome: 'Agente de IA para atendimento',
    servico: 'Agente de IA de atendimento, atualizado a cada campanha',
    resumo: 'Da promoção nova do mês até o teste de fechamento, sem quebrar o que já funciona.',
    final: 'Agente atualizado',
    regra: 'Nunca salva sem testar o fechamento depois. Uma promoção errada no prompt vira erro de venda com o cliente real.',
    passos: [
      { t: 'Pegar o prompt atual', d: 'Recupera o prompt do agente que está em produção agora.' },
      { t: 'Pedir pro Claude analisar', d: 'Anexa o prompt atual e pede para o Claude entender a estrutura antes de qualquer mudança.' },
      { t: 'Explicar a mudança', d: 'Fala qual plano precisa alterar e qual é a nova promoção do mês.' },
      { t: 'Pedir a resposta em formato de instrução', d: 'O Claude devolve a alteração já pronta para aplicar, sem precisar reescrever nada.' },
      { t: 'Aplicar no Builder e salvar', d: 'Aplica a instrução no Builder do agente e salva.' },
      { t: 'Testar o fechamento do plano', d: 'Simula a conversa até o fechamento pela nova campanha, garantindo que o agente aplica a promoção certa.' },
    ],
  },
]
export const PROCESSO: Record<string, Processo> = Object.fromEntries(PROCESSOS.map((p) => [p.id, p]))
