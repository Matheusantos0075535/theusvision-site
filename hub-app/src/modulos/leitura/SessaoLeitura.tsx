import { Pause, Play, RotateCcw, Star } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BarraProgresso } from '../../components/compartilhado/BarraProgresso'
import { Celebracao, type DadosCelebracao } from '../../components/compartilhado/Celebracao'
import { Confete } from '../../components/compartilhado/Confete'
import { sortear, tocarSom, vibrar } from '../../components/compartilhado/efeitos'
import { Opcoes, PassoAPasso } from '../../components/compartilhado/PassoAPasso'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { diferencaDias, somarDias } from '../../lib/tempo'
import { useMovimentoReduzido } from '../../lib/useMidia'
import { Capa } from './Capa'
import { useLeitura, type EstadoLeitura, type Livro } from './dados'

type Resultado = {
  novo: boolean
  retroativo: boolean
  dia_confirmado: boolean
  antes: number
  depois: number
  meta_anterior: number
  proxima_meta: number
  eh_marco: boolean
  selo_novo: number | null
  selo_paginas: number | null
  livro: {
    id: string
    titulo: string
    pagina_antes: number
    pagina_atual: number
    total: number
    concluido_agora: boolean
    capitulo_atual: string | null
    iniciado_em: string
  }
  capitulos_concluidos: { capitulo_id?: string; parte?: number; rotulo: string }[]
  estado: EstadoLeitura
}

const MENSAGENS = [
  'Mais uma página da sua história.',
  'Constância vence volume.',
  'Você abriu o livro hoje. Isso é o hábito.',
  'Um pouco por dia leva longe.',
  'Leitura registrada. Sua mente agradece.',
  'Hoje você escolheu ler. Isso conta.',
]
const MENSAGENS_EXTRA = ['Leu de novo hoje? Isso é amor por livros.', 'Mais páginas no mesmo dia. Belo ritmo.']

/** Fluxo completo: registro → celebração → fixação (capítulo concluído) → conclusão do livro. */
export function SessaoLeitura({ livroInicial, aoFechar }: { livroInicial?: string; aoFechar: () => void }) {
  const { livros, estado, config, recarregar } = useLeitura()
  const lendo = useMemo(
    () => (livros ?? []).filter((l) => l.estado === 'lendo' || l.estado === 'pausado' || l.estado === 'quero_ler'),
    [livros],
  )
  const [etapa, setEtapa] = useState<'registro' | 'celebracao' | 'fixacao' | 'conclusao'>('registro')
  const [resultado, setResultado] = useState<Resultado | null>(null)

  if (etapa === 'registro' || !resultado) {
    return (
      <Registro
        livros={lendo}
        hoje={estado?.hoje ?? ''}
        livroInicial={livroInicial}
        aoFechar={aoFechar}
        aoConcluir={(r) => {
          setResultado(r)
          if (!r.novo) {
            void recarregar()
            aoFechar()
            return
          }
          setEtapa('celebracao')
        }}
      />
    )
  }

  const proxima = () => {
    if (etapa === 'celebracao' && resultado.capitulos_concluidos.length) return setEtapa('fixacao')
    if ((etapa === 'celebracao' || etapa === 'fixacao') && resultado.livro.concluido_agora) return setEtapa('conclusao')
    void recarregar()
    aoFechar()
  }

  if (etapa === 'celebracao') {
    const l = resultado.livro
    const faltam = l.total - l.pagina_atual
    const dados: DadosCelebracao = {
      de: resultado.antes,
      para: resultado.depois,
      rotuloNumero: resultado.depois === 1 ? 'dia de leitura seguido' : 'dias de leitura seguidos',
      metaAnterior: resultado.meta_anterior,
      proximaMeta: resultado.proxima_meta,
      mensagem: sortear(resultado.dia_confirmado || resultado.antes === 0 ? MENSAGENS : MENSAGENS_EXTRA),
      marco: resultado.eh_marco,
      seloNovo: resultado.selo_novo ?? resultado.selo_paginas,
      rotuloSelo: (n) => (resultado.selo_novo ? `${n} dias seguidos` : `${n.toLocaleString('pt-BR')} páginas lidas`),
      extra: <ProgressoLivro titulo={l.titulo} antes={l.pagina_antes} depois={l.pagina_atual} total={l.total} capitulo={l.capitulo_atual} faltam={faltam} />,
      rotuloContinuar: resultado.capitulos_concluidos.length || l.concluido_agora ? 'Continuar' : 'Fechar',
    }
    return <Celebracao dados={dados} som={config.som} vibracao={config.vibracao} aoFechar={proxima} />
  }

  if (etapa === 'fixacao') {
    return <Fixacao livroId={resultado.livro.id} capitulos={resultado.capitulos_concluidos} aoFechar={proxima} />
  }

  const livro = livros?.find((x) => x.id === resultado.livro.id)
  return (
    <ConclusaoLivro
      livro={livro}
      titulo={resultado.livro.titulo}
      dias={Math.max(1, diferencaDias(estado?.hoje ?? resultado.livro.iniciado_em, resultado.livro.iniciado_em) + 1)}
      som={config.som}
      vibracao={config.vibracao}
      aoFechar={() => {
        void recarregar()
        aoFechar()
      }}
    />
  )
}

