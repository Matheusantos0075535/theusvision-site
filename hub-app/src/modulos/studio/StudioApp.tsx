import { Clapperboard, Lightbulb, Network, Plus, Search, Sparkles, Square, Trash2, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { ShellModulo } from '../../components/compartilhado/ShellModulo'
import { useToast } from '../../components/ui/Toast'
import { mensagemDeErroBanco } from '../../lib/erros'
import { tocar } from '../../lib/som'
import { supabase } from '../../lib/supabase'
import '../dia/dia.css'
import '../ideias/ideias.css'
import { apagarImagens, BUCKET, corDe, MODELOS, quadroDoModelo, type Modelo, type Projeto } from './dados'
import { QuadroTela } from './Quadro'
import './studio.css'

const ICONE_MODELO: Record<Modelo, LucideIcon> = { branco: Square, storyboard: Clapperboard, moodboard: Sparkles, mapa: Network }
const CAMPOS = 'id, titulo, descricao, ideia_id, quadro, criado_em, atualizado_em'

/** Miniatura do quadro: só retângulos coloridos, para reconhecer o projeto de relance. */
function Miniatura({ p }: { p: Projeto }) {
  const itens = p.quadro?.itens ?? []
  if (!itens.length) return <span className="st-mini st-mini-vazia" aria-hidden />
  const x0 = Math.min(...itens.map((i) => i.x)) - 20
  const y0 = Math.min(...itens.map((i) => i.y)) - 20
  const x1 = Math.max(...itens.map((i) => i.x + i.w)) + 20
  const y1 = Math.max(...itens.map((i) => i.y + i.h)) + 20
  const cor = (t: string, c?: string) =>
    t === 'nota' ? corDe(c as never).fundo : t === 'imagem' ? '#7a5fb0' : t === 'cena' ? '#ffffff' : t === 'link' ? '#9fd0ff' : 'rgba(255,255,255,0.5)'
  return (
    <svg className="st-mini" viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
      {[...itens]
        .sort((a, b) => a.z - b.z)
        .slice(0, 80)
        .map((i) => (
          <rect key={i.id} x={i.x} y={i.y} width={i.w} height={i.tipo === 'texto' || i.tipo === 'titulo' ? i.h / 3 : i.h} rx={Math.min(i.w, i.h) * 0.08} fill={cor(i.tipo, i.cor)} />
        ))}
    </svg>
  )
}

function NovoProjeto({ aoFechar }: { aoFechar: () => void }) {
  const navegar = useNavigate()
  const { mostrar } = useToast()
  const [titulo, setTitulo] = useState('')
  const [modelo, setModelo] = useState<Modelo>('storyboard')
  const [criando, setCriando] = useState(false)
  async function criar() {
    const t = titulo.trim() || 'Novo projeto'
    setCriando(true)
    const r = await supabase.from('studio_projetos').insert({ titulo: t, quadro: quadroDoModelo(modelo, t) }).select('id').single()
    setCriando(false)
    if (r.error) return mostrar(mensagemDeErroBanco(r.error), { comNav: true })
    tocar('sucesso')
    navegar(`/studio/${(r.data as { id: string }).id}`)
  }
  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha" role="dialog" aria-modal="true" aria-labelledby="st-novo" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <h2 id="st-novo" className="dia-folha-titulo">
          Novo projeto
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void criar()
          }}
          className="st-novo"
        >
          <input className="entrada" autoFocus maxLength={120} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Nome do projeto (ex.: Reels lançamento)" aria-label="Nome do projeto" />
          <div className="st-modelos" role="radiogroup" aria-label="Começar com">
            {MODELOS.map((m) => {
              const I = ICONE_MODELO[m.id]
              return (
                <button key={m.id} type="button" role="radio" aria-checked={modelo === m.id} className="st-modelo" onClick={() => setModelo(m.id)}>
                  <I aria-hidden />
                  <b>{m.nome}</b>
                  <small>{m.apoio}</small>
                </button>
              )
            })}
          </div>
          <button className="btn btn-verde btn-grande" disabled={criando}>
            {criando ? 'Criando…' : 'Criar e abrir'}
          </button>
        </form>
      </div>
    </div>
  )
}

const quando = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 60_000
  if (d < 2) return 'agora'
  if (d < 60) return `há ${Math.round(d)} min`
  if (d < 60 * 24) return `há ${Math.round(d / 60)} h`
  const dias = Math.round(d / 60 / 24)
  return dias === 1 ? 'ontem' : `há ${dias} dias`
}

