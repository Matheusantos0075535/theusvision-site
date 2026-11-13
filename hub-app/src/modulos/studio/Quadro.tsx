import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronLeft,
  Clapperboard,
  Copy,
  ExternalLink,
  Heading1,
  ImagePlus,
  Link2,
  Maximize,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Spline,
  StickyNote,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as PE } from 'react'
import { Link } from 'react-router-dom'
import { BotaoSom } from '../../components/ui/BotaoSom'
import { useToast } from '../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../lib/erros'
import { tocar } from '../../lib/som'
import { supabase } from '../../lib/supabase'
import { useRegistrarUso } from '../../lib/uso'
import { CORES, corDe, criarItem, dominio, enviarImagem, novoId, pareceUrl, useUrl, type Cor, type Item, type Ligacao, type Projeto, type Quadro as TQuadro, type TipoItem } from './dados'

type Ferramenta = 'selecionar' | 'nota' | 'texto' | 'titulo' | 'link' | 'cena' | 'ligar'
type Vista = { x: number; y: number; zoom: number }
type Ponto = { x: number; y: number }
type Arrasto =
  | { tipo: 'pan'; inicio: Ponto; vista: Vista; moveu: boolean }
  | { tipo: 'mover'; inicio: Ponto; origens: Record<string, Ponto>; moveu: boolean }
  | { tipo: 'redimensionar'; id: string; inicio: Ponto; w: number; h: number; razao: number | null }
  | { tipo: 'ligar'; de: string; ate: Ponto; tela: Ponto; longe: boolean }
  | { tipo: 'caixa'; inicio: Ponto; ate: Ponto }

const ZOOM_MIN = 0.15
const ZOOM_MAX = 3
const limitar = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
const editavel = (t: TipoItem) => t === 'nota' || t === 'texto' || t === 'titulo'

/** Ponto onde a reta do centro até `alvo` cruza a borda do item (para a seta não entrar no cartão). */
function borda(it: Item, alvo: Ponto): Ponto {
  const cx = it.x + it.w / 2
  const cy = it.y + it.h / 2
  const dx = alvo.x - cx
  const dy = alvo.y - cy
  if (!dx && !dy) return { x: cx, y: cy }
  const t = Math.min(Math.abs(it.w / 2 / (dx || 1e-9)), Math.abs(it.h / 2 / (dy || 1e-9)))
  return { x: cx + dx * Math.min(1, t), y: cy + dy * Math.min(1, t) }
}
const centro = (it: Item): Ponto => ({ x: it.x + it.w / 2, y: it.y + it.h / 2 })

function Imagem({ it }: { it: Item }) {
  const url = useUrl(it.path, it.bucket)
  return url ? <img src={url} alt="" draggable={false} decoding="async" /> : <span className="st-img-carregando" />
}

function Cartao({
  it,
  selecionado,
  editando,
  aoAlterar,
  aoTerminarEdicao,
  aoEnviarImagemCena,
}: {
  it: Item
  selecionado: boolean
  editando: boolean
  aoAlterar: (campos: Partial<Item>, historico?: boolean) => void
  aoTerminarEdicao: () => void
  aoEnviarImagemCena: (id: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    if (editando && ref.current) {
      ref.current.focus()
      ref.current.select()
    }
  }, [editando])
  const parar = (e: PE) => e.stopPropagation()
  const cor = corDe(it.cor)

  if (it.tipo === 'imagem') return <Imagem it={it} />

  if (it.tipo === 'link') {
    return (
      <div className="st-link">
        <span className="st-link-icone" aria-hidden>
          <Link2 />
        </span>
        <span className="st-link-textos">
          {editando ? (
            <textarea
              ref={ref}
              className="st-campo"
              defaultValue={it.url ?? ''}
              placeholder="Cole o link (Instagram, YouTube, site…)"
              onPointerDown={parar}
              onBlur={(e) => {
                aoAlterar({ url: e.target.value.trim() })
                aoTerminarEdicao()
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), e.currentTarget.blur())}
            />
          ) : (
            <>
              <b>{it.url ? dominio(it.url) : 'Link'}</b>
              <small>{it.url || 'Dois cliques para colar o link'}</small>
            </>
          )}
        </span>
        {it.url && !editando && (
          <a className="st-link-abrir" href={it.url} target="_blank" rel="noreferrer noopener" onPointerDown={parar} aria-label="Abrir link">
            <ExternalLink />
          </a>
        )}
      </div>
    )
  }

  if (it.tipo === 'cena') {
    return (
      <div className="st-cena">
        <div className="st-cena-topo">
          <Clapperboard aria-hidden />
          <b>Cena {it.n ?? 1}</b>
        </div>
        <button
          type="button"
          className="st-cena-img"
          onPointerDown={(e) => selecionado && e.stopPropagation()}
          onClick={() => selecionado && aoEnviarImagemCena(it.id)}
          tabIndex={selecionado ? 0 : -1}
          aria-label={it.path ? 'Trocar imagem da cena' : 'Adicionar imagem da cena'}
        >
          {it.path ? <Imagem it={it} /> : <span>{selecionado ? <><ImagePlus aria-hidden /> Imagem ou frame</> : 'Sem imagem'}</span>}
        </button>
        <textarea
          className="st-campo st-cena-prompt"
          placeholder="Fala, ação ou prompt da cena"
          value={it.prompt ?? ''}
          onPointerDown={parar}
          onFocus={() => aoAlterar({}, true)}
          onChange={(e) => aoAlterar({ prompt: e.target.value.slice(0, 1200) }, false)}
        />
        <input
          className="st-campo st-cena-camera"
          placeholder="Câmera · duração (ex.: close, 4s)"
          value={it.camera ?? ''}
          onPointerDown={parar}
          onFocus={() => aoAlterar({}, true)}
          onChange={(e) => aoAlterar({ camera: e.target.value.slice(0, 160) }, false)}
        />
      </div>
    )
  }

  const estilo = it.tipo === 'nota' ? { background: cor.fundo, color: cor.tinta } : undefined
  return (
    <div className={`st-texto st-${it.tipo}`} style={estilo}>
      {editando ? (
        <textarea
          ref={ref}
          className="st-campo"
          defaultValue={it.texto ?? ''}
          onPointerDown={parar}
          onBlur={(e) => {
            aoAlterar({ texto: e.target.value.slice(0, 2000) })
            aoTerminarEdicao()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) e.currentTarget.blur()
          }}
        />
      ) : (
        <p>{it.texto || <span className="st-vazio">{it.tipo === 'nota' ? 'Nota' : it.tipo === 'titulo' ? 'Título' : 'Texto'}</span>}</p>
      )}
    </div>
  )
}