function ProgressoLivro({
  titulo,
  antes,
  depois,
  total,
  capitulo,
  faltam,
}: {
  titulo: string
  antes: number
  depois: number
  total: number
  capitulo: string | null
  faltam: number
}) {
  const [fracao, setFracao] = useState(antes / total)
  useEffect(() => {
    const t = window.setTimeout(() => setFracao(depois / total), 150)
    return () => clearTimeout(t)
  }, [depois, total])
  return (
    <div className="le-cel-livro">
      <div className="le-cel-livro-topo">
        <b>{titulo}</b>
        <span>{Math.round((depois * 100) / total)}%</span>
      </div>
      <BarraProgresso fracao={fracao} rotulo={`Progresso em ${titulo}`} />
      <small>
        {faltam === 0 ? 'Última página!' : `${capitulo ? `${capitulo} · ` : ''}faltam ${faltam} ${faltam === 1 ? 'página' : 'páginas'}`}
      </small>
    </div>
  )
}

function Registro({
  livros,
  hoje,
  livroInicial,
  aoFechar,
  aoConcluir,
}: {
  livros: Livro[]
  hoje: string
  livroInicial?: string
  aoFechar: () => void
  aoConcluir: (r: Resultado) => void
}) {
  const idSessao = useRef(crypto.randomUUID()) // mesmo id em novas tentativas: o banco não duplica
  const [passo, setPasso] = useState(livroInicial ? 1 : 0)
  const [livroId, setLivroId] = useState<string | null>(livroInicial ?? (livros.length === 1 ? livros[0].id : null))
  const [diasAtras, setDiasAtras] = useState(0)
  const [modo, setModo] = useState<'pagina' | 'minutos'>('pagina')
  const [pagina, setPagina] = useState('')
  const [minutos, setMinutos] = useState('')
  const [foco, setFoco] = useState<number | null>(null)
  const [aprendizado, setAprendizado] = useState('')
  const [trechoPag, setTrechoPag] = useState('')
  const [trecho, setTrecho] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const livro = livros.find((l) => l.id === livroId) ?? null
  const paginaNum = pagina === '' ? null : Number(pagina)
  const minutosNum = minutos === '' ? null : Number(minutos)
  const valorOk =
    modo === 'pagina'
      ? paginaNum !== null && livro !== null && paginaNum > livro.pagina_atual && paginaNum <= livro.total_paginas
      : minutosNum !== null && minutosNum > 0 && minutosNum <= 1440

  async function enviar() {
    if (!livro) return
    setEnviando(true)
    setErro(null)
    const { data, error } = await supabase.rpc('leit_registrar_sessao', {
      p_id: idSessao.current,
      p_livro: livro.id,
      p_dia: somarDias(hoje, -diasAtras),
      p_pagina_fim: modo === 'pagina' ? paginaNum : null,
      p_minutos: modo === 'minutos' ? minutosNum : null,
      p_foco: foco,
      p_aprendizado: aprendizado.trim() || null,
      p_trecho_pagina: trechoPag ? Number(trechoPag) : null,
      p_trecho_citacao: trecho.trim() || null,
    })
    setEnviando(false)
    if (error) return setErro(mensagemDeErroBanco(error))
    aoConcluir(data as Resultado)
  }

  const avancar = () => setPasso((p) => p + 1)
  const telas = [
    {
      titulo: 'Qual livro você leu?',
      conteudo: livros.length ? (
        <>
          <div className="le-escolha-dia" role="radiogroup" aria-label="Quando">
            {['Hoje', 'Ontem', 'Anteontem'].map((r, i) => (
              <button key={r} role="radio" aria-checked={diasAtras === i} onClick={() => setDiasAtras(i)}>
                {r}
              </button>
            ))}
          </div>
          <ul className="le-escolha-livros">
            {livros.map((l) => (
              <li key={l.id}>
                <button
                  className="le-escolha-livro"
                  aria-pressed={livroId === l.id}
                  onClick={() => {
                    setLivroId(l.id)
                    window.setTimeout(avancar, 200)
                  }}
                >
                  <Capa titulo={l.titulo} autor={l.autor} path={l.capa_path} tamanho="pequena" />
                  <span>
                    <b>{l.titulo}</b>
                    <small>
                      pág. {l.pagina_atual} de {l.total_paginas}
                      {l.estado !== 'lendo' ? ` · ${l.estado === 'pausado' ? 'pausado' : 'quero ler'}` : ''}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="vazio">Adicione um livro na Biblioteca para registrar sua leitura.</p>
      ),
      rodape: (
        <button className="btn btn-primario btn-grande" disabled={!livro} onClick={avancar}>
          Continuar
        </button>
      ),
    },
    {
      titulo: modo === 'pagina' ? 'Até que página você chegou?' : 'Quantos minutos você leu?',
      apoio: livro ? `${livro.titulo} · você estava na página ${livro.pagina_atual} de ${livro.total_paginas}` : undefined,
      conteudo: (
        <div className="le-registro">
          <div className="le-modo" role="radiogroup" aria-label="Registrar por">
            <button role="radio" aria-checked={modo === 'pagina'} onClick={() => setModo('pagina')}>
              Página
            </button>
            <button role="radio" aria-checked={modo === 'minutos'} onClick={() => setModo('minutos')}>
              Minutos
            </button>
          </div>
          {modo === 'pagina' ? (
            <input
              className="entrada le-numero"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label="Página em que parou"
              placeholder={livro ? String(Math.min(livro.total_paginas, livro.pagina_atual + 10)) : ''}
              value={pagina}
              onChange={(e) => setPagina(e.target.value.replace(/\D/g, '').slice(0, 5))}
            />
          ) : (
            <>
              <input
                className="entrada le-numero"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label="Minutos lidos"
                placeholder="10"
                value={minutos}
                onChange={(e) => setMinutos(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
              <Cronometro aoParar={(m) => setMinutos(String(m))} />
            </>
          )}
          {modo === 'pagina' && paginaNum !== null && livro && !valorOk && (
            <small className="le-dica-erro">
              {paginaNum <= livro.pagina_atual
                ? `Informe uma página maior que ${livro.pagina_atual}.`
                : `O livro tem ${livro.total_paginas} páginas.`}
            </small>
          )}
        </div>
      ),
      rodape: (
        <button className="btn btn-primario btn-grande" disabled={!valorOk} onClick={avancar}>
          Continuar
        </button>
      ),
    },
    {
      titulo: 'Como foi seu foco?',
      conteudo: (
        <Opcoes
          rotulo="Foco de 1 a 5"
          colunas={5}
          valor={foco}
          aoMudar={(v: number) => {
            setFoco(v)
            window.setTimeout(avancar, 220)
          }}
          opcoes={[1, 2, 3, 4, 5].map((n) => ({ valor: n, rotulo: String(n), sub: ['Disperso', '', 'Ok', '', 'Total'][n - 1] || undefined }))}
        />
      ),
      rodape: (
        <button className="btn btn-fantasma" onClick={avancar}>
          Pular
        </button>
      ),
    },
    {
      titulo: 'O que ficou com você?',
      apoio: 'Uma frase sobre o que aprendeu ou achou marcante. Opcional, mas vale a pena.',
      conteudo: (
        <textarea
          className="entrada"
          aria-label="O que aprendi ou achei marcante"
          maxLength={500}
          value={aprendizado}
          onChange={(e) => setAprendizado(e.target.value)}
          placeholder="Ex.: pequenas mudanças somam mais do que eu imaginava"
        />
      ),
      rodape: (
        <button className="btn btn-primario btn-grande" onClick={avancar}>
          {aprendizado.trim() ? 'Continuar' : 'Pular'}
        </button>
      ),
    },
    {
      titulo: 'Algum trecho favorito?',
      apoio: 'Opcional. Fica guardado no seu caderno.',
      conteudo: (
        <div className="le-trecho">
          <label className="campo">
            <span>Página</span>
            <input
              className="entrada"
              inputMode="numeric"
              value={trechoPag}
              onChange={(e) => setTrechoPag(e.target.value.replace(/\D/g, '').slice(0, 5))}
            />
          </label>
          <label className="campo">
            <span>Citação</span>
            <textarea className="entrada" maxLength={500} value={trecho} onChange={(e) => setTrecho(e.target.value)} />
          </label>
        </div>
      ),
      rodape: (
        <>
          {erro && (
            <div className="aviso aviso-erro" role="alert">
              {erro}
            </div>
          )}
          <button className="btn btn-primario btn-grande" disabled={enviando} onClick={enviar}>
            {enviando ? 'Salvando…' : 'Concluir sessão'}
          </button>
        </>
      ),
    },
  ]
  const t = telas[passo]
  return (
    <PassoAPasso
      passo={passo}
      total={telas.length}
      titulo={t.titulo}
      apoio={t.apoio}
      aoVoltar={() => setPasso((p) => Math.max(0, p - 1))}
      aoFechar={aoFechar}
      rotuloFechar="Sair do registro"
      rodape={t.rodape}
    >
      {t.conteudo}
    </PassoAPasso>
  )
}

function Cronometro({ aoParar }: { aoParar: (minutos: number) => void }) {
  const [rodando, setRodando] = useState(false)
  const [acumulado, setAcumulado] = useState(0)
  const [inicio, setInicio] = useState<number | null>(null)
  const [, tique] = useState(0)

  useEffect(() => {
    if (!rodando) return
    const i = window.setInterval(() => tique((x) => x + 1), 1000)
    return () => clearInterval(i)
  }, [rodando])

  const total = acumulado + (inicio ? Date.now() - inicio : 0)
  const seg = Math.floor(total / 1000)
  const mm = String(Math.floor(seg / 60)).padStart(2, '0')
  const ss = String(seg % 60).padStart(2, '0')

  return (
    <div className="le-crono">
      <span className="le-crono-tempo" aria-live="off">
        {mm}:{ss}
      </span>
      <button
        className="btn btn-secundario"
        onClick={() => {
          if (rodando) {
            setAcumulado(total)
            setInicio(null)
            setRodando(false)
            aoParar(Math.max(1, Math.round(total / 60000)))
          } else {
            setInicio(Date.now())
            setRodando(true)
          }
        }}
      >
        {rodando ? <Pause aria-hidden /> : <Play aria-hidden />}
        {rodando ? 'Pausar' : acumulado ? 'Continuar' : 'Ler com cronômetro'}
      </button>
      {!rodando && acumulado > 0 && (
        <button
          className="btn btn-fantasma"
          aria-label="Zerar cronômetro"
          onClick={() => {
            setAcumulado(0)
            aoParar(0)
          }}
        >
          <RotateCcw aria-hidden />
        </button>
      )}
    </div>
  )
}

function Fixacao({
  livroId,
  capitulos,
  aoFechar,
}: {
  livroId: string
  capitulos: { capitulo_id?: string; parte?: number; rotulo: string }[]
  aoFechar: () => void
}) {
  const ultimo = capitulos[capitulos.length - 1]
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.from('leit_fixacao').insert({
      livro_id: livroId,
      capitulo_id: ultimo.capitulo_id ?? null,
      parte: ultimo.parte ?? null,
      rotulo: ultimo.rotulo,
      resposta: resposta.trim(),
    })
    setEnviando(false)
    if (error) return setErro(mensagemDeErroBanco(error))
    aoFechar()
  }

  return (
    <PassoAPasso
      passo={0}
      total={1}
      titulo="Qual a ideia central deste capítulo?"
      apoio={`${capitulos.length > 1 ? `${capitulos.length} trechos concluídos. Sobre o último: ` : ''}${ultimo.rotulo}. Opcional, fica salvo em Meu caderno.`}
      aoFechar={aoFechar}
      rotuloFechar="Pular pergunta"
      rodape={
        <>
          {erro && (
            <div className="aviso aviso-erro" role="alert">
              {erro}
            </div>
          )}
          <button className="btn btn-primario btn-grande" disabled={!resposta.trim() || enviando} onClick={salvar}>
            {enviando ? 'Salvando…' : 'Salvar no caderno'}
          </button>
          <button className="btn btn-fantasma" onClick={aoFechar}>
            Pular
          </button>
        </>
      }
    >
      <div className="le-fixacao-estrela" aria-hidden>
        <Star />
      </div>
      <textarea
        className="entrada"
        aria-label="Ideia central"
        maxLength={500}
        value={resposta}
        onChange={(e) => setResposta(e.target.value)}
        placeholder="Em uma ou duas frases…"
      />
    </PassoAPasso>
  )
}

function ConclusaoLivro({
  livro,
  titulo,
  dias,
  som,
  vibracao,
  aoFechar,
}: {
  livro?: Livro
  titulo: string
  dias: number
  som: boolean
  vibracao: boolean
  aoFechar: () => void
}) {
  const reduzido = useMovimentoReduzido()
  const [nota, setNota] = useState<number | null>(null)
  const [resumo, setResumo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    vibrar(vibracao, [30, 80, 40, 80, 60])
    tocarSom(som, true)
  }, [som, vibracao])

  async function salvar() {
    if (!livro) return aoFechar()
    setEnviando(true)
    const { error } = await supabase
      .from('leit_livros')
      .update({ nota_final: nota, resumo_final: resumo.trim() || null })
      .eq('id', livro.id)
    setEnviando(false)
    if (error) return setErro(mensagemDeErroBanco(error))
    aoFechar()
  }

  return (
    <div className="celebra le-conclusao" role="dialog" aria-modal="true" aria-labelledby="le-conclusao-titulo" data-marco>
      {!reduzido && <Confete />}
      <div className="celebra-miolo le-conclusao-miolo">
        <div className="le-conclusao-capa">
          <Capa titulo={titulo} autor={livro?.autor} path={livro?.capa_path ?? null} tamanho="grande" />
        </div>
        <span className="olho">Livro concluído</span>
        <h2 id="le-conclusao-titulo">{titulo}</h2>
        <p className="le-conclusao-tempo">
          Você leu em {dias} {dias === 1 ? 'dia' : 'dias'}.
          {livro ? ` ${livro.total_paginas} páginas.` : ''}
        </p>
        <div className="le-conclusao-nota" role="radiogroup" aria-label="Sua nota">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={nota === n} aria-label={`${n} de 5`} onClick={() => setNota(n)} data-ativo={nota !== null && n <= nota ? true : undefined}>
              <Star aria-hidden />
            </button>
          ))}
        </div>
        <textarea
          className="entrada"
          aria-label="Resumo em uma frase"
          maxLength={500}
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          placeholder="Uma frase que resume o livro para você"
        />
        {erro && (
          <div className="aviso aviso-erro" role="alert">
            {erro}
          </div>
        )}
      </div>
      <div className="celebra-rodape" data-visivel>
        <button className="btn btn-primario btn-grande" disabled={enviando} onClick={salvar}>
          {enviando ? 'Salvando…' : nota || resumo.trim() ? 'Salvar e fechar' : 'Fechar'}
        </button>
      </div>
    </div>
  )
}