function Lista() {
  const { mostrar } = useToast()
  const [projetos, setProjetos] = useState<Projeto[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [novo, setNovo] = useState(false)
  const [busca, setBusca] = useState('')

  const carregar = async () => {
    setErro(null)
    const r = await supabase.from('studio_projetos').select(CAMPOS).order('atualizado_em', { ascending: false })
    if (r.error) return setErro(mensagemDeErroBanco(r.error))
    setProjetos(r.data as Projeto[])
  }
  useEffect(() => {
    void carregar()
  }, [])
  const lista = useMemo(() => (projetos ?? []).filter((p) => p.titulo.toLowerCase().includes(busca.trim().toLowerCase())), [projetos, busca])

  async function apagar(p: Projeto) {
    if (!window.confirm(`Apagar o projeto "${p.titulo}" e as imagens dele? Não dá para desfazer.`)) return
    const r = await supabase.from('studio_projetos').delete().eq('id', p.id)
    if (r.error) return mostrar(mensagemDeErroBanco(r.error), { comNav: true })
    void apagarImagens((p.quadro?.itens ?? []).filter((i) => i.path && (!i.bucket || i.bucket === BUCKET)).map((i) => i.path!))
    setProjetos((l) => l?.filter((x) => x.id !== p.id) ?? null)
  }

  return (
    <div className="st-lista-tela">
      <section className="dia-hero st-hero">
        <span className="dia-hero-tipo">Creative Studio</span>
        <h2 className="dia-hero-data">
          <span>Do rascunho</span>à cena pronta
        </h2>
        <p className="st-hero-apoio">Mood boards, mapas mentais, prints e storyboards para seus vídeos com IA. Um quadro infinito por projeto.</p>
        <button className="btn btn-verde btn-grande" onClick={() => setNovo(true)}>
          <Plus aria-hidden /> Novo projeto
        </button>
      </section>

      {erro && (
        <div className="bloco-erro" role="alert">
          <p>{erro}</p>
          <button className="btn btn-secundario" onClick={() => void carregar()}>
            Tentar de novo
          </button>
        </div>
      )}
      {!projetos && !erro && (
        <div className="carregando" role="status" aria-label="Carregando">
          <span className="giro" />
        </div>
      )}
      {projetos && projetos.length > 3 && (
        <label className="id-busca">
          <Search aria-hidden />
          <input className="entrada" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar projeto" aria-label="Buscar projeto" />
        </label>
      )}
      {projetos && projetos.length === 0 && (
        <p className="vazio">
          Nenhum projeto ainda. Crie o primeiro, ou abra uma ideia no TheusVision Ideias e toque em <b>Criar no Creative Studio</b>.
        </p>
      )}
      <ul className="st-projetos">
        {lista.map((p) => (
          <li key={p.id} className="st-projeto">
            <Link to={`/studio/${p.id}`} className="st-projeto-link">
              <Miniatura p={p} />
              <span className="st-projeto-textos">
                <b>{p.titulo}</b>
                <small>
                  {p.ideia_id && (
                    <span className="st-de-ideia">
                      <Lightbulb aria-hidden /> ideia ·{' '}
                    </span>
                  )}
                  {(p.quadro?.itens ?? []).length} itens · {quando(p.atualizado_em)}
                </small>
              </span>
            </Link>
            <button className="btn-icone st-projeto-apagar" onClick={() => void apagar(p)} aria-label={`Apagar ${p.titulo}`}>
              <Trash2 aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      {novo && <NovoProjeto aoFechar={() => setNovo(false)} />}
    </div>
  )
}

function AbrirQuadro() {
  const { id } = useParams()
  const [p, setP] = useState<Projeto | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => {
    let vivo = true
    setP(null)
    supabase
      .from('studio_projetos')
      .select(CAMPOS)
      .eq('id', id ?? '')
      .maybeSingle()
      .then((r) => {
        if (!vivo) return
        if (r.error) setErro(mensagemDeErroBanco(r.error))
        else if (!r.data) setErro('Projeto não encontrado.')
        else setP(r.data as Projeto)
      })
    return () => {
      vivo = false
    }
  }, [id])
  if (erro)
    return (
      <div className="bloco-erro st-erro" role="alert">
        <p>{erro}</p>
        <Link className="btn btn-secundario" to="/studio">
          Voltar aos projetos
        </Link>
      </div>
    )
  if (!p)
    return (
      <div className="carregando" role="status" aria-label="Carregando">
        <span className="giro" />
      </div>
    )
  return <QuadroTela key={p.id} projeto={p} />
}

export default function StudioApp() {
  return (
    <Routes>
      <Route
        index
        element={
          <ShellModulo titulo="Creative Studio" abas={[]}>
            <Lista />
          </ShellModulo>
        }
      />
      <Route path=":id" element={<AbrirQuadro />} />
    </Routes>
  )
}
