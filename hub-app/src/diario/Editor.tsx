import { ArrowRightToLine, Check, ChevronLeft, FileText, ImagePlus, Paperclip, Plus, Star, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BotaoSom } from '../components/ui/BotaoSom'
import { useToast } from '../components/ui/Toast'
import { mensagemDeErroBanco } from '../lib/erros'
import { atualizarOuCriar } from '../lib/salvar'
import { tocar } from '../lib/som'
import { supabase } from '../lib/supabase'
import { hojeBrasiliaIso } from '../lib/tempo'
import { useUrl } from '../modulos/studio/dados'
import {
  abrirAnexo,
  apagarEntrada,
  BUCKET,
  CAMPOS,
  diaLongo,
  enviarAnexo,
  entradaVazia,
  GATILHOS,
  HUMORES,
  levarParaOAFazer,
  novoId,
  palavras,
  removerAnexo,
  tamanhoLegivel,
  type Anexo,
  type Entrada,
} from './dados'

const RASCUNHO = 'tv-diario-rascunho'

function lerRascunho(): Entrada | null {
  try {
    const r = JSON.parse(localStorage.getItem(RASCUNHO) ?? 'null') as Entrada | null
    return r && typeof r.id === 'string' && typeof r.texto === 'string' ? r : null
  } catch {
    return null
  }
}
const guardarRascunho = (e: Entrada | null) => {
  try {
    if (e) localStorage.setItem(RASCUNHO, JSON.stringify(e))
    else localStorage.removeItem(RASCUNHO)
  } catch {
    /* sem armazenamento: só perde a rede de segurança */
  }
}

function Miniatura({ a, aoAbrir }: { a: Anexo; aoAbrir: () => void }) {
  const url = useUrl(a.path, BUCKET)
  return (
    <button type="button" className="di-miniatura" onClick={aoAbrir} aria-label={`Ver imagem ${a.nome}`}>
      {url ? <img src={url} alt="" loading="lazy" decoding="async" /> : <span className="di-carregando" />}
    </button>
  )
}

function Lightbox({ a, aoFechar }: { a: Anexo; aoFechar: () => void }) {
  const url = useUrl(a.path, BUCKET)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])
  return (
    <div className="di-lightbox" role="dialog" aria-modal="true" aria-label={a.nome} onClick={aoFechar}>
      <button className="btn-icone di-lightbox-fechar" onClick={aoFechar} aria-label="Fechar">
        <X aria-hidden />
      </button>
      {url ? <img src={url} alt={a.nome} onClick={(e) => e.stopPropagation()} /> : <span className="giro" />}
      <small>{a.nome}</small>
    </div>
  )
}

