import { ClipboardPaste, ImagePlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mensagemDeErroBanco } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { AREAS, useIdeias, type Area } from './dados'
import { ImagemIdeia, apagarImagem, enviarImagem } from './imagem'
import { ROTULO_LINK, normalizarLink, tipoDoLink } from './link'
import { tocar } from '../../lib/som'

/** Captura rápida: cola o link, dá um nome e pronto. O resto você completa depois. */
export function NovaIdeia({ aoFechar }: { aoFechar: () => void }) {
  const { recarregar } = useIdeias()
  const navegar = useNavigate()
  const [link, setLink] = useState('')
  const [titulo, setTitulo] = useState('')
  const [proposito, setProposito] = useState('')
  const [quando, setQuando] = useState('')
  const [area, setArea] = useState<Area | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const arquivoRef = useRef<HTMLInputElement>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)

  useEffect(() => () => void (previa && URL.revokeObjectURL(previa)), [previa])

  function escolher(f: File | undefined) {
    if (!f) return
    if (!f.type.startsWith('image/')) return setErro('Escolha um arquivo de imagem.')
    if (f.size > 25 * 1024 * 1024) return setErro('Essa imagem é muito grande (máximo 25 MB).')
    setErro(null)
    setArquivo(f)
    setPrevia(URL.createObjectURL(f))
  }

  useEffect(() => {
    ref.current?.focus()
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aoFechar])

  async function colar() {
    try {
      const t = await navigator.clipboard.readText()
      if (t) setLink(t.trim())
    } catch {
      setErro('O navegador não deixou colar automático. Segure no campo e use "Colar".')
    }
  }

  async function salvar() {
    const l = normalizarLink(link)
    const nome = titulo.trim() || (l ? `Referência do ${ROTULO_LINK[tipoDoLink(l)]}` : '')
    if (!nome) return setErro('Dê um nome para a ideia ou cole um link.')
    setSalvando(true)
    const { data, error } = await supabase
      .from('ideias')
      .insert({ titulo: nome, link: l || null, proposito: proposito.trim() || null, executar_em: quando || null, area, status: quando ? 'planejando' : 'ideia' })
      .select('id')
      .single()
    if (error) {
      setSalvando(false)
      return setErro(mensagemDeErroBanco(error))
    }
    const novoId = (data as { id: string }).id
    if (arquivo) {
      try {
        const caminho = await enviarImagem(novoId, arquivo)
        const r = await supabase.from('ideias').update({ imagem_path: caminho }).eq('id', novoId)
        if (r.error) await apagarImagem(caminho)
      } catch {
        /* a ideia já foi guardada; a imagem pode ser adicionada depois dentro dela */
      }
    }
    setSalvando(false)
    tocar('sucesso')
    await recarregar()
    aoFechar()
    navegar(`/ideias/ideia/${novoId}`)
  }

  return (
    <div className="folha-fundo" onClick={aoFechar}>
      <div className="folha id-nova" role="dialog" aria-modal="true" aria-labelledby="id-nova" onClick={(e) => e.stopPropagation()}>
        <div className="folha-alca" aria-hidden />
        <div className="tr-folha-topo">
          <h2 id="id-nova">Nova ideia</h2>
          <button className="btn-icone" onClick={aoFechar} aria-label="Fechar">
            <X aria-hidden />
          </button>
        </div>
        <label className="campo">
          <span>Link de referência (Instagram, YouTube, site)</span>
          <div className="id-colar">
            <input ref={ref} className="entrada" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="instagram.com/reel/..." />
            <button type="button" className="btn btn-secundario" onClick={() => void colar()}>
              <ClipboardPaste aria-hidden /> Colar
            </button>
          </div>
        </label>
        <div className="campo">
          <span>Imagem da ideia (opcional)</span>
          <input ref={arquivoRef} type="file" accept="image/*" hidden onChange={(e) => escolher(e.target.files?.[0])} />
          {previa ? (
            <div className="id-img-previa">
              <ImagemIdeia path={null} titulo={titulo || 'nova ideia'} previa={previa} />
              <div className="dia-prio-botoes">
                <button type="button" className="btn btn-secundario" onClick={() => arquivoRef.current?.click()}>
                  Trocar
                </button>
                <button
                  type="button"
                  className="btn btn-fantasma"
                  onClick={() => {
                    setArquivo(null)
                    setPrevia(null)
                  }}
                >
                  Tirar
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="id-img id-img-vazia" onClick={() => arquivoRef.current?.click()}>
              <ImagePlus aria-hidden />
              <span>Escolher da galeria ou tirar foto</span>
            </button>
          )}
        </div>
        <label className="campo">
          <span>Nome da ideia</span>
          <input className="entrada" maxLength={140} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Série de reels mostrando bastidores" />
        </label>
        <label className="campo">
          <span>Qual o propósito?</span>
          <textarea className="entrada" rows={2} maxLength={1000} value={proposito} onChange={(e) => setProposito(e.target.value)} placeholder="Por que essa ideia importa?" />
        </label>
        <label className="campo">
          <span>Quando quero executar (opcional)</span>
          <input className="entrada" type="date" value={quando} onChange={(e) => setQuando(e.target.value)} />
        </label>
        <div className="tr-chips" role="group" aria-label="Área">
          {AREAS.map((a) => (
            <button key={a.id} type="button" className="dia-chip" aria-pressed={area === a.id} onClick={() => setArea(area === a.id ? null : a.id)}>
              {a.rotulo}
            </button>
          ))}
        </div>
        {erro && (
          <div className="aviso aviso-erro" role="alert">
            {erro}
          </div>
        )}
        <button className="btn btn-verde btn-grande" onClick={() => void salvar()} disabled={salvando}>
          {salvando ? 'Guardando…' : 'Guardar ideia'}
        </button>
      </div>
    </div>
  )
}