export function QuadroTela({ projeto }: { projeto: Projeto }) {
  useRegistrarUso()
  const { mostrar } = useToast()
  const [quadro, setQuadro] = useState<TQuadro>(() => ({ itens: projeto.quadro.itens ?? [], ligacoes: projeto.quadro.ligacoes ?? [] }))
  const [vista, setVista] = useState<Vista>(() => projeto.quadro.vista ?? { x: 0, y: 0, zoom: 1 })
  const [titulo, setTitulo] = useState(projeto.titulo)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [selLig, setSelLig] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const [ferramenta, setFerramenta] = useState<Ferramenta>('selecionar')
  const [ligarDe, setLigarDe] = useState<string | null>(null)
  const [arrasto, setArrastoEstado] = useState<Arrasto | null>(null)
  // O arrasto vive num ref para os eventos da janela lerem o valor na hora (toques rápidos chegam antes do React redesenhar).
  const aRef = useRef<Arrasto | null>(null)
  const setArrasto = useCallback((a: Arrasto | null) => {
    aRef.current = a
    setArrastoEstado(a)
  }, [])
  const [salvo, setSalvo] = useState<'salvo' | 'salvando' | 'erro'>('salvo')
  const [enviando, setEnviando] = useState(0)
  const palco = useRef<HTMLDivElement>(null)
  const arquivo = useRef<HTMLInputElement>(null)
  const destinoImagem = useRef<{ cena?: string; ponto?: Ponto }>({})
  const desfazer = useRef<TQuadro[]>([])
  const refazer = useRef<TQuadro[]>([])
  const qRef = useRef(quadro)
  qRef.current = quadro
  const vRef = useRef(vista)
  vRef.current = vista
  const toques = useRef(new Map<number, Ponto>())
  const pinca = useRef<{ dist: number; meio: Ponto; vista: Vista } | null>(null)

  const zTopo = useMemo(() => Math.max(0, ...quadro.itens.map((i) => i.z)), [quadro.itens])
  const porId = useMemo(() => new Map(quadro.itens.map((i) => [i.id, i])), [quadro.itens])

  // ---------- histórico ----------
  const registrar = useCallback(() => {
    desfazer.current.push(qRef.current)
    if (desfazer.current.length > 80) desfazer.current.shift()
    refazer.current = []
  }, [])
  const mudar = useCallback(
    (fn: (q: TQuadro) => TQuadro, comHistorico = true) => {
      if (comHistorico) registrar()
      setQuadro((q) => fn(q))
    },
    [registrar],
  )
  const voltar = useCallback(() => {
    const ant = desfazer.current.pop()
    if (!ant) return
    refazer.current.push(qRef.current)
    setQuadro(ant)
    setSel(new Set())
  }, [])
  const avancar = useCallback(() => {
    const prox = refazer.current.pop()
    if (!prox) return
    desfazer.current.push(qRef.current)
    setQuadro(prox)
  }, [])

  const alterarItem = useCallback(
    (id: string, campos: Partial<Item>, comHistorico = true) => mudar((q) => ({ ...q, itens: q.itens.map((i) => (i.id === id ? { ...i, ...campos } : i)) }), comHistorico),
    [mudar],
  )

  // ---------- salvar (debounce) ----------
  const primeira = useRef(true)
  const pendente = useRef<number | null>(null)
  const salvarAgora = useCallback(async () => {
    pendente.current = null
    setSalvo('salvando')
    const { error } = await supabase
      .from('studio_projetos')
      .update({ quadro: { ...qRef.current, vista: vRef.current }, atualizado_em: new Date().toISOString() })
      .eq('id', projeto.id)
    setSalvo(error ? 'erro' : 'salvo')
    if (error) mostrar(mensagemDeErroBanco(error), { comNav: false })
  }, [projeto.id, mostrar])
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }
    setSalvo('salvando')
    if (pendente.current) window.clearTimeout(pendente.current)
    pendente.current = window.setTimeout(() => void salvarAgora(), 900)
  }, [quadro, salvarAgora])
  // A vista (zoom/posição) salva junto, sem pressa.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!pendente.current && salvo === 'salvo') void supabase.from('studio_projetos').update({ quadro: { ...qRef.current, vista } }).eq('id', projeto.id)
    }, 2500)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista])
  useEffect(
    () => () => {
      if (pendente.current) {
        window.clearTimeout(pendente.current)
        void supabase.from('studio_projetos').update({ quadro: { ...qRef.current, vista: vRef.current }, atualizado_em: new Date().toISOString() }).eq('id', projeto.id)
      }
    },
    [projeto.id],
  )
  useEffect(() => {
    const antes = (e: BeforeUnloadEvent) => {
      if (pendente.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', antes)
    return () => window.removeEventListener('beforeunload', antes)
  }, [])

  // ---------- coordenadas ----------
  const paraMundo = useCallback((cx: number, cy: number): Ponto => {
    const r = palco.current!.getBoundingClientRect()
    const v = vRef.current
    return { x: (cx - r.left - v.x) / v.zoom, y: (cy - r.top - v.y) / v.zoom }
  }, [])
  const centroDaTela = useCallback((): Ponto => {
    const r = palco.current!.getBoundingClientRect()
    return paraMundo(r.left + r.width / 2, r.top + r.height / 2)
  }, [paraMundo])
  const zoomEm = useCallback((fator: number, cx?: number, cy?: number) => {
    const r = palco.current!.getBoundingClientRect()
    const px = cx ?? r.left + r.width / 2
    const py = cy ?? r.top + r.height / 2
    setVista((v) => {
      const z = limitar(v.zoom * fator)
      const k = z / v.zoom
      return { zoom: z, x: px - r.left - (px - r.left - v.x) * k, y: py - r.top - (py - r.top - v.y) * k }
    })
  }, [])
  const ajustar = useCallback(() => {
    const its = qRef.current.itens
    const r = palco.current!.getBoundingClientRect()
    if (!its.length) return setVista({ x: r.width / 2, y: r.height / 2, zoom: 1 })
    const x0 = Math.min(...its.map((i) => i.x))
    const y0 = Math.min(...its.map((i) => i.y))
    const x1 = Math.max(...its.map((i) => i.x + i.w))
    const y1 = Math.max(...its.map((i) => i.y + i.h))
    const z = limitar(Math.min((r.width - 80) / (x1 - x0 || 1), (r.height - 140) / (y1 - y0 || 1), 1.2))
    setVista({ zoom: z, x: r.width / 2 - ((x0 + x1) / 2) * z, y: r.height / 2 - ((y0 + y1) / 2) * z })
  }, [])
  // Primeira abertura sem vista salva: enquadra tudo.
  useEffect(() => {
    if (!projeto.quadro.vista) ajustar()
  }, [projeto.quadro.vista, ajustar])

  // ---------- criar ----------
  const adicionar = useCallback(
    (tipo: TipoItem, p: Ponto, extra: Partial<Item> = {}, editar = true) => {
      let n = extra.n
      if (tipo === 'cena' && n == null) n = Math.max(0, ...qRef.current.itens.filter((i) => i.tipo === 'cena').map((i) => i.n ?? 0)) + 1
      const it = criarItem(tipo, p.x, p.y, { ...(tipo === 'cena' ? { n, prompt: '', camera: '' } : {}), ...extra }, zTopo + 1)
      mudar((q) => ({ ...q, itens: [...q.itens, it] }))
      setSel(new Set([it.id]))
      if (editar && (editavel(tipo) || tipo === 'link')) setEditando(it.id)
      tocar('toque')
      return it
    },
    [mudar, zTopo],
  )

  const enviarArquivos = useCallback(
    async (arquivos: File[], p: Ponto, cena?: string) => {
      const imgs = arquivos.filter((f) => /^image\/(jpeg|png|webp|gif)$/.test(f.type))
      if (!imgs.length) return mostrar('Use imagens JPG, PNG, WEBP ou GIF.', { comNav: false })
      for (const [k, f] of imgs.entries()) {
        setEnviando((n) => n + 1)
        try {
          const r = await enviarImagem(projeto.id, f)
          if (cena) {
            alterarItem(cena, { path: r.path, bucket: undefined })
          } else {
            const lado = 320
            const esc = Math.min(1, lado / Math.max(r.w, r.h))
            const w = Math.round(r.w * esc)
            const h = Math.round(r.h * esc)
            const it: Item = { id: novoId(), tipo: 'imagem', x: Math.round(p.x - w / 2 + k * 30), y: Math.round(p.y - h / 2 + k * 30), w, h, z: zTopo + 1 + k, path: r.path }
            mudar((q) => ({ ...q, itens: [...q.itens, it] }))
            setSel(new Set([it.id]))
          }
          tocar('plantar')
        } catch (e) {
          mostrar(e instanceof Error ? e.message : 'Não deu para enviar a imagem.', { comNav: false })
        } finally {
          setEnviando((n) => n - 1)
        }
      }
    },
    [projeto.id, mostrar, alterarItem, mudar, zTopo],
  )

  const apagarSelecionados = useCallback(() => {
    if (selLig) {
      mudar((q) => ({ ...q, ligacoes: q.ligacoes.filter((l) => l.id !== selLig) }))
      setSelLig(null)
      return
    }
    if (!sel.size) return
    mudar((q) => ({ itens: q.itens.filter((i) => !sel.has(i.id)), ligacoes: q.ligacoes.filter((l) => !sel.has(l.de) && !sel.has(l.para)) }))
    setSel(new Set())
    tocar('desmarcar')
  }, [sel, selLig, mudar])

  const duplicar = useCallback(() => {
    if (!sel.size) return
    const mapa = new Map<string, string>()
    const novos = qRef.current.itens
      .filter((i) => sel.has(i.id))
      .map((i, k) => {
        const id = novoId()
        mapa.set(i.id, id)
        return { ...i, id, x: i.x + 30, y: i.y + 30, z: zTopo + 1 + k }
      })
    const ligs = qRef.current.ligacoes.filter((l) => mapa.has(l.de) && mapa.has(l.para)).map((l) => ({ id: novoId(), de: mapa.get(l.de)!, para: mapa.get(l.para)! }))
    mudar((q) => ({ itens: [...q.itens, ...novos], ligacoes: [...q.ligacoes, ...ligs] }))
    setSel(new Set(novos.map((n) => n.id)))
  }, [sel, mudar, zTopo])

  const ordem = useCallback(
    (frente: boolean) => {
      const zMin = Math.min(0, ...qRef.current.itens.map((i) => i.z))
      mudar((q) => ({ ...q, itens: q.itens.map((i) => (sel.has(i.id) ? { ...i, z: frente ? zTopo + 1 : zMin - 1 } : i)) }))
    },
    [sel, mudar, zTopo],
  )

  const ligar = useCallback(
    (de: string, para: string) => {
      if (de === para) return
      if (qRef.current.ligacoes.some((l) => (l.de === de && l.para === para) || (l.de === para && l.para === de))) return
      mudar((q) => ({ ...q, ligacoes: [...q.ligacoes, { id: novoId(), de, para }] }))
      tocar('marcar')
    },
    [mudar],
  )

  /** Mapa mental: cria um ramo ligado ao item (à direita, ou abaixo dos irmãos). */
  const adicionarFilho = useCallback(
    (paiId: string) => {
      const pai = qRef.current.itens.find((i) => i.id === paiId)
      if (!pai) return
      const irmaos = qRef.current.ligacoes.filter((l) => l.de === paiId).map((l) => porId.get(l.para)).filter(Boolean) as Item[]
      const x = pai.x + pai.w + 140 + 100
      const y = irmaos.length ? Math.max(...irmaos.map((i) => i.y + i.h)) + 30 + 80 : pai.y + pai.h / 2
      const it = criarItem('nota', x, y, { cor: pai.tipo === 'nota' && pai.cor !== 'laranja' ? pai.cor : 'amarelo', texto: '' }, zTopo + 1)
      mudar((q) => ({ itens: [...q.itens, it], ligacoes: [...q.ligacoes, { id: novoId(), de: paiId, para: it.id }] }))
      setSel(new Set([it.id]))
      setEditando(it.id)
    },
    [mudar, porId, zTopo],
  )

  // ---------- teclado, colar, roda do mouse ----------
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement
      if (alvo.closest('input, textarea, [contenteditable]')) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) avancar()
        else voltar()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        avancar()
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicar()
      } else if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setSel(new Set(qRef.current.itens.map((i) => i.id)))
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        apagarSelecionados()
      } else if (e.key === 'Escape') {
        setSel(new Set())
        setSelLig(null)
        setFerramenta('selecionar')
        setLigarDe(null)
      } else if (e.key === 'Tab' && sel.size === 1) {
        e.preventDefault()
        adicionarFilho([...sel][0])
      } else if (e.key === 'Enter' && sel.size === 1) {
        const it = porId.get([...sel][0])
        if (it && (editavel(it.tipo) || it.tipo === 'link')) {
          e.preventDefault()
          setEditando(it.id)
        }
      } else if (!mod && !e.altKey) {
        const atalho: Record<string, Ferramenta> = { v: 'selecionar', n: 'nota', t: 'texto', l: 'ligar', c: 'cena' }
        const f = atalho[e.key.toLowerCase()]
        if (f) setFerramenta(f)
      }
    }
    const colar = (e: ClipboardEvent) => {
      const alvo = e.target as HTMLElement
      if (alvo.closest?.('input, textarea, [contenteditable]')) return
      const arquivos = [...(e.clipboardData?.files ?? [])]
      if (arquivos.length) {
        e.preventDefault()
        void enviarArquivos(arquivos, centroDaTela())
        return
      }
      const texto = e.clipboardData?.getData('text/plain')?.trim()
      if (!texto) return
      e.preventDefault()
      if (pareceUrl(texto)) adicionar('link', centroDaTela(), { url: texto }, false)
      else adicionar('nota', centroDaTela(), { texto: texto.slice(0, 2000) }, false)
    }
    window.addEventListener('keydown', tecla)
    window.addEventListener('paste', colar)
    return () => {
      window.removeEventListener('keydown', tecla)
      window.removeEventListener('paste', colar)
    }
  }, [avancar, voltar, duplicar, apagarSelecionados, adicionarFilho, sel, porId, enviarArquivos, centroDaTela, adicionar])

  useEffect(() => {
    const el = palco.current
    if (!el) return
    const roda = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest('textarea') && !e.ctrlKey) return
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) zoomEm(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY)
      else setVista((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
    }
    el.addEventListener('wheel', roda, { passive: false })
    return () => el.removeEventListener('wheel', roda)
  }, [zoomEm])

  // ---------- ponteiro ----------
  const atualizarPinca = () => {
    const pts = [...toques.current.values()]
    if (pts.length < 2) return
    const [a, b] = pts
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    if (!pinca.current) {
      pinca.current = { dist, meio, vista: vRef.current }
      setArrasto(null)
      return
    }
    const p0 = pinca.current
    const r = palco.current!.getBoundingClientRect()
    const z = limitar(p0.vista.zoom * (dist / p0.dist))
    const k = z / p0.vista.zoom
    setVista({ zoom: z, x: meio.x - r.left - (p0.meio.x - r.left - p0.vista.x) * k, y: meio.y - r.top - (p0.meio.y - r.top - p0.vista.y) * k })
  }

  const aoApertarPalco = (e: PE<HTMLDivElement>) => {
    toques.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (toques.current.size >= 2) return atualizarPinca()
    if (e.button !== 0 && e.pointerType === 'mouse' && e.button !== 1) return
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    const p = paraMundo(e.clientX, e.clientY)
    if (ferramenta !== 'selecionar' && ferramenta !== 'ligar') {
      adicionar(ferramenta, p)
      setFerramenta('selecionar')
      return
    }
    setEditando(null)
    setSelLig(null)
    if (e.shiftKey && e.pointerType === 'mouse') setArrasto({ tipo: 'caixa', inicio: p, ate: p })
    else setArrasto({ tipo: 'pan', inicio: { x: e.clientX, y: e.clientY }, vista: vRef.current, moveu: false })
  }

  const aoApertarItem = (e: PE, it: Item) => {
    toques.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (toques.current.size >= 2) return atualizarPinca()
    e.stopPropagation()
    if (editando === it.id) return
    setSelLig(null)
    if (ferramenta === 'ligar') {
      if (!ligarDe) {
        setLigarDe(it.id)
        setSel(new Set([it.id]))
      } else {
        ligar(ligarDe, it.id)
        setLigarDe(null)
        setFerramenta('selecionar')
      }
      return
    }
    let novaSel = sel
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      novaSel = new Set(sel)
      if (novaSel.has(it.id)) novaSel.delete(it.id)
      else novaSel.add(it.id)
    } else if (!sel.has(it.id)) novaSel = new Set([it.id])
    setSel(novaSel)
    if (editando) setEditando(null)
    const p = paraMundo(e.clientX, e.clientY)
    const origens: Record<string, Ponto> = {}
    for (const i of qRef.current.itens) if (novaSel.has(i.id)) origens[i.id] = { x: i.x, y: i.y }
    setArrasto({ tipo: 'mover', inicio: p, origens, moveu: false })
  }

  const aoApertarAlca = (e: PE, it: Item) => {
    e.stopPropagation()
    registrar()
    setArrasto({ tipo: 'redimensionar', id: it.id, inicio: paraMundo(e.clientX, e.clientY), w: it.w, h: it.h, razao: it.tipo === 'imagem' ? it.w / it.h : null })
  }
  const aoApertarLigar = (e: PE, it: Item) => {
    e.stopPropagation()
    setArrasto({ tipo: 'ligar', de: it.id, ate: paraMundo(e.clientX, e.clientY), tela: { x: e.clientX, y: e.clientY }, longe: false })
  }

  const manipuladores = useRef<{ mover: (e: PointerEvent) => void; soltar: (e: PointerEvent) => void } | null>(null)
  manipuladores.current = (() => {
    const mover = (e: PointerEvent) => {
      if (toques.current.has(e.pointerId)) toques.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (toques.current.size >= 2) return atualizarPinca()
      const arrasto = aRef.current
      if (!arrasto) return
      if (arrasto.tipo === 'pan') {
        const dx = e.clientX - arrasto.inicio.x
        const dy = e.clientY - arrasto.inicio.y
        if (!arrasto.moveu && Math.hypot(dx, dy) > 3) setArrasto({ ...arrasto, moveu: true })
        setVista({ ...arrasto.vista, x: arrasto.vista.x + dx, y: arrasto.vista.y + dy })
        return
      }
      const p = paraMundo(e.clientX, e.clientY)
      if (arrasto.tipo === 'mover') {
        const dx = p.x - arrasto.inicio.x
        const dy = p.y - arrasto.inicio.y
        if (!arrasto.moveu) {
          if (Math.hypot(dx, dy) * vRef.current.zoom < 3) return
          registrar()
          setArrasto({ ...arrasto, moveu: true })
        }
        setQuadro((q) => ({ ...q, itens: q.itens.map((i) => (arrasto.origens[i.id] ? { ...i, x: Math.round(arrasto.origens[i.id].x + dx), y: Math.round(arrasto.origens[i.id].y + dy) } : i)) }))
      } else if (arrasto.tipo === 'redimensionar') {
        let w = Math.max(80, arrasto.w + p.x - arrasto.inicio.x)
        let h = Math.max(50, arrasto.h + p.y - arrasto.inicio.y)
        if (arrasto.razao) h = w / arrasto.razao
        w = Math.round(w)
        h = Math.round(h)
        setQuadro((q) => ({ ...q, itens: q.itens.map((i) => (i.id === arrasto.id ? { ...i, w, h } : i)) }))
      } else if (arrasto.tipo === 'ligar') {
        setArrasto({ ...arrasto, ate: p, longe: arrasto.longe || Math.hypot(e.clientX - arrasto.tela.x, e.clientY - arrasto.tela.y) > 8 })
      } else if (arrasto.tipo === 'caixa') {
        setArrasto({ ...arrasto, ate: p })
      }
    }
    const soltar = (e: PointerEvent) => {
      toques.current.delete(e.pointerId)
      if (toques.current.size < 2) pinca.current = null
      const arrasto = aRef.current
      if (!arrasto) return
      if (arrasto.tipo === 'pan' && !arrasto.moveu) setSel(new Set())
      if (arrasto.tipo === 'ligar' && !arrasto.longe) {
        // Foi só um toque no "+": cria um ramo ao lado.
        adicionarFilho(arrasto.de)
      } else if (arrasto.tipo === 'ligar') {
        const alvo = qRef.current.itens
          .filter((i) => i.id !== arrasto.de && arrasto.ate.x >= i.x && arrasto.ate.x <= i.x + i.w && arrasto.ate.y >= i.y && arrasto.ate.y <= i.y + i.h)
          .sort((a, b) => b.z - a.z)[0]
        if (alvo) ligar(arrasto.de, alvo.id)
        else {
          // Soltou no vazio: cria um ramo novo ali, já ligado (como no Miro).
          const de = porId.get(arrasto.de)
          const it = criarItem('nota', arrasto.ate.x, arrasto.ate.y, { cor: de?.tipo === 'nota' ? de.cor : 'amarelo' }, zTopo + 1)
          mudar((q) => ({ itens: [...q.itens, it], ligacoes: [...q.ligacoes, { id: novoId(), de: arrasto.de, para: it.id }] }))
          setSel(new Set([it.id]))
          setEditando(it.id)
        }
      }
      if (arrasto.tipo === 'caixa') {
        const x0 = Math.min(arrasto.inicio.x, arrasto.ate.x)
        const x1 = Math.max(arrasto.inicio.x, arrasto.ate.x)
        const y0 = Math.min(arrasto.inicio.y, arrasto.ate.y)
        const y1 = Math.max(arrasto.inicio.y, arrasto.ate.y)
        setSel(new Set(qRef.current.itens.filter((i) => i.x < x1 && i.x + i.w > x0 && i.y < y1 && i.y + i.h > y0).map((i) => i.id)))
      }
      setArrasto(null)
    }
    return { mover, soltar }
  })()
  useEffect(() => {
    const mover = (e: PointerEvent) => manipuladores.current?.mover(e)
    const soltar = (e: PointerEvent) => manipuladores.current?.soltar(e)
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [])

  // ---------- render ----------
  const selecionados = quadro.itens.filter((i) => sel.has(i.id))
  const unico = selecionados.length === 1 ? selecionados[0] : null
  const temNota = selecionados.some((i) => i.tipo === 'nota')
  const caixaSel = selecionados.length
    ? {
        x: Math.min(...selecionados.map((i) => i.x)),
        y: Math.min(...selecionados.map((i) => i.y)),
        x1: Math.max(...selecionados.map((i) => i.x + i.w)),
      }
    : null
  const barraPos = caixaSel ? { left: ((caixaSel.x + caixaSel.x1) / 2) * vista.zoom + vista.x, top: caixaSel.y * vista.zoom + vista.y } : null
  const ordenados = useMemo(() => [...quadro.itens].sort((a, b) => a.z - b.z), [quadro.itens])

  const FERRAMENTAS: { id: Ferramenta | 'imagem'; rotulo: string; icone: typeof StickyNote; atalho?: string }[] = [
    { id: 'selecionar', rotulo: 'Selecionar e mover', icone: MousePointer2, atalho: 'V' },
    { id: 'nota', rotulo: 'Nota', icone: StickyNote, atalho: 'N' },
    { id: 'texto', rotulo: 'Texto', icone: Type, atalho: 'T' },
    { id: 'titulo', rotulo: 'Título', icone: Heading1 },
    { id: 'imagem', rotulo: 'Imagem ou print', icone: ImagePlus },
    { id: 'link', rotulo: 'Link de referência', icone: Link2 },
    { id: 'cena', rotulo: 'Cena (storyboard)', icone: Clapperboard, atalho: 'C' },
    { id: 'ligar', rotulo: 'Ligar itens (mapa mental)', icone: Spline, atalho: 'L' },
  ]

  return (
    <div className="st" data-ferramenta={ferramenta}>
      <header className="st-topo">
        <Link to="/studio" className="shell-voltar" aria-label="Voltar aos projetos">
          <ChevronLeft aria-hidden />
          <span>Projetos</span>
        </Link>
        <input
          className="st-titulo"
          value={titulo}
          maxLength={120}
          aria-label="Nome do projeto"
          onChange={(e) => setTitulo(e.target.value)}
          onBlur={async () => {
            const t = titulo.trim() || 'Sem título'
            setTitulo(t)
            if (t !== projeto.titulo) await supabase.from('studio_projetos').update({ titulo: t }).eq('id', projeto.id)
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <span className="st-salvo" data-estado={salvo} role="status">
          {enviando > 0 ? 'Enviando imagem…' : salvo === 'salvando' ? 'Salvando…' : salvo === 'erro' ? 'Não salvou' : 'Salvo'}
        </span>
        <div className="st-topo-acoes">
          <button className="btn-icone" onClick={voltar} disabled={!desfazer.current.length} aria-label="Desfazer (Ctrl+Z)">
            <Undo2 aria-hidden />
          </button>
          <button className="btn-icone" onClick={avancar} disabled={!refazer.current.length} aria-label="Refazer (Ctrl+Shift+Z)">
            <Redo2 aria-hidden />
          </button>
          <BotaoSom />
        </div>
      </header>

      <div
        ref={palco}
        className="st-palco"
        data-arrastando={arrasto?.tipo === 'pan' || undefined}
        style={{ backgroundPosition: `${vista.x}px ${vista.y}px`, backgroundSize: `${24 * vista.zoom}px ${24 * vista.zoom}px` }}
        onPointerDown={aoApertarPalco}
        onDoubleClick={(e) => {
          if (e.target !== palco.current) return
          adicionar('nota', paraMundo(e.clientX, e.clientY))
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const fs = [...e.dataTransfer.files]
          if (fs.length) void enviarArquivos(fs, paraMundo(e.clientX, e.clientY))
          else {
            const t = e.dataTransfer.getData('text/plain')?.trim()
            if (t) adicionar(pareceUrl(t) ? 'link' : 'nota', paraMundo(e.clientX, e.clientY), pareceUrl(t) ? { url: t } : { texto: t }, false)
          }
        }}
      >
        <div className="st-mundo" style={{ transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.zoom})` }}>
          <svg className="st-ligacoes" aria-hidden>
            <defs>
              <marker id="st-seta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="currentColor" />
              </marker>
            </defs>
            <g transform="translate(50000 50000)">
            {quadro.ligacoes.map((l: Ligacao) => {
              const a = porId.get(l.de)
              const b = porId.get(l.para)
              if (!a || !b) return null
              const pa = borda(a, centro(b))
              const pb = borda(b, centro(a))
              const meioX = (pa.x + pb.x) / 2
              const d = `M${pa.x} ${pa.y} C${meioX} ${pa.y} ${meioX} ${pb.y} ${pb.x} ${pb.y}`
              return (
                <g key={l.id} className="st-lig" data-sel={selLig === l.id || undefined}>
                  <path
                    d={d}
                    className="st-lig-alvo"
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      setSel(new Set())
                      setSelLig(l.id)
                    }}
                  />
                  <path d={d} className="st-lig-linha" markerEnd="url(#st-seta)" />
                </g>
              )
            })}
            {arrasto?.tipo === 'ligar' && arrasto.longe && porId.get(arrasto.de) && (
              <path className="st-lig-linha st-lig-provisoria" d={`M${centro(porId.get(arrasto.de)!).x} ${centro(porId.get(arrasto.de)!).y} L${arrasto.ate.x} ${arrasto.ate.y}`} />
            )}
            </g>
          </svg>

          {ordenados.map((it) => (
            <div
              key={it.id}
              className={`st-item st-item-${it.tipo}`}
              data-sel={sel.has(it.id) || undefined}
              data-ligando={ligarDe === it.id || undefined}
              style={{ left: it.x, top: it.y, width: it.w, height: it.tipo === 'texto' ? undefined : it.h, minHeight: it.tipo === 'texto' ? it.h : undefined, zIndex: it.z }}
              onPointerDown={(e) => aoApertarItem(e, it)}
              onDoubleClick={(e) => {
                e.stopPropagation()
                if (editavel(it.tipo) || it.tipo === 'link') setEditando(it.id)
              }}
            >
              <Cartao
                it={it}
                selecionado={sel.has(it.id)}
                editando={editando === it.id}
                aoAlterar={(c, h = true) => alterarItem(it.id, c, h)}
                aoTerminarEdicao={() => setEditando(null)}
                aoEnviarImagemCena={(id) => {
                  destinoImagem.current = { cena: id }
                  arquivo.current?.click()
                }}
              />
              {unico?.id === it.id && editando !== it.id && (
                <>
                  <span className="st-alca" onPointerDown={(e) => aoApertarAlca(e, it)} aria-hidden />
                  <span
                    className="st-ramo"
                    title="Arraste até outro item para ligar, ou clique para criar um ramo"
                    onPointerDown={(e) => aoApertarLigar(e, it)}
                    aria-hidden
                  >
                    <Plus />
                  </span>
                </>
              )}
            </div>
          ))}

          {arrasto?.tipo === 'caixa' && (
            <div
              className="st-caixa"
              style={{
                left: Math.min(arrasto.inicio.x, arrasto.ate.x),
                top: Math.min(arrasto.inicio.y, arrasto.ate.y),
                width: Math.abs(arrasto.ate.x - arrasto.inicio.x),
                height: Math.abs(arrasto.ate.y - arrasto.inicio.y),
              }}
            />
          )}
        </div>

        {barraPos && !arrasto && !editando && (
          <div className="st-barra-sel" style={{ left: barraPos.left, top: barraPos.top }} onPointerDown={(e) => e.stopPropagation()}>
            {temNota &&
              CORES.map((c) => (
                <button
                  key={c.id}
                  className="st-cor"
                  style={{ background: c.fundo }}
                  aria-label={`Cor ${c.rotulo}`}
                  aria-pressed={selecionados.every((i) => i.tipo !== 'nota' || i.cor === c.id)}
                  onClick={() => mudar((q) => ({ ...q, itens: q.itens.map((i) => (sel.has(i.id) && i.tipo === 'nota' ? { ...i, cor: c.id as Cor } : i)) }))}
                />
              ))}
            {temNota && <span className="st-barra-div" />}
            {unico?.tipo === 'link' && unico.url && (
              <a className="btn-icone" href={unico.url} target="_blank" rel="noreferrer noopener" aria-label="Abrir link">
                <ExternalLink aria-hidden />
              </a>
            )}
            <button className="btn-icone" onClick={() => ordem(true)} aria-label="Trazer para a frente">
              <ArrowUpToLine aria-hidden />
            </button>
            <button className="btn-icone" onClick={() => ordem(false)} aria-label="Mandar para trás">
              <ArrowDownToLine aria-hidden />
            </button>
            <button className="btn-icone" onClick={duplicar} aria-label="Duplicar (Ctrl+D)">
              <Copy aria-hidden />
            </button>
            <button className="btn-icone st-apagar" onClick={apagarSelecionados} aria-label="Apagar (Delete)">
              <Trash2 aria-hidden />
            </button>
          </div>
        )}
        {selLig && (
          <div className="st-barra-sel st-barra-lig" onPointerDown={(e) => e.stopPropagation()}>
            <button className="btn btn-fantasma" onClick={apagarSelecionados}>
              <Trash2 aria-hidden /> Apagar ligação
            </button>
          </div>
        )}

        {quadro.itens.length <= 1 && (
          <p className="st-dica">
            Dois cliques: nota · Ctrl+V: colar print ou link · Arraste imagens para cá · Tab: novo ramo · Roda: mover · Ctrl+roda ou pinça: zoom
          </p>
        )}
        {ferramenta !== 'selecionar' && (
          <p className="st-dica st-dica-ferramenta">
            {ferramenta === 'ligar' ? (ligarDe ? 'Agora toque no item de destino' : 'Toque no primeiro item') : 'Toque no quadro para colocar'}
            <button className="btn btn-fantasma" onClick={() => (setFerramenta('selecionar'), setLigarDe(null))}>
              Cancelar
            </button>
          </p>
        )}
      </div>

      <nav className="st-ferramentas" aria-label="Ferramentas">
        {FERRAMENTAS.map((f) => (
          <button
            key={f.id}
            className="st-ferramenta"
            aria-pressed={ferramenta === f.id}
            aria-label={f.rotulo}
            title={`${f.rotulo}${f.atalho ? ` (${f.atalho})` : ''}`}
            onClick={() => {
              if (f.id === 'imagem') {
                destinoImagem.current = { ponto: centroDaTela() }
                arquivo.current?.click()
              } else {
                setLigarDe(null)
                setFerramenta(ferramenta === f.id ? 'selecionar' : f.id)
              }
            }}
          >
            <f.icone aria-hidden />
          </button>
        ))}
      </nav>

      <div className="st-zoom" role="group" aria-label="Zoom">
        <button className="btn-icone" onClick={() => zoomEm(1 / 1.25)} aria-label="Diminuir zoom">
          <Minus aria-hidden />
        </button>
        <button className="st-zoom-valor" onClick={() => setVista((v) => ({ ...v, zoom: 1 }))} aria-label="Zoom 100%">
          {Math.round(vista.zoom * 100)}%
        </button>
        <button className="btn-icone" onClick={() => zoomEm(1.25)} aria-label="Aumentar zoom">
          <Plus aria-hidden />
        </button>
        <button className="btn-icone" onClick={ajustar} aria-label="Ver tudo">
          <Maximize aria-hidden />
        </button>
      </div>

      <input
        ref={arquivo}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => {
          const fs = [...(e.target.files ?? [])]
          e.target.value = ''
          const d = destinoImagem.current
          if (fs.length) void enviarArquivos(d.cena ? fs.slice(0, 1) : fs, d.ponto ?? centroDaTela(), d.cena)
        }}
      />
    </div>
  )
}