function Editor({ inicial, anexosIniciais, existente }: { inicial: Entrada; anexosIniciais: Anexo[]; existente: boolean }) {
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const hoje = hojeBrasiliaIso()
  const [e, setE] = useState<Entrada>(inicial)
  const [anexos, setAnexos] = useState<Anexo[]>(anexosIniciais)
  const [estado, setEstado] = useState<'salvo' | 'salvando' | 'erro'>('salvo')
  const [enviando, setEnviando] = useState(0)
  const [lightbox, setLightbox] = useState<Anexo | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [novaTag, setNovaTag] = useState('')
  const [novaTarefa, setNovaTarefa] = useState('')
  const [sugestoes, setSugestoes] = useState<string[]>([])
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const arquivoRef = useRef<HTMLInputElement>(null)
  const eRef = useRef(e)
  eRef.current = e
  const anexosRef = useRef(anexos)
  anexosRef.current = anexos
  const sujo = useRef(false)
  const salvandoAgora = useRef<Promise<boolean> | null>(null)
  const timer = useRef<number | null>(null)
  const apagada = useRef(false)

  const temConteudo = (x: Entrada) => !!(x.texto.trim() || x.titulo?.trim() || x.tarefas.length || anexosRef.current.length)

  const salvar = useCallback(
    async (forcar = false): Promise<boolean> => {
      if (apagada.current) return true
      // Espera um salvamento em andamento terminar para não gravar fora de ordem.
      if (salvandoAgora.current) await salvandoAgora.current
      const atual = eRef.current
      if (!sujo.current && !forcar) return true
      if (!forcar && !temConteudo(atual)) {
        sujo.current = false
        setEstado('salvo')
        return true
      }
      setEstado('salvando')
      const campos = { dia: atual.dia, titulo: atual.titulo?.trim() || null, texto: atual.texto, humor: atual.humor, etiquetas: atual.etiquetas, favorita: atual.favorita, tarefas: atual.tarefas }
      sujo.current = false
      const p = (async () => {
        const erro = await atualizarOuCriar('diario_entradas', { id: atual.id }, { ...campos, atualizado_em: new Date().toISOString() }, { id: atual.id, ...campos })
        if (erro) {
          sujo.current = true
          setEstado('erro')
          mostrar(mensagemDeErroBanco(erro), { comNav: false })
          return false
        }
        if (!sujo.current) {
          guardarRascunho(null)
          setEstado('salvo')
        }
        return true
      })()
      salvandoAgora.current = p
      const ok = await p
      salvandoAgora.current = null
      return ok
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mostrar],
  )

  const mudar = useCallback(
    (campos: Partial<Entrada>) => {
      sujo.current = true
      setEstado('salvando')
      setE((x) => {
        const novo = { ...x, ...campos }
        guardarRascunho(novo)
        return novo
      })
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void salvar(), 900)
    },
    [salvar],
  )

  // Salva ao sair da tela e avisa se fechar a aba com algo pendente.
  useEffect(() => {
    const antes = (ev: BeforeUnloadEvent) => {
      if (sujo.current) ev.preventDefault()
    }
    const oculta = () => document.hidden && sujo.current && void salvar()
    window.addEventListener('beforeunload', antes)
    document.addEventListener('visibilitychange', oculta)
    return () => {
      window.removeEventListener('beforeunload', antes)
      document.removeEventListener('visibilitychange', oculta)
      if (timer.current) window.clearTimeout(timer.current)
      if (sujo.current) void salvar()
    }
  }, [salvar])

  useLayoutEffect(() => {
    const a = areaRef.current
    if (!a) return
    a.style.height = 'auto'
    a.style.height = `${a.scrollHeight}px`
  }, [e.texto])

  useEffect(() => {
    if (!existente) {
      const a = areaRef.current
      if (a) {
        a.focus()
        a.setSelectionRange(a.value.length, a.value.length)
      }
    }
    // Etiquetas já usadas, para reaproveitar.
    supabase
      .from('diario_entradas')
      .select('etiquetas')
      .order('criado_em', { ascending: false })
      .limit(120)
      .then(({ data }) => {
        const cont = new Map<string, number>()
        for (const l of (data ?? []) as { etiquetas: string[] }[]) for (const t of l.etiquetas) cont.set(t, (cont.get(t) ?? 0) + 1)
        setSugestoes([...cont.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 8))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const inserirGatilho = (g: string) => {
    const t = e.texto
    mudar({ texto: `${t}${t && !t.endsWith('\n') ? '\n\n' : ''}${g}\n` })
    window.setTimeout(() => {
      const a = areaRef.current
      if (a) {
        a.focus()
        a.setSelectionRange(a.value.length, a.value.length)
      }
    }, 0)
  }

  const adicionarTag = (bruta: string) => {
    const t = bruta.trim().replace(/^#/, '').toLowerCase().slice(0, 30)
    if (!t || e.etiquetas.includes(t) || e.etiquetas.length >= 12) return
    mudar({ etiquetas: [...e.etiquetas, t] })
    setNovaTag('')
  }

  const enviarArquivos = async (arquivos: File[]) => {
    const validos = arquivos.filter((f) => /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(f.type))
    if (!validos.length) return mostrar('Use imagem (JPG, PNG, WEBP, GIF) ou PDF.', { comNav: false })
    // O anexo precisa de uma entrada já gravada.
    const ok = await salvar(true)
    if (!ok) return
    for (const f of validos) {
      setEnviando((n) => n + 1)
      try {
        const a = await enviarAnexo(eRef.current.id, f, f.name || `colado-${Date.now()}.png`)
        setAnexos((l) => [...l, a])
        tocar('plantar')
      } catch (err) {
        mostrar(err instanceof Error ? err.message : mensagemDeErroBanco(err as Parameters<typeof mensagemDeErroBanco>[0]), { comNav: false })
      } finally {
        setEnviando((n) => n - 1)
      }
    }
  }

  const aoColar = (ev: ClipboardEvent) => {
    const arquivos = [...ev.clipboardData.files]
    if (arquivos.length) {
      ev.preventDefault()
      void enviarArquivos(arquivos)
    }
  }
  const aoSoltar = (ev: DragEvent) => {
    ev.preventDefault()
    setArrastando(false)
    void enviarArquivos([...ev.dataTransfer.files])
  }

  const levar = async (id: string) => {
    const t = e.tarefas.find((x) => x.id === id)
    if (!t) return
    const erro = await levarParaOAFazer(t.texto)
    if (erro) return mostrar(erro, { comNav: false })
    tocar('sucesso')
    mudar({ tarefas: e.tarefas.map((x) => (x.id === id ? { ...x, levada: true } : x)) })
    mostrar('Levada para o A fazer de hoje.', { comNav: false })
  }

  async function apagar() {
    if (!window.confirm('Apagar esta entrada e os arquivos dela? Não dá para desfazer.')) return
    apagada.current = true
    if (timer.current) window.clearTimeout(timer.current)
    guardarRascunho(null)
    const erro = await apagarEntrada(e.id)
    if (erro) {
      apagada.current = false
      return mostrar(mensagemDeErroBanco(erro), { comNav: false })
    }
    tocar('desmarcar')
    navegar('/diario', { replace: true })
  }

  const n = palavras(e.texto)
  const humor = useMemo(() => HUMORES.find((h) => h.n === e.humor), [e.humor])

  return (
    <div className="di-editor" onDragOver={(ev) => (ev.preventDefault(), setArrastando(true))} onDragLeave={(ev) => ev.currentTarget === ev.target && setArrastando(false)} onDrop={aoSoltar}>
      <header className="di-topo">
        <Link to="/diario" className="shell-voltar" aria-label="Voltar ao diário" onClick={() => sujo.current && void salvar()}>
          <ChevronLeft aria-hidden />
          <span>Diário</span>
        </Link>
        <span className="di-salvo" data-estado={estado} role="status">
          {enviando > 0 ? 'Enviando arquivo…' : estado === 'salvando' ? 'Salvando…' : estado === 'erro' ? 'Não salvou' : temConteudo(e) ? 'Salvo' : 'Rascunho'}
        </span>
        {estado === 'erro' && (
          <button className="btn btn-secundario di-tentar" onClick={() => void salvar(true)}>
            Tentar de novo
          </button>
        )}
        <div className="di-topo-acoes">
          <button className="btn-icone" aria-pressed={e.favorita} aria-label={e.favorita ? 'Tirar dos favoritos' : 'Favoritar'} onClick={() => mudar({ favorita: !e.favorita })}>
            <Star aria-hidden />
          </button>
          {(existente || temConteudo(e)) && (
            <button className="btn-icone di-apagar" aria-label="Apagar entrada" onClick={() => void apagar()}>
              <Trash2 aria-hidden />
            </button>
          )}
          <BotaoSom />
        </div>
      </header>

      <div className="di-rolagem">
        <div className="di-folha">
          <div className="di-meta">
            <label className="di-data">
              <span className="sr-only">Dia da entrada</span>
              <input type="date" max={hoje} value={e.dia} onChange={(ev) => ev.target.value && mudar({ dia: ev.target.value })} />
              <b>{diaLongo(e.dia)}</b>
            </label>
            <div className="di-humores" role="group" aria-label="Como você está?">
              {HUMORES.map((h) => (
                <button key={h.n} className="di-humor" aria-pressed={e.humor === h.n} aria-label={h.rotulo} title={h.rotulo} onClick={() => mudar({ humor: e.humor === h.n ? null : h.n })}>
                  {h.emoji}
                </button>
              ))}
            </div>
          </div>
          {humor && <small className="di-humor-rotulo">Hoje: {humor.rotulo.toLowerCase()}</small>}

          <input
            className="di-titulo"
            value={e.titulo ?? ''}
            maxLength={120}
            placeholder="Título (opcional)"
            aria-label="Título"
            onChange={(ev) => mudar({ titulo: ev.target.value })}
          />
          <textarea
            ref={areaRef}
            className="di-texto"
            value={e.texto}
            maxLength={30000}
            placeholder="Despeje tudo aqui. Sem organizar, sem se preocupar com a forma. O que está na sua cabeça?"
            aria-label="Texto da entrada"
            onChange={(ev) => mudar({ texto: ev.target.value })}
            onPaste={aoColar}
          />
          <div className="di-rodape-texto">
            <span>
              {n} {n === 1 ? 'palavra' : 'palavras'}
            </span>
          </div>

          <div className="di-gatilhos" aria-label="Sem saber por onde começar?">
            <span className="di-rotulo">Sem saber por onde começar?</span>
            <div className="di-chips">
              {GATILHOS.slice(0, 5).map((g) => (
                <button key={g} className="dia-chip" onClick={() => inserirGatilho(g)}>
                  {g.replace(':', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <section className="di-bloco" aria-label="Arquivos">
          <div className="di-bloco-topo">
            <h3>
              <Paperclip aria-hidden /> Arquivos
            </h3>
            <button className="btn btn-secundario" onClick={() => arquivoRef.current?.click()} disabled={enviando > 0}>
              <ImagePlus aria-hidden /> Adicionar
            </button>
          </div>
          <input
            ref={arquivoRef}
            type="file"
            hidden
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            onChange={(ev) => {
              const fs = [...(ev.target.files ?? [])]
              ev.target.value = ''
              if (fs.length) void enviarArquivos(fs)
            }}
          />
          {anexos.length === 0 && enviando === 0 ? (
            <p className="di-vazio">Imagens e PDFs. Também dá para colar um print (Ctrl+V) ou arrastar o arquivo para esta tela.</p>
          ) : (
            <>
              <div className="di-miniaturas">
                {anexos
                  .filter((a) => a.tipo.startsWith('image/'))
                  .map((a) => (
                    <div key={a.id} className="di-anexo-img">
                      <Miniatura a={a} aoAbrir={() => setLightbox(a)} />
                      <button
                        className="di-anexo-x"
                        aria-label={`Remover ${a.nome}`}
                        onClick={async () => {
                          const erro = await removerAnexo(a)
                          if (erro) return mostrar(mensagemDeErroBanco(erro), { comNav: false })
                          setAnexos((l) => l.filter((x) => x.id !== a.id))
                        }}
                      >
                        <X aria-hidden />
                      </button>
                    </div>
                  ))}
                {enviando > 0 && <span className="di-miniatura di-carregando" aria-label="Enviando" />}
              </div>
              <ul className="di-pdfs">
                {anexos
                  .filter((a) => a.tipo === 'application/pdf')
                  .map((a) => (
                    <li key={a.id}>
                      <FileText aria-hidden />
                      <button className="di-pdf-nome" onClick={() => abrirAnexo(a).catch((err) => mostrar(err instanceof Error ? err.message : 'Não deu para abrir.', { comNav: false }))}>
                        <b>{a.nome}</b>
                        <small>PDF · {tamanhoLegivel(a.tamanho)} · toque para abrir</small>
                      </button>
                      <button
                        className="btn-icone"
                        aria-label={`Remover ${a.nome}`}
                        onClick={async () => {
                          if (!window.confirm(`Remover "${a.nome}"?`)) return
                          const erro = await removerAnexo(a)
                          if (erro) return mostrar(mensagemDeErroBanco(erro), { comNav: false })
                          setAnexos((l) => l.filter((x) => x.id !== a.id))
                        }}
                      >
                        <X aria-hidden />
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </section>

        <section className="di-bloco" aria-label="Para fazer">
          <div className="di-bloco-topo">
            <h3>
              <Check aria-hidden /> Para fazer
            </h3>
          </div>
          <p className="di-vazio">Escreveu algo que precisa virar ação? Anote aqui e leve para o A fazer de hoje.</p>
          <ul className="di-tarefas">
            {e.tarefas.map((t) => (
              <li key={t.id} data-feita={t.feita || undefined}>
                <button
                  className="dia-prio-marca"
                  aria-pressed={t.feita}
                  aria-label={t.feita ? `Desmarcar ${t.texto}` : `Concluir ${t.texto}`}
                  onClick={() => mudar({ tarefas: e.tarefas.map((x) => (x.id === t.id ? { ...x, feita: !x.feita } : x)) })}
                >
                  <span className="dia-caixa" aria-hidden>
                    <Check />
                  </span>
                </button>
                <span className="di-tarefa-texto">{t.texto}</span>
                {t.levada ? (
                  <span className="di-levada">No A fazer ✓</span>
                ) : (
                  !t.feita && (
                    <button className="btn btn-fantasma di-levar" onClick={() => void levar(t.id)}>
                      <ArrowRightToLine aria-hidden /> Levar para hoje
                    </button>
                  )
                )}
                <button className="btn-icone" aria-label={`Apagar ${t.texto}`} onClick={() => mudar({ tarefas: e.tarefas.filter((x) => x.id !== t.id) })}>
                  <X aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="di-nova-tarefa"
            onSubmit={(ev) => {
              ev.preventDefault()
              const texto = novaTarefa.trim()
              if (!texto || e.tarefas.length >= 40) return
              mudar({ tarefas: [...e.tarefas, { id: novoId(), texto: texto.slice(0, 160), feita: false, levada: false }] })
              setNovaTarefa('')
            }}
          >
            <input className="entrada" value={novaTarefa} maxLength={160} onChange={(ev) => setNovaTarefa(ev.target.value)} placeholder="Ex.: ligar para o contador" aria-label="Nova tarefa" enterKeyHint="send" />
            <button className="btn btn-primario" disabled={!novaTarefa.trim()} aria-label="Adicionar tarefa">
              <Plus aria-hidden />
            </button>
          </form>
        </section>

        <section className="di-bloco" aria-label="Etiquetas">
          <div className="di-bloco-topo">
            <h3># Etiquetas</h3>
          </div>
          <div className="di-chips">
            {e.etiquetas.map((t) => (
              <span key={t} className="di-tag">
                #{t}
                <button aria-label={`Remover etiqueta ${t}`} onClick={() => mudar({ etiquetas: e.etiquetas.filter((x) => x !== t) })}>
                  <X aria-hidden />
                </button>
              </span>
            ))}
          </div>
          <form
            className="di-nova-tarefa"
            onSubmit={(ev) => {
              ev.preventDefault()
              adicionarTag(novaTag)
            }}
          >
            <input className="entrada" value={novaTag} maxLength={30} onChange={(ev) => setNovaTag(ev.target.value)} placeholder="trabalho, saúde, ideia…" aria-label="Nova etiqueta" enterKeyHint="send" />
            <button className="btn btn-secundario" disabled={!novaTag.trim()}>
              Adicionar
            </button>
          </form>
          {sugestoes.filter((s) => !e.etiquetas.includes(s)).length > 0 && (
            <div className="di-chips">
              {sugestoes
                .filter((s) => !e.etiquetas.includes(s))
                .map((s) => (
                  <button key={s} className="dia-chip" onClick={() => adicionarTag(s)}>
                    #{s}
                  </button>
                ))}
            </div>
          )}
        </section>
      </div>

      {arrastando && <div className="di-soltar">Solte para anexar</div>}
      {lightbox && <Lightbox a={lightbox} aoFechar={() => setLightbox(null)} />}
    </div>
  )
}

/** Carrega a entrada (ou prepara uma nova) e entrega ao editor. */
export function EditorTela() {
  const { id } = useParams()
  const loc = useLocation()
  const estado = (loc.state ?? {}) as { texto?: string; dia?: string }
  const [pronto, setPronto] = useState<{ e: Entrada; anexos: Anexo[]; existente: boolean } | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    setPronto(null)
    setErro(null)
    async function abrir() {
      if (id) {
        const [r, a] = await Promise.all([
          supabase.from('diario_entradas').select(CAMPOS).eq('id', id).maybeSingle(),
          supabase.from('diario_anexos').select('id, entrada_id, path, nome, tipo, tamanho').eq('entrada_id', id).order('criado_em'),
        ])
        if (!vivo) return
        if (r.error) return setErro(mensagemDeErroBanco(r.error))
        if (!r.data) return setErro('Entrada não encontrada.')
        // Se sobrou um rascunho local mais novo desta mesma entrada (a rede caiu), usa ele.
        const rasc = lerRascunho()
        const base = r.data as Entrada
        const usar = rasc && rasc.id === base.id && rasc.atualizado_em >= base.atualizado_em ? { ...base, ...rasc } : base
        return setPronto({ e: usar, anexos: (a.data ?? []) as Anexo[], existente: true })
      }
      const rasc = lerRascunho()
      if (rasc && !estado.texto && (rasc.texto.trim() || rasc.titulo?.trim() || rasc.tarefas.length)) {
        const ex = await supabase.from('diario_entradas').select('id').eq('id', rasc.id).maybeSingle()
        const a = ex.data ? await supabase.from('diario_anexos').select('id, entrada_id, path, nome, tipo, tamanho').eq('entrada_id', rasc.id) : { data: [] }
        if (!vivo) return
        return setPronto({ e: rasc, anexos: (a.data ?? []) as Anexo[], existente: !!ex.data })
      }
      if (!vivo) return
      setPronto({ e: entradaVazia(estado.dia, estado.texto ?? ''), anexos: [], existente: false })
    }
    void abrir()
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (erro)
    return (
      <div className="di-editor di-centro">
        <div className="bloco-erro" role="alert">
          <p>{erro}</p>
          <Link className="btn btn-secundario" to="/diario">
            Voltar ao diário
          </Link>
        </div>
      </div>
    )
  if (!pronto)
    return (
      <div className="di-editor di-centro">
        <div className="carregando" role="status" aria-label="Carregando">
          <span className="giro" />
        </div>
      </div>
    )
  return <Editor key={pronto.e.id} inicial={pronto.e} anexosIniciais={pronto.anexos} existente={pronto.existente} />
}
